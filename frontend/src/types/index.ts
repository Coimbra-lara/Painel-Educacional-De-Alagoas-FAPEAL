export interface Municipio {
  co_mun: string;
  no_mun: string;
}

export interface FiltrosResponse {
  municipios: Municipio[];
  anos: number[];
  redes: string[];
  etapas: string[];
  variaveis: string[];
  totalMedidas?: number;
  anoMaximo?: number;
}

export interface FilterState {
  municipios: string[];
  anoInicio?: number;
  anoFim?: number;
  rede?: string;
  etapa?: string;
  variavel: string;
}

export interface IndicadoresData {
  totalMatriculas: number | null;
  totalOfertasEscolas: number | null;
  taxaAprovacaoPonderada: number | null;
  taxaAbandonoPonderada: number | null;
  taxaAnalfabetismoMedia: number | null;
  variacaoMatriculas: number | null;
  /** Label of the period used for weighted rate cards (e.g. "2010–2021" or "2023"). Null = all years. */
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

export interface MedidaItem {
  id: number;
  co_mun: string;
  no_mun: string;
  ano: number;
  fonte: string;
  variavel: string;
  ensino_rede: string;
  ensino_tipo: string;
  valor: number;
}

export interface TabelaData {
  itens: MedidaItem[];
  total: number;
  pagina: number;
  tamanho: number;
  paginas: number;
}

export interface UploadReport {
  linhasLidas: number;
  linhasImportadas: number;
  linhasRejeitadas: number;
  erros: { linha: number; motivo: string }[];
}
