import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { SerieItem, RankingItem, DistribuicaoItem } from '../types/index.js';
import { formatNumber, formatPercent } from '../utils/formatters.js';
import { Info, Layers } from 'lucide-react';

interface ChartsSectionProps {
  series: SerieItem[];
  ranking: RankingItem[];
  distribuicao: DistribuicaoItem[];
  variavel: string;
  loading: boolean;
  visao: 'rede' | 'etapa';
  onVisaoChange: (v: 'rede' | 'etapa') => void;
}

const VARIAVEIS_CENSO_DEMOGRAFICO = [
  'Taxa de Analfabetismo',
  'Taxa de Alfabetização',
  'Pessoas Total',
  'Pessoas Alfabetizadas',
];

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  series,
  ranking,
  distribuicao,
  variavel,
  loading,
  visao,
  onVisaoChange,
}) => {
  const isRate = variavel.startsWith('Taxa');
  const isCensoDemografico = VARIAVEIS_CENSO_DEMOGRAFICO.includes(variavel);

  // Format Y-axis ticks with compact notation (e.g. 250k, 1.5M)
  const formatYTick = (val: number): string => {
    if (isRate) return `${val}%`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return String(val);
  };

  const hasOnlyOnePoint = series.filter((s) => s.valor !== null).length === 1;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 h-80 animate-pulse"></div>
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 h-80 animate-pulse"></div>
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 h-80 animate-pulse"></div>
      </div>
    );
  }

  const BAR_COLORS = [
    '#0284c7',
    '#0ea5e9',
    '#38bdf8',
    '#6366f1',
    '#818cf8',
    '#a855f7',
    '#c084fc',
    '#ec4899',
    '#f43f5e',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Série Temporal */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Evolução Temporal ({variavel})</h3>
            <p className="text-xs text-slate-400">Série histórica anual dos dados agregados</p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg">
            Histórico
          </span>
        </div>

        {series.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm gap-1">
            <span>Sem dados temporais para o filtro selecionado</span>
            <span className="text-xs text-slate-500">Selecione um intervalo de anos para ver evolução</span>
          </div>
        ) : hasOnlyOnePoint ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm gap-1">
            <span>Somente 1 ponto de dado disponível</span>
            <span className="text-xs text-slate-500">Selecione um intervalo maior de anos para ver a série histórica</span>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="ano" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatYTick}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [
                    isRate ? formatPercent(val) : formatNumber(val),
                    variavel,
                  ]}
                  labelFormatter={(label) => `Ano: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  name={variavel}
                  stroke="#38bdf8"
                  strokeWidth={3}
                  connectNulls={false}
                  dot={{ r: 4, fill: '#0284c7', stroke: '#38bdf8', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#e0effe' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 2. Ranking Comparativo entre Municípios */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Ranking de Municípios</h3>
            <p className="text-xs text-slate-400">Top 10 municípios no recorte selecionado</p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
            Comparativo
          </span>
        </div>

        {ranking.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            Sem dados de municípios para o filtro selecionado
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking} layout="vertical" margin={{ top: 5, right: 10, left: 35, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatYTick}
                />
                <YAxis
                  type="category"
                  dataKey="no_mun"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  width={85}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [
                    isRate ? formatPercent(val) : formatNumber(val),
                    variavel,
                  ]}
                />
                <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                  {ranking.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 3. TERCEIRO GRÁFICO: Quebra por Rede ou Etapa de Ensino (Obrigatório) */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Quebra por {visao === 'rede' ? 'Rede' : 'Etapa'}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {visao === 'rede' ? 'Estadual, Municipal, Federal e Privada' : 'Distribuição entre etapas educacionais'}
            </p>
          </div>

          {/* Toggle de Alternância Rede vs Etapa */}
          {!isCensoDemografico && (
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700/80 text-xs">
              <button
                onClick={() => onVisaoChange('rede')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  visao === 'rede'
                    ? 'bg-sky-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rede
              </button>
              <button
                onClick={() => onVisaoChange('etapa')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  visao === 'etapa'
                    ? 'bg-sky-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Etapa
              </button>
            </div>
          )}
        </div>

        {isCensoDemografico ? (
          <div className="h-64 flex flex-col items-center justify-center p-4 text-center bg-slate-900/40 rounded-xl border border-slate-700/30">
            <Info className="w-7 h-7 text-amber-400 mb-2" />
            <span className="text-xs font-semibold text-slate-200">Não aplicável a esta variável</span>
            <span className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
              O indicador <strong>"{variavel}"</strong> pertence ao Censo Demográfico e não possui desagregação por rede ou etapa de ensino.
            </span>
          </div>
        ) : distribuicao.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            Sem dados de {visao === 'rede' ? 'rede' : 'etapa'} para os filtros selecionados
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distribuicao}
                layout={visao === 'etapa' ? 'vertical' : 'horizontal'}
                margin={visao === 'etapa' ? { top: 5, right: 10, left: 55, bottom: 5 } : { top: 10, right: 10, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                {visao === 'etapa' ? (
                  <>
                    <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={formatYTick} />
                    <YAxis type="category" dataKey="categoria" stroke="#94a3b8" tick={{ fontSize: 10 }} width={110} />
                  </>
                ) : (
                  <>
                    <XAxis dataKey="categoria" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={formatYTick} />
                  </>
                )}
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [
                    isRate ? formatPercent(val) : formatNumber(val),
                    variavel,
                  ]}
                  labelFormatter={(lbl) => `${visao === 'rede' ? 'Rede' : 'Etapa'}: ${lbl}`}
                />
                <Bar dataKey="valor" radius={visao === 'etapa' ? [0, 6, 6, 0] : [6, 6, 0, 0]}>
                  {distribuicao.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[(index + 2) % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
