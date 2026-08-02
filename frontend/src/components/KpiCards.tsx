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
          <div key={i} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 animate-pulse h-40 flex flex-col justify-between">
            <div className="h-4 bg-[#F1F5F9] rounded w-1/2"></div>
            <div className="h-8 bg-[#F1F5F9] rounded w-3/4"></div>
            <div className="h-3 bg-[#F1F5F9] rounded w-full"></div>
            <div className="h-3 bg-[#F1F5F9] rounded w-2/3"></div>
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
  const anoRefMatriculas = data?.anoReferenciaMatriculas ?? null;
  const anoRefEscolas = data?.anoReferenciaEscolas ?? null;
  const qtdMun = data?.qtdMunicipios ?? 0;
  const rede = data?.redeFiltrada ?? 'Total';
  const etapaLabel = data?.etapaFiltrada ?? 'Todas as etapas';
  const scopeLabel = `${qtdMun === 0 ? 'Todos os' : qtdMun} município(s) | Rede: ${rede} | ${etapaLabel}`;

  const cards = [
    {
      title: 'Total de Matrículas',
      rawValue: data?.totalMatriculas,
      value: formatNumber(data?.totalMatriculas),
      anoRef: anoRefMatriculas,
      subtitle: anoRefMatriculas
        ? `Contagem no recorte — ano de referência: ${anoRefMatriculas}`
        : 'Contagem no recorte selecionado',
      methodology: `Soma de alunos matriculados filtrada pela rede "${rede}" para evitar dupla contagem entre redes. Matrícula é uma medida de estoque (fotografia de um momento), por isso o valor exibido é sempre de um único ano de referência — o mais recente disponível no intervalo filtrado.`,
      scopeLabel,
      icon: Users,
      badge: 'Filtrado por Total',
      isRate: false,
    },
    {
      title: 'Ofertas de Ensino',
      rawValue: data?.totalOfertasEscolas,
      value: formatNumber(data?.totalOfertasEscolas),
      anoRef: anoRefEscolas,
      subtitle: anoRefEscolas
        ? `Contagem de ofertas — ano de referência: ${anoRefEscolas}`
        : 'Contagem de ofertas no recorte',
      methodology: `Soma de etapas por escola no ano de referência. Uma mesma escola que oferta Ensino Fundamental e Ensino Médio é contada duas vezes — este número representa "ofertas de ensino", não "escolas". Para obter a contagem real de escolas, selecione uma etapa específica no filtro.`,
      scopeLabel,
      icon: School,
      badge: 'Ofertas em escolas',
      isRate: false,
    },
    {
      title: 'Taxa de Aprovação',
      rawValue: data?.taxaAprovacaoPonderada,
      value: formatPercent(data?.taxaAprovacaoPonderada),
      anoRef: null,
      subtitle: periodoReferencia ? `Período: ${periodoReferencia}` : 'Todos os anos disponíveis',
      methodology: `Média ponderada por Matrículas: SUM(taxa × matrículas) / SUM(matrículas). Agrega todos os anos e municípios do intervalo filtrado. Taxas disponíveis apenas para Ensino Fundamental e Ensino Médio.`,
      scopeLabel,
      icon: CheckCircle,
      badge: 'Ponderada por Matrículas',
      isRate: true,
    },
    {
      title: 'Taxa de Abandono',
      rawValue: data?.taxaAbandonoPonderada,
      value: formatPercent(data?.taxaAbandonoPonderada),
      anoRef: null,
      subtitle: periodoReferencia ? `Período: ${periodoReferencia}` : 'Todos os anos disponíveis',
      methodology: `Média ponderada por Matrículas: SUM(taxa × matrículas) / SUM(matrículas). Agrega todos os anos e municípios do intervalo filtrado. Taxas disponíveis apenas para Ensino Fundamental e Ensino Médio.`,
      scopeLabel,
      icon: AlertTriangle,
      badge: 'Ponderada por Matrículas',
      isRate: true,
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
            className="bg-white hover:bg-[#F8FAF9] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-200 group relative overflow-hidden flex flex-col gap-2"
          >
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] group-hover:text-[#0F5237] transition">
                  {card.title}
                </span>
                {/* Tooltip with full methodology */}
                <div className="group/tooltip relative cursor-pointer text-[#94A3B8] hover:text-[#0F5237]">
                  <Info className="w-3.5 h-3.5" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-64 p-3 bg-[#0F172A] border border-[#334155] rounded-xl text-[11px] text-[#F8FAFC] shadow-xl z-20 pointer-events-none leading-relaxed">
                    <p className="font-semibold mb-1 text-white">Metodologia</p>
                    <p className="text-[#CBD5E1]">{card.methodology}</p>
                    <p className="mt-2 font-semibold text-white">Recorte atual</p>
                    <p className="text-[#CBD5E1]">{card.scopeLabel}</p>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-[#ECF7F0] text-[#0F5237] border border-[#D8EEE0] rounded-xl group-hover:bg-[#0F5237] group-hover:text-white transition-colors duration-200 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
            </div>

            {/* Value */}
            <div className="text-3xl sm:text-4xl font-semibold text-[#0F5237] tracking-tight">
              {isNull ? (
                card.isRate && isNaoAplicavelEtapa ? (
                  <span className="text-xs font-semibold text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] px-3 py-1 rounded-lg inline-flex items-center gap-1.5 font-sans">
                    <Info className="w-3.5 h-3.5 shrink-0 text-[#B45309]" />
                    Não se aplica a {etapa}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-[#64748B] bg-[#F8FAF9] border border-[#E2E8F0] px-3 py-1 rounded-lg inline-flex items-center gap-1.5 font-sans">
                    <Info className="w-3.5 h-3.5 shrink-0 text-[#94A3B8]" />
                    Sem dados no recorte
                  </span>
                )
              ) : (
                card.value
              )}
            </div>

            {/* Reference year badge (for stock variables) */}
            {card.anoRef !== null && (
              <div className="flex">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-md text-[10px] text-[#92400E] font-mono font-semibold">
                  Ano Ref.: {card.anoRef}
                </span>
              </div>
            )}

            {/* Footer row */}
            <div className="flex items-start justify-between text-xs text-[#64748B] pt-2 border-t border-[#F1F5F9] gap-2">
              <span className="leading-snug">{card.subtitle}</span>
              <span className="shrink-0 px-2 py-0.5 bg-[#ECF7F0] border border-[#D8EEE0] rounded-md text-[10px] text-[#0F5237] font-mono font-medium whitespace-nowrap">
                {card.badge}
              </span>
            </div>

            {/* Scope line */}
            <p className="text-[10px] text-[#94A3B8] leading-snug">
              {card.scopeLabel}
            </p>
          </div>
        );
      })}
    </div>
  );
};
