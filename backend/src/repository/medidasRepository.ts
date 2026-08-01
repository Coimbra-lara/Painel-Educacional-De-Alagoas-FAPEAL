import { prisma } from '../services/db';
import { ehVariavelCensoDemografico, REDE_CENSO_DEMOGRAFICO, ETAPA_CENSO_DEMOGRAFICO } from '../services/censoDemografico';

// Cache em memória: ano mais recente por variável (invalidado após re-importação CSV)
let anoMaximoCache: Map<string, number> | null = null;

async function getAnoMaximo(variavel: string): Promise<number | undefined> {
  if (!anoMaximoCache) {
    const rows = await prisma.$queryRaw<{ variavel: string; max_ano: number }[]>`
      SELECT variavel, MAX(ano) as max_ano FROM medidas GROUP BY variavel
    `;
    anoMaximoCache = new Map(rows.map((r) => [r.variavel, Number(r.max_ano)]));
  }
  return anoMaximoCache.get(variavel);
}

export function invalidarCacheAnos() {
  anoMaximoCache = null;
}

export interface FilterParams {
  municipios?: string[];
  ano?: number;
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
  /** Human-readable label of the period used for the rate cards, e.g. "2010–2021" or "2023" */
  periodoReferencia: string | null;
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

export interface DistribuicaoItem {
  categoria: string;
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

  const anos = anosRaw.map((a) => a.ano);
  const anoMaximo = anos.length > 0 ? Math.max(...anos) : undefined;

  return {
    municipios: municipiosRaw,
    anos,
    redes: redesRaw.map((r) => r.ensino_rede),
    etapas: etapasRaw.map((e) => e.ensino_tipo),
    variaveis: variaveisRaw.map((v) => v.variavel),
    totalMedidas,
    anoMaximo,
  };
}

function buildWhereClause(params: FilterParams) {
  const where: any = {};

  if (params.municipios && params.municipios.length > 0) {
    where.co_mun = { in: params.municipios };
  }

  if (params.ano !== undefined) {
    where.ano = params.ano;
  } else if (params.anoInicio !== undefined || params.anoFim !== undefined) {
    if (params.anoInicio !== undefined && params.anoFim !== undefined) {
      if (params.anoInicio === params.anoFim) {
        where.ano = params.anoInicio;
      } else {
        where.ano = {
          gte: params.anoInicio,
          lte: params.anoFim,
        };
      }
    } else if (params.anoInicio !== undefined) {
      where.ano = params.anoInicio;
    } else if (params.anoFim !== undefined) {
      where.ano = params.anoFim;
    }
  }

  if (params.variavel) {
    where.variavel = params.variavel;

    if (ehVariavelCensoDemografico(params.variavel)) {
      where.ensino_rede = REDE_CENSO_DEMOGRAFICO;
      where.ensino_tipo = ETAPA_CENSO_DEMOGRAFICO;
    } else {
      if (params.rede && params.rede !== 'Todas' && params.rede !== 'Todos') where.ensino_rede = params.rede;
      if (params.etapa && params.etapa !== 'Todas' && params.etapa !== 'Todos') where.ensino_tipo = params.etapa;
    }
  } else {
    if (params.rede && params.rede !== 'Todas' && params.rede !== 'Todos') where.ensino_rede = params.rede;
    if (params.etapa && params.etapa !== 'Todas' && params.etapa !== 'Todos') where.ensino_tipo = params.etapa;
  }

  return where;
}

/**
 * FUNÇÃO CENTRALIZADA DE AGREGAÇÃO PONDERADA / SOMA
 *
 * Esta função é utilizada por TODOS os componentes do dashboard (KPI Cards, Evolução
 * Temporal, Ranking de Municípios, Quebra por Rede, Quebra por Etapa e Mapa Coroplético).
 *
 * Regras e Rigor Matemático:
 * 1. Para variáveis de Taxa (`isRate`):
 *    Calcula a média ponderada rigorosa: SUM(taxa_i × peso_i) / SUM(peso_i)
 *    - Variáveis Educacionais (Taxa de Aprovação, Taxa de Abandono, Taxa de Reprovação):
 *      peso_i = Matrícula correspondente ao mesmo (município, ano, etapa, rede).
 *    - Variáveis do Censo Demográfico (Taxa de Analfabetismo, Taxa de Alfabetização):
 *      peso_i = Pessoas Total correspondente ao mesmo (município, ano).
 * 2. Para variáveis de Contagem/Soma (!`isRate`):
 *    Soma os valores reais `SUM(valor)`.
 *    Para Matrícula e Escolas, se nenhuma rede específica for filtrada, utiliza o padrão
 *    `ensino_rede = 'Total'` para evitar duplicidade de contagem entre redes.
 * 3. Critério Multi-Ano:
 *    Quando o filtro abrange um intervalo de anos (ex: 2010 a 2021), TODOS os anos do
 *    intervalo são combinados na mesma fórmula de média ponderada/soma acumulada.
 * 4. Tratamento de Ausência de Dados:
 *    Se o peso acumulado ou a contagem for zero ou ausente, retorna `null` (jamais
 *    trata dado ausente como zero nem realiza fallback para média simples).
 */
export async function aggregateRate(
  whereBase: any,
  variavel: string,
  params: FilterParams
): Promise<number | null> {
  const isCenso = ehVariavelCensoDemografico(variavel);
  const weightVar = isCenso ? 'Pessoas Total' : 'Matrícula';

  const whereTaxa = { ...whereBase, variavel };
  if (isCenso) {
    whereTaxa.ensino_rede = REDE_CENSO_DEMOGRAFICO;
    whereTaxa.ensino_tipo = ETAPA_CENSO_DEMOGRAFICO;
  } else if (!whereTaxa.ensino_rede || whereTaxa.ensino_rede === 'Todas' || whereTaxa.ensino_rede === 'Todos') {
    whereTaxa.ensino_rede = params.rede && params.rede !== 'Todas' && params.rede !== 'Todos' ? params.rede : 'Total';
  }

  const taxaRows = await prisma.medida.findMany({
    where: whereTaxa,
    select: { co_mun: true, ano: true, ensino_rede: true, ensino_tipo: true, valor: true },
  });

  if (taxaRows.length === 0) return null;

  const whereWeight: any = { ...whereBase, variavel: weightVar };
  if (isCenso) {
    whereWeight.ensino_rede = REDE_CENSO_DEMOGRAFICO;
    whereWeight.ensino_tipo = ETAPA_CENSO_DEMOGRAFICO;
  } else {
    whereWeight.ensino_rede = whereTaxa.ensino_rede;
  }

  let weightRows = await prisma.medida.findMany({
    where: whereWeight,
    select: { co_mun: true, ano: true, ensino_rede: true, ensino_tipo: true, valor: true },
  });

  // Fallback: se rede filtrada não for 'Total' e não possuir matrículas no recorte, tenta com rede='Total'
  if (!isCenso && weightRows.length === 0 && whereWeight.ensino_rede !== 'Total') {
    weightRows = await prisma.medida.findMany({
      where: { ...whereWeight, ensino_rede: 'Total' },
      select: { co_mun: true, ano: true, ensino_rede: true, ensino_tipo: true, valor: true },
    });
  }

  const weightMap = new Map<string, number>();
  for (const w of weightRows) {
    const key = isCenso ? `${w.co_mun}_${w.ano}` : `${w.co_mun}_${w.ano}_${w.ensino_tipo}`;
    weightMap.set(key, w.valor);
  }

  let weightedSum = 0;
  let totalWeight = 0;

  for (const r of taxaRows) {
    const key = isCenso ? `${r.co_mun}_${r.ano}` : `${r.co_mun}_${r.ano}_${r.ensino_tipo}`;
    const weight = weightMap.get(key) ?? 0;
    if (weight > 0) {
      weightedSum += r.valor * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(2)) : null;
}

export async function aggregateCount(
  whereBase: any,
  variavel: string,
  params: FilterParams
): Promise<number | null> {
  const isCenso = ehVariavelCensoDemografico(variavel);
  const whereCount = { ...whereBase, variavel };

  if (isCenso) {
    whereCount.ensino_rede = REDE_CENSO_DEMOGRAFICO;
    whereCount.ensino_tipo = ETAPA_CENSO_DEMOGRAFICO;
  } else if (
    (variavel === 'Matrícula' || variavel === 'Escolas') &&
    (!whereCount.ensino_rede || whereCount.ensino_rede === 'Todas' || whereCount.ensino_rede === 'Todos')
  ) {
    whereCount.ensino_rede = params.rede && params.rede !== 'Todas' && params.rede !== 'Todos' ? params.rede : 'Total';
  }

  const agg = await prisma.medida.aggregate({
    where: whereCount,
    _sum: { valor: true },
  });

  return agg._sum.valor !== null ? Math.round(agg._sum.valor) : null;
}

export async function getIndicadores(params: FilterParams): Promise<IndicadoresResult> {
  const whereBase = buildWhereClause(params);

  let periodoReferencia: string | null = null;
  if (params.anoInicio !== undefined && params.anoFim !== undefined) {
    periodoReferencia =
      params.anoInicio === params.anoFim
        ? String(params.anoInicio)
        : `${params.anoInicio}–${params.anoFim}`;
  } else if (params.anoInicio !== undefined) {
    periodoReferencia = `a partir de ${params.anoInicio}`;
  } else if (params.anoFim !== undefined) {
    periodoReferencia = `até ${params.anoFim}`;
  }

  const [
    totalMatriculas,
    totalOfertasEscolas,
    taxaAprovacaoPonderada,
    taxaAbandonoPonderada,
    taxaAnalfabetismoMedia,
  ] = await Promise.all([
    aggregateCount(whereBase, 'Matrícula', params),
    aggregateCount(whereBase, 'Escolas', params),
    aggregateRate(whereBase, 'Taxa de Aprovação', params),
    aggregateRate(whereBase, 'Taxa de Abandono', params),
    aggregateRate(whereBase, 'Taxa de Analfabetismo', params),
  ]);

  // Variação de Matrículas
  const whereMatricula = {
    ...whereBase,
    variavel: 'Matrícula',
    ensino_rede: params.rede && params.rede !== 'Todas' && params.rede !== 'Todos' ? params.rede : 'Total',
  };

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
      variacaoMatriculas = Number((((valMax._sum.valor - valMin._sum.valor) / valMin._sum.valor) * 100).toFixed(2));
    }
  }

  return {
    totalMatriculas,
    totalOfertasEscolas,
    taxaAprovacaoPonderada,
    taxaAbandonoPonderada,
    taxaAnalfabetismoMedia,
    variacaoMatriculas,
    periodoReferencia,
  };
}

export async function getSeries(params: FilterParams & { variavel: string }): Promise<SerieItem[]> {
  const whereBase = buildWhereClause(params);
  const isRate = params.variavel.startsWith('Taxa');

  // Buscar todos os anos disponíveis no dataset ou no intervalo filtrado
  const anosRows = await prisma.medida.findMany({
    select: { ano: true },
    distinct: ['ano'],
    orderBy: { ano: 'asc' },
  });

  const anosFiltrados = anosRows
    .map((a) => a.ano)
    .filter((ano) => {
      if (params.anoInicio && ano < params.anoInicio) return false;
      if (params.anoFim && ano > params.anoFim) return false;
      return true;
    });

  const series = await Promise.all(
    anosFiltrados.map(async (ano) => {
      const whereYear = { ...whereBase, ano };
      const paramsYear = { ...params, anoInicio: ano, anoFim: ano, ano };
      const valor = isRate
        ? await aggregateRate(whereYear, params.variavel, paramsYear)
        : await aggregateCount(whereYear, params.variavel, paramsYear);
      return { ano, valor };
    })
  );

  return series;
}

export async function getRanking(
  params: FilterParams & { variavel: string; limite?: number }
): Promise<RankingItem[]> {
  const whereBase = buildWhereClause(params);
  const isRate = params.variavel.startsWith('Taxa');

  // Se nenhum ano for especificado nos filtros, utiliza o ano máximo da variável
  if (whereBase.ano === undefined && params.anoInicio === undefined && params.anoFim === undefined) {
    const anoMax = await getAnoMaximo(params.variavel);
    if (anoMax !== undefined) whereBase.ano = anoMax;
  }

  const municipiosRaw = await prisma.medida.findMany({
    where: whereBase,
    select: { co_mun: true, no_mun: true },
    distinct: ['co_mun'],
  });

  const ranking = await Promise.all(
    municipiosRaw.map(async (m) => {
      const whereMun = { ...whereBase, co_mun: m.co_mun };
      const paramsMun = { ...params, municipios: [m.co_mun] };
      const valor = isRate
        ? await aggregateRate(whereMun, params.variavel, paramsMun)
        : await aggregateCount(whereMun, params.variavel, paramsMun);

      return valor !== null ? { co_mun: m.co_mun, no_mun: m.no_mun, valor } : null;
    })
  );

  const filteredRanking = ranking.filter((item): item is RankingItem => item !== null);
  filteredRanking.sort((a, b) => b.valor - a.valor);

  const limite = params.limite || 10;
  return filteredRanking.slice(0, limite);
}

export async function getMapaData(params: FilterParams & { variavel: string }): Promise<RankingItem[]> {
  return getRanking({ ...params, limite: 1000 });
}

export async function getDistribuicao(
  params: FilterParams & { visao?: 'rede' | 'etapa'; variavel?: string }
): Promise<DistribuicaoItem[]> {
  const variavel = params.variavel || 'Matrícula';

  if (ehVariavelCensoDemografico(variavel)) {
    return [];
  }

  const visao = params.visao || 'rede';
  const whereBase = buildWhereClause(params);
  const isRate = variavel.startsWith('Taxa');

  if (whereBase.ano === undefined && params.anoInicio === undefined && params.anoFim === undefined) {
    const anoMax = await getAnoMaximo(variavel);
    if (anoMax !== undefined) whereBase.ano = anoMax;
  }

  if (visao === 'rede') {
    // Redes granulares sem sobreposição (ignora 'Total' e 'Pública')
    const granularRedes = ['Estadual', 'Municipal', 'Federal', 'Privada'];

    const items = await Promise.all(
      granularRedes.map(async (redeName) => {
        const whereRede = { ...whereBase, ensino_rede: redeName };
        const paramsRede = { ...params, rede: redeName, variavel };
        const valor = isRate
          ? await aggregateRate(whereRede, variavel, paramsRede)
          : await aggregateCount(whereRede, variavel, paramsRede);

        return valor !== null ? { categoria: redeName, valor } : null;
      })
    );

    return items.filter((item): item is DistribuicaoItem => item !== null);
  } else {
    // Visão por Etapa
    let etapasRaw = await prisma.medida.findMany({
      where: whereBase,
      select: { ensino_tipo: true },
      distinct: ['ensino_tipo'],
    });

    let etapas = etapasRaw.map((e) => e.ensino_tipo);

    // Para taxas de rendimento, restringe apenas às etapas onde a taxa existe
    if (isRate) {
      etapas = etapas.filter((e) => e === 'Ensino Fundamental' || e === 'Ensino Médio');
    }

    const items = await Promise.all(
      etapas.map(async (etapaName) => {
        const whereEtapa = { ...whereBase, ensino_tipo: etapaName };
        const paramsEtapa = { ...params, etapa: etapaName, variavel };
        const valor = isRate
          ? await aggregateRate(whereEtapa, variavel, paramsEtapa)
          : await aggregateCount(whereEtapa, variavel, paramsEtapa);

        return valor !== null ? { categoria: etapaName, valor } : null;
      })
    );

    const filtered = items.filter((item): item is DistribuicaoItem => item !== null);
    filtered.sort((a, b) => b.valor - a.valor);
    return filtered;
  }
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
