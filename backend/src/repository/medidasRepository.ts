import { prisma } from '../services/db';
import { ehVariavelCensoDemografico, REDE_CENSO_DEMOGRAFICO, ETAPA_CENSO_DEMOGRAFICO } from '../services/censoDemografico';

export interface FilterParams {
  municipios?: string[];
  anoInicio?: number;
  anoFim?: number;
  rede?: string;
  etapa?: string;
  variavel?: string;
}

export interface IndicadoresResult {
  totalMatriculas: number | null;
  totalOfertasEscolas: number | null;
  taxaAprovacaoPonderada: number | null;
  taxaAbandonoPonderada: number | null;
  taxaAnalfabetismoMedia: number | null;
  variacaoMatriculas: number | null;
}

export interface SerieItem {
  ano: number;
  valor: number | null;
}

export interface RankingItem {
  co_mun: string;
  no_mun: string;
  valor: number;
}

export interface TabelaResult {
  itens: any[];
  total: number;
  pagina: number;
  tamanho: number;
  paginas: number;
}

export async function getFiltros() {
  const [municipiosRaw, anosRaw, redesRaw, etapasRaw, variaveisRaw, totalMedidas] =
    await Promise.all([
      prisma.medida.findMany({
        select: { co_mun: true, no_mun: true },
        distinct: ['co_mun'],
        orderBy: { no_mun: 'asc' },
      }),
      prisma.medida.findMany({
        select: { ano: true },
        distinct: ['ano'],
        orderBy: { ano: 'asc' },
      }),
      prisma.medida.findMany({
        select: { ensino_rede: true },
        distinct: ['ensino_rede'],
      }),
      prisma.medida.findMany({
        select: { ensino_tipo: true },
        distinct: ['ensino_tipo'],
      }),
      prisma.medida.findMany({
        select: { variavel: true },
        distinct: ['variavel'],
      }),
      prisma.medida.count(),
    ]);

  return {
    municipios: municipiosRaw,
    anos: anosRaw.map((a) => a.ano),
    redes: redesRaw.map((r) => r.ensino_rede),
    etapas: etapasRaw.map((e) => e.ensino_tipo),
    variaveis: variaveisRaw.map((v) => v.variavel),
    totalMedidas,
  };
}


function buildWhereClause(params: FilterParams) {
  const where: any = {};

  if (params.municipios && params.municipios.length > 0) {
    where.co_mun = { in: params.municipios };
  }

  if (params.anoInicio !== undefined || params.anoFim !== undefined) {
    where.ano = {};
    if (params.anoInicio !== undefined) where.ano.gte = params.anoInicio;
    if (params.anoFim !== undefined) where.ano.lte = params.anoFim;
  }

  if (params.variavel) {
    where.variavel = params.variavel;

    // Variáveis do censo_demografico têm rede/etapa fixas e diferentes das variáveis
    // educacionais. Ignorar quaisquer filtros de rede/etapa passados pelo usuário e
    // forçar os únicos valores presentes no CSV para essas variáveis.
    if (ehVariavelCensoDemografico(params.variavel)) {
      where.ensino_rede = REDE_CENSO_DEMOGRAFICO;
      where.ensino_tipo = ETAPA_CENSO_DEMOGRAFICO;
    } else {
      if (params.rede) where.ensino_rede = params.rede;
      if (params.etapa) where.ensino_tipo = params.etapa;
    }
  } else {
    if (params.rede) where.ensino_rede = params.rede;
    if (params.etapa) where.ensino_tipo = params.etapa;
  }

  return where;
}

export async function getIndicadores(params: FilterParams): Promise<IndicadoresResult> {
  const whereBase = buildWhereClause(params);

  // 1. Total Matrículas (Default ensino_rede = 'Total' if not specified to prevent multi-counting)
  const whereMatricula = {
    ...whereBase,
    variavel: 'Matrícula',
    ensino_rede: params.rede || 'Total',
  };

  const sumMatriculas = await prisma.medida.aggregate({
    where: whereMatricula,
    _sum: { valor: true },
  });

  // 2. Total Ofertas de Escolas
  const whereEscolas = {
    ...whereBase,
    variavel: 'Escolas',
    ensino_rede: params.rede || 'Total',
  };

  const sumEscolas = await prisma.medida.aggregate({
    where: whereEscolas,
    _sum: { valor: true },
  });

  // 3. Taxa de Aprovação Ponderada: sum(taxa * matriculas) / sum(matriculas)
  const whereAprov = {
    ...whereBase,
    variavel: 'Taxa de Aprovação',
    ensino_rede: params.rede || 'Total',
  };

  const aprovRows = await prisma.medida.findMany({
    where: whereAprov,
    select: { co_mun: true, ano: true, ensino_tipo: true, valor: true },
  });

  let taxaAprovacaoPonderada: number | null = null;
  if (aprovRows.length > 0) {
    // Fetch matching enrollments
    const matrForAprov = await prisma.medida.findMany({
      where: {
        ...whereBase,
        variavel: 'Matrícula',
        ensino_rede: params.rede || 'Total',
      },
      select: { co_mun: true, ano: true, ensino_tipo: true, valor: true },
    });

    const matrMap = new Map<string, number>();
    for (const m of matrForAprov) {
      const key = `${m.co_mun}_${m.ano}_${m.ensino_tipo}`;
      matrMap.set(key, m.valor);
    }

    let weightedSum = 0;
    let totalWeight = 0;
    let simpleSum = 0;

    for (const r of aprovRows) {
      const key = `${r.co_mun}_${r.ano}_${r.ensino_tipo}`;
      const weight = matrMap.get(key) || 0;
      if (weight > 0) {
        weightedSum += r.valor * weight;
        totalWeight += weight;
      }
      simpleSum += r.valor;
    }

    taxaAprovacaoPonderada = totalWeight > 0 ? weightedSum / totalWeight : simpleSum / aprovRows.length;
  }

  // 4. Taxa de Abandono Ponderada
  const whereAbandono = {
    ...whereBase,
    variavel: 'Taxa de Abandono',
    ensino_rede: params.rede || 'Total',
  };

  const abandonoRows = await prisma.medida.findMany({
    where: whereAbandono,
    select: { co_mun: true, ano: true, ensino_tipo: true, valor: true },
  });

  let taxaAbandonoPonderada: number | null = null;
  if (abandonoRows.length > 0) {
    const matrForAbandono = await prisma.medida.findMany({
      where: {
        ...whereBase,
        variavel: 'Matrícula',
        ensino_rede: params.rede || 'Total',
      },
      select: { co_mun: true, ano: true, ensino_tipo: true, valor: true },
    });

    const matrMap = new Map<string, number>();
    for (const m of matrForAbandono) {
      const key = `${m.co_mun}_${m.ano}_${m.ensino_tipo}`;
      matrMap.set(key, m.valor);
    }

    let weightedSum = 0;
    let totalWeight = 0;
    let simpleSum = 0;

    for (const r of abandonoRows) {
      const key = `${r.co_mun}_${r.ano}_${r.ensino_tipo}`;
      const weight = matrMap.get(key) || 0;
      if (weight > 0) {
        weightedSum += r.valor * weight;
        totalWeight += weight;
      }
      simpleSum += r.valor;
    }

    taxaAbandonoPonderada = totalWeight > 0 ? weightedSum / totalWeight : simpleSum / abandonoRows.length;
  }

  // 5. Taxa de Analfabetismo Média
  const whereAnal = {
    ...whereBase,
    variavel: 'Taxa de Analfabetismo',
  };
  const analRows = await prisma.medida.aggregate({
    where: whereAnal,
    _avg: { valor: true },
  });

  // 6. Variação de Matrículas (Ano a Ano ou período)
  const anosDisponiveis = await prisma.medida.findMany({
    where: whereMatricula,
    select: { ano: true },
    distinct: ['ano'],
    orderBy: { ano: 'asc' },
  });

  let variacaoMatriculas: number | null = null;
  if (anosDisponiveis.length >= 2) {
    const minAno = anosDisponiveis[0].ano;
    const maxAno = anosDisponiveis[anosDisponiveis.length - 1].ano;

    const valMin = await prisma.medida.aggregate({
      where: { ...whereMatricula, ano: minAno },
      _sum: { valor: true },
    });
    const valMax = await prisma.medida.aggregate({
      where: { ...whereMatricula, ano: maxAno },
      _sum: { valor: true },
    });

    if (valMin._sum.valor && valMin._sum.valor > 0 && valMax._sum.valor !== null) {
      variacaoMatriculas = ((valMax._sum.valor - valMin._sum.valor) / valMin._sum.valor) * 100;
    }
  }

  return {
    totalMatriculas: sumMatriculas._sum.valor ?? null,
    totalOfertasEscolas: sumEscolas._sum.valor ?? null,
    taxaAprovacaoPonderada,
    taxaAbandonoPonderada,
    taxaAnalfabetismoMedia: analRows._avg.valor ?? null,
    variacaoMatriculas,
  };
}

export async function getSeries(params: FilterParams & { variavel: string }): Promise<SerieItem[]> {
  const whereBase = buildWhereClause(params);

  // Matrícula e Escolas: default rede = 'Total' se não especificado (evita dupla contagem)
  // Variáveis do censo demográfico já têm rede/etapa sobrescritas em buildWhereClause
  if ((params.variavel === 'Matrícula' || params.variavel === 'Escolas') && !params.rede) {
    whereBase.ensino_rede = 'Total';
  }

  const isRate = params.variavel.startsWith('Taxa');

  const rows = await prisma.medida.findMany({
    where: whereBase,
    select: { ano: true, valor: true, co_mun: true, ensino_tipo: true },
  });

  const anosSet = new Set<number>();

  // Fetch all available years in dataset for consistency
  const allAnos = await prisma.medida.findMany({
    select: { ano: true },
    distinct: ['ano'],
    orderBy: { ano: 'asc' },
  });
  allAnos.forEach((a) => anosSet.add(a.ano));

  const mapByYear = new Map<number, number[]>();
  for (const r of rows) {
    if (!mapByYear.has(r.ano)) mapByYear.set(r.ano, []);
    mapByYear.get(r.ano)!.push(r.valor);
  }

  const series: SerieItem[] = [];
  for (const ano of Array.from(anosSet).sort((a, b) => a - b)) {
    if (params.anoInicio && ano < params.anoInicio) continue;
    if (params.anoFim && ano > params.anoFim) continue;

    const values = mapByYear.get(ano);
    if (!values || values.length === 0) {
      series.push({ ano, valor: null }); // Preserve null for missing periods!
    } else if (isRate) {
      const avg = values.reduce((s, v) => s + v, 0) / values.length;
      series.push({ ano, valor: Number(avg.toFixed(2)) });
    } else {
      const sum = values.reduce((s, v) => s + v, 0);
      series.push({ ano, valor: Math.round(sum) });
    }
  }

  return series;
}

export async function getRanking(
  params: FilterParams & { variavel: string; limite?: number }
): Promise<RankingItem[]> {
  const whereBase = buildWhereClause(params);

  // Matrícula e Escolas: default rede = 'Total' se não especificado (evita dupla contagem)
  // Variáveis do censo demográfico já têm rede/etapa sobrescritas em buildWhereClause
  if ((params.variavel === 'Matrícula' || params.variavel === 'Escolas') && !params.rede) {
    whereBase.ensino_rede = 'Total';
  }

  const rows = await prisma.medida.findMany({
    where: whereBase,
    select: { co_mun: true, no_mun: true, valor: true },
  });

  const munMap = new Map<string, { no_mun: string; sum: number; count: number }>();
  for (const r of rows) {
    if (!munMap.has(r.co_mun)) {
      munMap.set(r.co_mun, { no_mun: r.no_mun, sum: 0, count: 0 });
    }
    const item = munMap.get(r.co_mun)!;
    item.sum += r.valor;
    item.count += 1;
  }

  const isRate = params.variavel.startsWith('Taxa');

  const result: RankingItem[] = [];
  for (const [co_mun, data] of munMap.entries()) {
    const val = isRate ? data.sum / data.count : data.sum;
    result.push({
      co_mun,
      no_mun: data.no_mun,
      valor: Number(val.toFixed(2)),
    });
  }

  // Sort descending by default
  result.sort((a, b) => b.valor - a.valor);

  const limite = params.limite || 10;
  return result.slice(0, limite);
}

export async function getMapaData(params: FilterParams & { variavel: string }): Promise<RankingItem[]> {
  // Similar to ranking but returns all municipalities for choropleth mapping
  return getRanking({ ...params, limite: 200 });
}

export async function getTabelaDados(
  params: FilterParams & { pagina?: number; tamanho?: number }
): Promise<TabelaResult> {
  const where = buildWhereClause(params);

  const pagina = Math.max(1, params.pagina || 1);
  const tamanho = Math.min(100, Math.max(1, params.tamanho || 10));
  const skip = (pagina - 1) * tamanho;

  const total = await prisma.medida.count({ where });
  const itens = await prisma.medida.findMany({
    where,
    skip,
    take: tamanho,
    orderBy: [{ ano: 'desc' }, { no_mun: 'asc' }],
  });

  return {
    itens,
    total,
    pagina,
    tamanho,
    paginas: Math.ceil(total / tamanho),
  };
}
