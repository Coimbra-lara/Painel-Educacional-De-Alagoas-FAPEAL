import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header.js';
import { UploadModal } from './components/UploadModal.js';
import { FilterBar } from './components/FilterBar.js';
import { KpiCards } from './components/KpiCards.js';
import { ChartsSection } from './components/ChartsSection.js';
import { AlagoasMap } from './components/AlagoasMap.js';
import { DataTable } from './components/DataTable.js';
import {
  fetchFiltros,
  fetchIndicadores,
  fetchSeries,
  fetchRanking,
  fetchMapa,
  fetchDistribuicao,
  fetchTabela,
} from './services/api.js';
import {
  FiltrosResponse,
  FilterState,
  IndicadoresData,
  SerieItem,
  RankingItem,
  DistribuicaoItem,
  TabelaData,
} from './types/index.js';
import './index.css';

export function App() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filtrosOptions, setFiltrosOptions] = useState<FiltrosResponse>({
    municipios: [],
    anos: [],
    redes: [],
    etapas: [],
    variaveis: [],
  });

  const [filters, setFilters] = useState<FilterState>({
    municipios: [],
    anoInicio: undefined,
    anoFim: undefined,
    rede: undefined,
    etapa: undefined,
    variavel: 'Matrícula',
  });

  const [visao, setVisao] = useState<'rede' | 'etapa'>('rede');
  const [indicadores, setIndicadores] = useState<IndicadoresData | null>(null);
  const [series, setSeries] = useState<SerieItem[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [distribuicao, setDistribuicao] = useState<DistribuicaoItem[]>([]);
  const [mapaData, setMapaData] = useState<RankingItem[]>([]);
  const [tabela, setTabela] = useState<TabelaData | null>(null);

  const [pagina, setPagina] = useState(1);
  const [tamanho, setTamanho] = useState(10);

  const [loadingIndicadores, setLoadingIndicadores] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingTabela, setLoadingTabela] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load available filters dynamically from /api/filtros — all lists come from the database.
  // After loading, if the currently selected variavel is not in the returned list,
  // default to the first available variable.
  const loadOptions = useCallback(async () => {
    try {
      const opts = await fetchFiltros();
      setFiltrosOptions(opts);
      // Sync active variavel: if the current selection is missing from the bank,
      // pick the first one returned (keeps the UI consistent with available data).
      if (opts.variaveis.length > 0) {
        setFilters((prev) =>
          opts.variaveis.includes(prev.variavel)
            ? prev
            : { ...prev, variavel: opts.variaveis[0] }
        );
      }
    } catch (err: any) {
      console.warn('Backend sem dados iniciais. Faça upload do CSV de amostra.');
    }
  }, []);

  // Load dashboard data whenever filters or visao change
  const loadDashboardData = useCallback(async () => {
    setErrorMsg(null);
    setLoadingIndicadores(true);
    setLoadingCharts(true);

    try {
      const [indData, seriesData, rankingData, distData, mapaRes] = await Promise.all([
        fetchIndicadores(filters),
        fetchSeries(filters),
        fetchRanking(filters, 10),
        fetchDistribuicao(filters, visao),
        fetchMapa(filters),
      ]);

      setIndicadores(indData);
      setSeries(seriesData);
      setRanking(rankingData);
      setDistribuicao(distData);
      setMapaData(mapaRes);
    } catch (err: any) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setErrorMsg('Nenhum dado encontrado ou backend offline. Envie um arquivo CSV para alimentar o banco.');
    } finally {
      setLoadingIndicadores(false);
      setLoadingCharts(false);
    }
  }, [filters, visao]);

  // Load paginated table
  const loadTabelaData = useCallback(async () => {
    setLoadingTabela(true);
    try {
      const res = await fetchTabela(filters, pagina, tamanho);
      setTabela(res);
    } catch (err) {
      console.error('Erro ao carregar tabela:', err);
    } finally {
      setLoadingTabela(false);
    }
  }, [filters, pagina, tamanho]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    loadTabelaData();
  }, [loadTabelaData]);

  const handleFilterChange = (updated: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
    setPagina(1); // Reset to page 1 on filter change
  };

  const handleResetFilters = () => {
    setFilters({
      municipios: [],
      anoInicio: undefined,
      anoFim: undefined,
      rede: undefined,
      etapa: undefined,
      // Default to first variable from the bank, falling back to 'Matrícula' if list is empty
      variavel: filtrosOptions.variaveis[0] ?? 'Matrícula',
    });
    setPagina(1);
  };

  const handleUploadSuccess = () => {
    loadOptions();
    loadDashboardData();
    loadTabelaData();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        totalRows={filtrosOptions.totalMedidas}
        municipiosCount={filtrosOptions.municipios.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {errorMsg && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-sm flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold rounded-lg transition"
            >
              Fazer Upload CSV
            </button>
          </div>
        )}

        <FilterBar
          options={filtrosOptions}
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        <KpiCards data={indicadores} loading={loadingIndicadores} />

        <ChartsSection
          series={series}
          ranking={ranking}
          distribuicao={distribuicao}
          variavel={filters.variavel}
          etapa={filters.etapa}
          loading={loadingCharts}
          visao={visao}
          onVisaoChange={setVisao}
        />

        <AlagoasMap
          data={mapaData}
          variavel={filters.variavel}
          etapa={filters.etapa}
          loading={loadingCharts}
        />

        <DataTable
          data={tabela}
          loading={loadingTabela}
          pagina={pagina}
          tamanho={tamanho}
          onPageChange={setPagina}
          onTamanhoChange={(t) => {
            setTamanho(t);
            setPagina(1);
          }}
        />
      </main>

      <footer className="bg-slate-950 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        Painel de Indicadores Educacionais de Alagoas — Desafio Técnico Full-Stack (React, Node.js, Express, TypeScript & Prisma)
      </footer>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}

export default App;
