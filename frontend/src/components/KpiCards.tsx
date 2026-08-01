import React from 'react';
import { Users, School, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { IndicadoresData } from '../types/index.js';
import { formatNumber, formatPercent } from '../utils/formatters.js';

interface KpiCardsProps {
  data: IndicadoresData | null;
  loading: boolean;
  etapa?: string;
  variavel?: string;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ data, loading, etapa }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-[#E5E0D7] rounded-2xl p-6 animate-pulse h-36 flex flex-col justify-between">
            <div className="h-4 bg-[#F2EDE4] rounded w-1/2"></div>
            <div className="h-8 bg-[#F2EDE4] rounded w-3/4"></div>
            <div className="h-3 bg-[#F2EDE4] rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const isNaoAplicavelEtapa =
    etapa &&
    etapa !== 'Todas' &&
    ['Educação Infantil', 'EJA', 'Educação Profissional', 'EJA - Educação de Jovens e Adultos'].includes(etapa);

  const periodoReferencia = data?.periodoReferencia ?? null;

  const cards = [
    {
      title: 'Total de Matrículas',
      rawValue: data?.totalMatriculas,
      value: formatNumber(data?.totalMatriculas),
      subtitle: 'Alunos matriculados no recorte',
      icon: Users,
      badge: 'Filtrado por Total',
      tooltip: 'Soma filtrada pela rede Total para evitar contagem triplicada de alunos',
      isRate: false,
      periodo: null as string | null,
    },
    {
      title: 'Ofertas de Ensino',
      rawValue: data?.totalOfertasEscolas,
      value: formatNumber(data?.totalOfertasEscolas),
      subtitle: 'Contagem de etapas por escola',
      icon: School,
      badge: 'Ofertas em escolas',
      tooltip: 'Escolas que oferecem mais de uma etapa são computadas em cada etapa ofertada',
      isRate: false,
      periodo: null as string | null,
    },
    {
      title: 'Taxa de Aprovação',
      rawValue: data?.taxaAprovacaoPonderada,
      value: formatPercent(data?.taxaAprovacaoPonderada),
      subtitle: periodoReferencia ? `Período: ${periodoReferencia}` : 'Todos os anos disponíveis',
      icon: CheckCircle,
      badge: 'Ponderada por Matrículas',
      tooltip: 'Fórmula: SUM(taxa × matrículas) / SUM(matrículas) — agrega todos os anos do intervalo filtrado',
      isRate: true,
      periodo: periodoReferencia,
    },
    {
      title: 'Taxa de Abandono',
      rawValue: data?.taxaAbandonoPonderada,
      value: formatPercent(data?.taxaAbandonoPonderada),
      subtitle: periodoReferencia ? `Período: ${periodoReferencia}` : 'Todos os anos disponíveis',
      icon: AlertTriangle,
      badge: 'Ponderada por Matrículas',
      tooltip: 'Fórmula: SUM(taxa × matrículas) / SUM(matrículas) — agrega todos os anos do intervalo filtrado',
      isRate: true,
      periodo: periodoReferencia,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isNull = card.rawValue === null || card.rawValue === undefined;

        return (
          <div
            key={idx}
            className="bg-white hover:bg-[#FCFBF8] border border-[#E5E0D7] hover:border-[#D0C9BD] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-200 group relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6A63] group-hover:text-[#0E3B3A] transition">
                  {card.title}
                </span>
                <div className="group/tooltip relative cursor-pointer text-[#8C867A] hover:text-[#0E3B3A]">
                  <Info className="w-3.5 h-3.5" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block w-48 p-2.5 bg-[#1C2B26] border border-[#3D4E47] rounded-xl text-[11px] text-[#FAF8F5] shadow-xl z-20 pointer-events-none leading-relaxed">
                    {card.tooltip}
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-[#F2EDE4] text-[#0E3B3A] border border-[#E2DDD3] rounded-xl group-hover:bg-[#0E3B3A] group-hover:text-white transition-colors duration-200 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="text-3xl sm:text-4xl font-serif font-normal text-[#0E3B3A] tracking-tight my-2">
              {isNull ? (
                card.isRate && isNaoAplicavelEtapa ? (
                  <span className="text-xs font-semibold text-[#855B18] bg-[#FAF3E5] border border-[#EADBBF] px-3 py-1 rounded-lg inline-flex items-center gap-1.5 font-sans">
                    <Info className="w-3.5 h-3.5 shrink-0 text-[#B88228]" />
                    Não se aplica a {etapa}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-[#6E6A63] bg-[#FAF8F5] border border-[#E5E0D7] px-3 py-1 rounded-lg inline-flex items-center gap-1.5 font-sans">
                    <Info className="w-3.5 h-3.5 shrink-0 text-[#8C867A]" />
                    Sem dados no recorte
                  </span>
                )
              ) : (
                card.value
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-[#7A766F] pt-2 border-t border-[#F5F2EB] mt-1">
              <span>{card.subtitle}</span>
              <span className="px-2 py-0.5 bg-[#F2EDE4] border border-[#E2DDD3] rounded-md text-[10px] text-[#0E3B3A] font-mono font-medium">
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
