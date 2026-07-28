import axios from 'axios';
import {
  FiltrosResponse,
  FilterState,
  IndicadoresData,
  SerieItem,
  RankingItem,
  DistribuicaoItem,
  TabelaData,
  UploadReport,
} from '../types/index.js';

const API_BASE = '/api';

export async function fetchFiltros(): Promise<FiltrosResponse> {
  const { data } = await axios.get<FiltrosResponse>(`${API_BASE}/filtros`);
  return data;
}

export async function fetchIndicadores(filters: FilterState): Promise<IndicadoresData> {
  const { data } = await axios.get<IndicadoresData>(`${API_BASE}/indicadores`, {
    params: {
      municipio: filters.municipios.join(','),
      anoInicio: filters.anoInicio,
      anoFim: filters.anoFim,
      rede: filters.rede,
      etapa: filters.etapa,
    },
  });
  return data;
}

export async function fetchSeries(filters: FilterState): Promise<SerieItem[]> {
  const { data } = await axios.get<SerieItem[]>(`${API_BASE}/series`, {
    params: {
      variavel: filters.variavel,
      municipio: filters.municipios.join(','),
      anoInicio: filters.anoInicio,
      anoFim: filters.anoFim,
      rede: filters.rede,
      etapa: filters.etapa,
    },
  });
  return data;
}

export async function fetchRanking(filters: FilterState, limite = 10): Promise<RankingItem[]> {
  const { data } = await axios.get<RankingItem[]>(`${API_BASE}/ranking`, {
    params: {
      variavel: filters.variavel,
      municipio: filters.municipios.join(','),
      anoInicio: filters.anoInicio,
      anoFim: filters.anoFim,
      rede: filters.rede,
      etapa: filters.etapa,
      limite,
    },
  });
  return data;
}

export async function fetchMapa(filters: FilterState): Promise<RankingItem[]> {
  const { data } = await axios.get<RankingItem[]>(`${API_BASE}/mapa`, {
    params: {
      variavel: filters.variavel,
      municipio: filters.municipios.join(','),
      anoInicio: filters.anoInicio,
      anoFim: filters.anoFim,
      rede: filters.rede,
      etapa: filters.etapa,
    },
  });
  return data;
}

export async function fetchDistribuicao(
  filters: FilterState,
  visao: 'rede' | 'etapa' = 'rede'
): Promise<DistribuicaoItem[]> {
  const { data } = await axios.get<DistribuicaoItem[]>(`${API_BASE}/distribuicao`, {
    params: {
      variavel: filters.variavel,
      municipio: filters.municipios.join(','),
      anoInicio: filters.anoInicio,
      anoFim: filters.anoFim,
      rede: filters.rede,
      etapa: filters.etapa,
      visao,
    },
  });
  return data;
}

export async function fetchTabela(
  filters: FilterState,
  pagina = 1,
  tamanho = 10
): Promise<TabelaData> {
  const { data } = await axios.get<TabelaData>(`${API_BASE}/dados`, {
    params: {
      municipio: filters.municipios.join(','),
      anoInicio: filters.anoInicio,
      anoFim: filters.anoFim,
      rede: filters.rede,
      etapa: filters.etapa,
      variavel: filters.variavel,
      pagina,
      tamanho,
    },
  });
  return data;
}

export async function uploadCsv(file: File): Promise<UploadReport> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await axios.post<UploadReport>(`${API_BASE}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
