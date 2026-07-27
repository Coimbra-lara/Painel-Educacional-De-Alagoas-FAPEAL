import React from 'react';
import { Users, School, CheckCircle, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { IndicadoresData } from '../types/index.js';
import { formatNumber, formatPercent } from '../utils/formatters.js';

interface KpiCardsProps {
  data: IndicadoresData | null;
  loading: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 animate-pulse h-32">
            <div className="h-4 bg-slate-700/60 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-slate-700/60 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-700/40 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total de Matrículas',
      value: formatNumber(data?.totalMatriculas),
      subtitle: 'Alunos matriculados no recorte',
      icon: Users,
      color: 'from-blue-500 to-sky-600',
      badge: 'Filtrado por Total',
      tooltip: 'Soma filtrada pela rede Total para evitar contagem triplicada de alunos',
    },
    {
      title: 'Ofertas de Ensino',
      value: formatNumber(data?.totalOfertasEscolas),
      subtitle: 'Contagem de etapas por escola',
      icon: School,
      color: 'from-indigo-500 to-purple-600',
      badge: 'Ofertas em escolas',
      tooltip: 'Escolas que oferecem mais de uma etapa são computadas em cada etapa ofertada',
    },
    {
      title: 'Taxa de Aprovação',
      value: formatPercent(data?.taxaAprovacaoPonderada),
      subtitle: 'Média ponderada por alunos',
      icon: CheckCircle,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Ponderada por Matrículas',
      tooltip: 'Fórmula: soma(taxa × matrículas) / soma(matrículas)',
    },
    {
      title: 'Taxa de Abandono',
      value: formatPercent(data?.taxaAbandonoPonderada),
      subtitle: 'Média ponderada por alunos',
      icon: AlertTriangle,
      color: 'from-amber-500 to-rose-600',
      badge: 'Abandono Escolar',
      tooltip: 'Calculado sobre turmas de Ensino Fundamental e Médio',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-5 shadow-lg transition-all duration-200 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 transition">
                  {card.title}
                </span>
                <div className="group/tooltip relative cursor-pointer text-slate-500 hover:text-slate-300">
                  <Info className="w-3.5 h-3.5" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover/tooltip:block w-48 p-2 bg-slate-950 border border-slate-700 rounded-lg text-[11px] text-slate-200 shadow-xl z-20 pointer-events-none">
                    {card.tooltip}
                  </div>
                </div>
              </div>

              <div className={`p-2.5 bg-gradient-to-tr ${card.color} text-white rounded-xl shadow-md`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
              {card.value}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>{card.subtitle}</span>
              <span className="px-2 py-0.5 bg-slate-900/60 border border-slate-700/50 rounded-md text-[10px] text-slate-300 font-mono">
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
