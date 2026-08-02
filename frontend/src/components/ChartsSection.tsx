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
  etapa?: string;
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
  etapa,
  loading,
  visao,
  onVisaoChange,
}) => {
  const isRate = variavel.startsWith('Taxa');
  const isCensoDemografico = VARIAVEIS_CENSO_DEMOGRAFICO.includes(variavel);
  const isEscolasSemEtapa = variavel === 'Escolas' && (!etapa || etapa === 'Todas' || etapa === 'Todos');

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
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 h-80 animate-pulse"></div>
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 h-80 animate-pulse"></div>
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 h-80 animate-pulse"></div>
      </div>
    );
  }

  // Paleta de cores suave, elegante e sofisticada com foco no tom de verde moderno
  const BAR_COLORS = [
    '#0F5237',
    '#166534',
    '#15803D',
    '#16A34A',
    '#0D9488',
    '#0284C7',
    '#475569',
    '#334155',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Série Temporal */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#0F5237]">Evolução Temporal ({variavel})</h3>
            <p className="text-xs text-[#64748B] mt-0.5 font-medium">Série histórica anual dos dados agregados</p>
            {isEscolasSemEtapa && (
              <p className="text-[11px] text-[#92400E] font-medium mt-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0 text-[#B45309]" />
                <span>Valores somados por etapa representam ofertas de ensino, não escolas únicas</span>
              </p>
            )}
          </div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 bg-[#ECF7F0] text-[#0F5237] border border-[#D8EEE0] rounded-md shrink-0">
            Histórico
          </span>
        </div>

        {series.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-[#64748B] text-sm gap-1 font-medium">
            <span>Sem dados temporais para o filtro selecionado</span>
            <span className="text-xs text-[#94A3B8]">Selecione um intervalo de anos para ver evolução</span>
          </div>
        ) : hasOnlyOnePoint ? (
          <div className="h-64 flex flex-col items-center justify-center text-[#64748B] text-sm gap-1 font-medium">
            <span>Somente 1 ponto de dado disponível</span>
            <span className="text-xs text-[#94A3B8]">Selecione um intervalo maior de anos para ver a série histórica</span>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="ano" stroke="#64748B" tick={{ fontSize: 11, fill: '#1E293B' }} />
                <YAxis
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#1E293B' }}
                  tickFormatter={formatYTick}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  }}
                  itemStyle={{ color: '#F8FAFC', fontWeight: 600 }}
                  labelStyle={{ color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}
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
                  stroke="#0F5237"
                  strokeWidth={2.5}
                  connectNulls={false}
                  dot={{ r: 4, fill: '#0F5237', stroke: '#FFFFFF', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#16A34A', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 2. Ranking Comparativo entre Municípios */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#0F5237]">Ranking de Municípios</h3>
            <p className="text-xs text-[#64748B] mt-0.5 font-medium">Top 10 municípios no recorte selecionado</p>
            {isEscolasSemEtapa && (
              <p className="text-[11px] text-[#92400E] font-medium mt-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0 text-[#B45309]" />
                <span>Valores somados por etapa representam ofertas de ensino, não escolas únicas</span>
              </p>
            )}
          </div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 bg-[#ECF7F0] text-[#0F5237] border border-[#D8EEE0] rounded-md shrink-0">
            Comparativo
          </span>
        </div>

        {ranking.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-[#64748B] text-sm font-medium">
            Sem dados de municípios para o filtro selecionado
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking} layout="vertical" margin={{ top: 5, right: 10, left: 35, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#1E293B' }}
                  tickFormatter={formatYTick}
                />
                <YAxis
                  type="category"
                  dataKey="no_mun"
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#1E293B', fontWeight: 500 }}
                  width={85}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  }}
                  itemStyle={{ color: '#F8FAFC', fontWeight: 600 }}
                  labelStyle={{ color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}
                  formatter={(val: any) => [
                    isRate ? formatPercent(val) : formatNumber(val),
                    variavel,
                  ]}
                />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                  {ranking.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 3. TERCEIRO GRÁFICO: Quebra por Rede ou Etapa de Ensino */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-lg font-semibold text-[#0F5237] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#0F5237]" />
              <span>Quebra por {visao === 'rede' ? 'Rede' : 'Etapa'}</span>
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5 font-medium">
              {visao === 'rede' ? 'Estadual, Municipal, Federal e Privada' : 'Distribuição entre etapas educacionais'}
            </p>
          </div>

          {/* Toggle de Alternância Rede vs Etapa */}
          {!isCensoDemografico && (
            <div className="flex bg-[#F8FAF9] p-1 rounded-xl border border-[#E2E8F0] text-xs">
              <button
                onClick={() => onVisaoChange('rede')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  visao === 'rede'
                    ? 'bg-[#0F5237] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F5237]'
                }`}
              >
                Rede
              </button>
              <button
                onClick={() => onVisaoChange('etapa')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  visao === 'etapa'
                    ? 'bg-[#0F5237] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F5237]'
                }`}
              >
                Etapa
              </button>
            </div>
          )}
        </div>

        {isCensoDemografico ? (
          <div className="h-64 flex flex-col items-center justify-center p-4 text-center bg-[#F8FAF9] rounded-xl border border-[#E2E8F0]">
            <Info className="w-6 h-6 text-[#B45309] mb-2" />
            <span className="text-xs font-semibold text-[#1E293B]">Não aplicável a esta variável</span>
            <span className="text-[11px] text-[#64748B] mt-1 max-w-xs leading-relaxed font-medium">
              O indicador <strong>"{variavel}"</strong> pertence ao Censo Demográfico e não possui desagregação por rede ou etapa de ensino.
            </span>
          </div>
        ) : distribuicao.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-[#64748B] text-sm font-medium">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                {visao === 'etapa' ? (
                  <>
                    <XAxis type="number" stroke="#64748B" tick={{ fontSize: 10, fill: '#1E293B' }} tickFormatter={formatYTick} />
                    <YAxis type="category" dataKey="categoria" stroke="#64748B" tick={{ fontSize: 10, fill: '#1E293B', fontWeight: 500 }} width={110} />
                  </>
                ) : (
                  <>
                    <XAxis dataKey="categoria" stroke="#64748B" tick={{ fontSize: 11, fill: '#1E293B', fontWeight: 500 }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 11, fill: '#1E293B' }} tickFormatter={formatYTick} />
                  </>
                )}
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  }}
                  itemStyle={{ color: '#F8FAFC', fontWeight: 600 }}
                  labelStyle={{ color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}
                  formatter={(val: any) => [
                    isRate ? formatPercent(val) : formatNumber(val),
                    variavel,
                  ]}
                  labelFormatter={(lbl) => `${visao === 'rede' ? 'Rede' : 'Etapa'}: ${lbl}`}
                />
                <Bar dataKey="valor" radius={visao === 'etapa' ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
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
