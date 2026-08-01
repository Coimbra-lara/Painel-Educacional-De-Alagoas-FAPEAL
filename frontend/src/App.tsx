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
  // mapaData: fetched via fetchRanking with limite=1000 (same logic/endpoint as the Ranking chart)
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
    if (filters.anoInicio !== undefined && filters.anoFim !== undefined && filters.anoInicio > filters.anoFim) {
      setErrorMsg('⚠️ O ano inicial deve ser menor ou igual ao ano final.');
      setLoadingIndicadores(false);
      setLoadingCharts(false);
      setIndicadores(null);
      setSeries([]);
      setRanking([]);
      setDistribuicao([]);
      setMapaData([]);
      return;
    }

    setErrorMsg(null);
    setLoadingIndicadores(true);
    setLoadingCharts(true);

    try {
      // fetchRanking with limite=1000 is the single source of truth for map data.
      // This is IDENTICAL to the Ranking chart call — same endpoint (/api/ranking),
      // same filter object, same aggregation logic — the only difference is the limit.
      const [indData, seriesData, rankingData, distData, mapaRes] = await Promise.all([
        fetchIndicadores(filters),
        fetchSeries(filters),
        fetchRanking(filters, 10),
        fetchDistribuicao(filters, visao),
        fetchRanking(filters, 1000),
      ]);

      setIndicadores(indData);
      setSeries(seriesData);
      setRanking(rankingData);
      setDistribuicao(distData);
      setMapaData(mapaRes);
    } catch (err: any) {
      console.error('Erro ao carregar dados do dashboard:', err);
      const msg = err.response?.data?.error?.message || 'Nenhum dado encontrado ou backend offline. Envie um arquivo CSV para alimentar o banco.';
      setErrorMsg(msg);
    } finally {
      setLoadingIndicadores(false);
      setLoadingCharts(false);
    }
  }, [filters, visao]);

  // Load paginated table
  const loadTabelaData = useCallback(async () => {
    if (filters.anoInicio !== undefined && filters.anoFim !== undefined && filters.anoInicio > filters.anoFim) {
      setLoadingTabela(false);
      setTabela(null);
      return;
    }

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
    <div className="min-h-screen bg-[#F7F5F0] text-[#1C2B26] flex flex-col font-sans selection:bg-[#0E3B3A] selection:text-white">
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        totalRows={filtrosOptions.totalMedidas}
        municipiosCount={filtrosOptions.municipios.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {errorMsg && (
          <div className="p-4 bg-[#FAF3E5] border border-[#E8D7B5] rounded-2xl text-[#7A5416] text-xs sm:text-sm flex items-center justify-between shadow-xs">
            <span>{errorMsg}</span>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-3.5 py-1.5 bg-[#0E3B3A] hover:bg-[#092B2A] text-white text-xs uppercase tracking-wider font-medium rounded-lg transition"
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

        <KpiCards data={indicadores} loading={loadingIndicadores} etapa={filters.etapa} variavel={filters.variavel} />

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

      <footer className="bg-[#EFECE4] border-t border-[#E5E0D7] py-6 text-center text-xs text-[#6E6A63] font-sans">
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
