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
  clearData,
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
import { Upload, FileSpreadsheet } from 'lucide-react';
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

  // undefined = still loading; 0 = empty DB; >0 = has data
  // Initialized to 0 so localhost always opens on the empty state screen without fetching DB data on start
  const [totalMedidas, setTotalMedidas] = useState<number>(0);
  const [isClearing, setIsClearing] = useState(false);

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
      setTotalMedidas(opts.totalMedidas ?? 0);
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
      setTotalMedidas(0);
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

  // Do not fetch options or DB data on mount — localhost always starts on the empty state screen.
  // Data will only be loaded after the user explicitly uploads a CSV file.

  // Only fire dashboard queries when we know the DB has records
  useEffect(() => {
    if (totalMedidas !== undefined && totalMedidas > 0) {
      loadDashboardData();
    }
  }, [loadDashboardData, totalMedidas]);

  useEffect(() => {
    if (totalMedidas !== undefined && totalMedidas > 0) {
      loadTabelaData();
    }
  }, [loadTabelaData, totalMedidas]);

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

  const handleUploadSuccess = async () => {
    try {
      const opts = await fetchFiltros();
      setFiltrosOptions(opts);
      setTotalMedidas(opts.totalMedidas ?? 0);
      setFilters({
        municipios: [],
        anoInicio: undefined,
        anoFim: undefined,
        rede: undefined,
        etapa: undefined,
        variavel: opts.variaveis[0] ?? 'Matrícula',
      });
      setPagina(1);
    } catch (err) {
      console.error('Erro ao atualizar filtros após upload:', err);
      loadOptions();
      loadDashboardData();
      loadTabelaData();
    }
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      await clearData();
      // Reset all state to empty — DB is now clean
      setTotalMedidas(0);
      setFiltrosOptions({ municipios: [], anos: [], redes: [], etapas: [], variaveis: [] });
      setIndicadores(null);
      setSeries([]);
      setRanking([]);
      setDistribuicao([]);
      setMapaData([]);
      setTabela(null);
      setErrorMsg(null);
      setFilters({
        municipios: [],
        anoInicio: undefined,
        anoFim: undefined,
        rede: undefined,
        etapa: undefined,
        variavel: 'Matrícula',
      });
      setPagina(1);
    } catch (err) {
      console.error('Erro ao limpar dados:', err);
    } finally {
      setIsClearing(false);
    }
  };

  // Loading state — still checking DB (totalMedidas === undefined)
  const isLoadingInitial = totalMedidas === undefined;
  // Empty state — DB has no records at all
  const isEmpty = totalMedidas === 0;

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1E293B] flex flex-col font-sans selection:bg-[#0F5237] selection:text-white">
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        onClearData={handleClearData}
        isClearing={isClearing}
        totalRows={filtrosOptions.totalMedidas}
        municipiosCount={filtrosOptions.municipios.length}
        hasData={!isEmpty && !isLoadingInitial}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        {isLoadingInitial ? (
          // Initial loading skeleton — checking DB
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-[#D8EEE0] border-t-[#0F5237] animate-spin" />
            <p className="text-sm text-[#64748B]">Verificando banco de dados...</p>
          </div>
        ) : isEmpty ? (
          // Empty state — no data in DB
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 animate-fade-in">
            <div className="p-6 bg-[#ECF7F0] border border-[#D8EEE0] rounded-3xl shadow-sm">
              <FileSpreadsheet className="w-16 h-16 text-[#0F5237] mx-auto" />
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl font-semibold text-[#0F5237]">Nenhum dado importado ainda</h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Faça upload de um arquivo CSV com os dados educacionais dos municípios de Alagoas para começar a visualizar o painel.
              </p>
            </div>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2.5 px-6 py-3 bg-[#0F5237] hover:bg-[#0B412B] text-white font-semibold text-sm rounded-xl shadow-md transition-all duration-200 active:scale-[0.98]"
            >
              <Upload className="w-5 h-5" />
              Importar CSV para começar
            </button>
          </div>
        ) : (
          // Dashboard — has data
          <div className="space-y-8">
            {errorMsg && (
              <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl text-[#92400E] text-xs sm:text-sm flex items-center justify-between shadow-xs">
                <span>{errorMsg}</span>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-3.5 py-1.5 bg-[#0F5237] hover:bg-[#0B412B] text-white text-xs uppercase tracking-wider font-medium rounded-lg transition"
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
          </div>
        )}
      </main>

      <footer className="bg-[#E2E8F0]/60 border-t border-[#E2E8F0] py-6 text-center text-xs text-[#64748B] font-sans">
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
