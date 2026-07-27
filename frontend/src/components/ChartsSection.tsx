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
import { SerieItem, RankingItem } from '../types/index.js';
import { formatNumber, formatPercent } from '../utils/formatters.js';

interface ChartsSectionProps {
  series: SerieItem[];
  ranking: RankingItem[];
  variavel: string;
  loading: boolean;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  series,
  ranking,
  variavel,
  loading,
}) => {
  const isRate = variavel.startsWith('Taxa');

  // Format Y-axis ticks with compact notation (e.g. 250k, 1.5M)
  // NOT pt-BR format, which shows "250.000" that looks like a decimal on charts
  const formatYTick = (val: number): string => {
    if (isRate) return `${val}%`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return String(val);
  };

  const hasOnlyOnePoint = series.filter((s) => s.valor !== null).length === 1;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 h-80 animate-pulse bg-slate-800"></div>
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 h-80 animate-pulse bg-slate-800"></div>
      </div>
    );
  }

  const BAR_COLORS = [
    '#0284c7',
    '#0369a1',
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Série Temporal */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Evolução Temporal ({variavel})</h3>
            <p className="text-xs text-slate-400">Série histórica anual dos dados agregados</p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg">
            Série Histórica
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
                <XAxis dataKey="ano" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
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

      {/* 2. Ranking Comparativo */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Ranking de Municípios</h3>
            <p className="text-xs text-slate-400">Top 10 municípios no recorte selecionado</p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
            Comparativo IBGE
          </span>
        </div>

        {ranking.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            Sem dados de municípios para o filtro selecionado
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking} layout="vertical" margin={{ top: 5, right: 10, left: 40, bottom: 5 }}>
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
                  width={90}
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
    </div>
  );
};
