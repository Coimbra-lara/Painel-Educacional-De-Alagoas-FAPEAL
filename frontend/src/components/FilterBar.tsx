import React from 'react';
import { Filter, RotateCcw, Calendar, Building2, BookOpen, BarChart2, Info } from 'lucide-react';
import { FiltrosResponse, FilterState } from '../types/index.js';

interface FilterBarProps {
  options: FiltrosResponse;
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  onReset: () => void;
}

/**
 * Variáveis do censo_demografico: não possuem rede/etapa educacional.
 * Devem ser mantidas em sincronismo com o backend (censoDemografico.ts).
 */
const VARIAVEIS_CENSO_DEMOGRAFICO = [
  'Taxa de Analfabetismo',
  'Taxa de Alfabetização',
  'Pessoas Total',
  'Pessoas Alfabetizadas',
];

export const FilterBar: React.FC<FilterBarProps> = ({ options, filters, onChange, onReset }) => {
  const isCensoDemografico = VARIAVEIS_CENSO_DEMOGRAFICO.includes(filters.variavel ?? '');

  return (
    <div className="bg-white border border-[#E5E0D7] rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-5">
      <div className="flex items-center justify-between border-b border-[#E5E0D7] pb-3.5">
        <div className="flex items-center gap-2 text-sm font-serif font-medium text-[#0E3B3A]">
          <Filter className="w-4 h-4 text-[#0E3B3A]" />
          <span className="text-base tracking-tight">Filtros Globais do Dashboard</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-[#6E6A63] hover:text-[#0E3B3A] hover:bg-[#F2EDE4] transition px-3 py-1.5 rounded-lg border border-[#E5E0D7] bg-[#FAF8F5]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Limpar Filtros</span>
        </button>
      </div>

      {/* Aviso quando variável do censo demográfico está selecionada */}
      {isCensoDemografico && (
        <div className="flex items-start gap-2.5 bg-[#FAF3E5] border border-[#E8D7B5] rounded-xl px-4 py-3 text-xs text-[#7A5416]">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#B88228]" />
          <span>
            O indicador <strong>"{filters.variavel}"</strong> é proveniente do Censo Demográfico
            (IBGE) e representa a população de 15 anos ou mais de idade. Os filtros{' '}
            <strong>Rede de Ensino</strong> e <strong>Etapa de Ensino</strong> não se aplicam a esta
            variável e foram desabilitados automaticamente.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Indicador / Variável */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6E6A63] mb-1.5 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-[#0E3B3A]" />
            <span>Indicador Principal</span>
          </label>
          <select
            value={filters.variavel}
            onChange={(e) => onChange({ variavel: e.target.value })}
            className="w-full bg-[#FAF8F5] border border-[#E5E0D7] focus:border-[#0E3B3A] rounded-xl px-3 py-2 text-sm text-[#1C2B26] focus:outline-none focus:ring-1 focus:ring-[#0E3B3A] transition shadow-xs"
          >
            {options.variaveis.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Município */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6E6A63] mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#0E3B3A]" />
            <span>Município</span>
          </label>
          <select
            value={filters.municipios.length === 1 ? filters.municipios[0] : ''}
            onChange={(e) => {
              const val = e.target.value;
              onChange({ municipios: val ? [val] : [] });
            }}
            className="w-full bg-[#FAF8F5] border border-[#E5E0D7] focus:border-[#0E3B3A] rounded-xl px-3 py-2 text-sm text-[#1C2B26] focus:outline-none focus:ring-1 focus:ring-[#0E3B3A] transition shadow-xs"
          >
            <option value="">
              Todos os Municípios{options.municipios.length > 0 ? ` (${options.municipios.length})` : ''}
            </option>
            {options.municipios.map((m) => (
              <option key={m.co_mun} value={m.co_mun}>
                {m.no_mun}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Rede de Ensino — desabilitado para variáveis do censo demográfico */}
        <div className={isCensoDemografico ? 'opacity-40 pointer-events-none' : ''}>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6E6A63] mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#0E3B3A]" />
            <span>Rede de Ensino</span>
            {isCensoDemografico && (
              <span className="text-[#B88228] text-[10px] font-normal lowercase">(não aplicável)</span>
            )}
          </label>
          <select
            value={isCensoDemografico ? 'Não se aplica' : filters.rede || 'Todos'}
            onChange={(e) => onChange({ rede: e.target.value })}
            disabled={isCensoDemografico}
            className="w-full bg-[#FAF8F5] border border-[#E5E0D7] focus:border-[#0E3B3A] rounded-xl px-3 py-2 text-sm text-[#1C2B26] focus:outline-none focus:ring-1 focus:ring-[#0E3B3A] transition disabled:cursor-not-allowed shadow-xs"
          >
            {isCensoDemografico ? (
              <option value="Não se aplica">Não se aplica</option>
            ) : (
              <>
                <option value="Todos">Todas as Redes (Exibe Total)</option>
                {options.redes.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* 4. Etapa de Ensino — desabilitado para variáveis do censo demográfico */}
        <div className={isCensoDemografico ? 'opacity-40 pointer-events-none' : ''}>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6E6A63] mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#0E3B3A]" />
            <span>Etapa de Ensino</span>
            {isCensoDemografico && (
              <span className="text-[#B88228] text-[10px] font-normal lowercase">(não aplicável)</span>
            )}
          </label>
          <select
            value={isCensoDemografico ? 'Pessoas de 15 anos ou mais de idade' : filters.etapa || 'Todas'}
            onChange={(e) => onChange({ etapa: e.target.value })}
            disabled={isCensoDemografico}
            className="w-full bg-[#FAF8F5] border border-[#E5E0D7] focus:border-[#0E3B3A] rounded-xl px-3 py-2 text-sm text-[#1C2B26] focus:outline-none focus:ring-1 focus:ring-[#0E3B3A] transition disabled:cursor-not-allowed shadow-xs"
          >
            {isCensoDemografico ? (
              <option value="Pessoas de 15 anos ou mais de idade">
                Pessoas de 15 anos ou mais de idade
              </option>
            ) : (
              <>
                <option value="Todas">Todas as Etapas</option>
                {options.etapas.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* 5. Intervalo de Anos */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6E6A63] mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#0E3B3A]" />
            <span>Ano / Intervalo</span>
          </label>
          <div className="flex items-center gap-2">
            <select
              value={filters.anoInicio || ''}
              onChange={(e) =>
                onChange({ anoInicio: e.target.value ? parseInt(e.target.value, 10) : undefined })
              }
              className={`w-full bg-[#FAF8F5] border ${
                filters.anoInicio !== undefined && filters.anoFim !== undefined && filters.anoInicio > filters.anoFim
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-[#E5E0D7] focus:ring-[#0E3B3A] focus:border-[#0E3B3A]'
              } rounded-xl px-2.5 py-2 text-xs text-[#1C2B26] focus:outline-none focus:ring-1 transition shadow-xs`}
            >
              <option value="">Início</option>
              {options.anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <span className="text-[#6E6A63] text-xs">até</span>
            <select
              value={filters.anoFim || ''}
              onChange={(e) =>
                onChange({ anoFim: e.target.value ? parseInt(e.target.value, 10) : undefined })
              }
              className={`w-full bg-[#FAF8F5] border ${
                filters.anoInicio !== undefined && filters.anoFim !== undefined && filters.anoInicio > filters.anoFim
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-[#E5E0D7] focus:ring-[#0E3B3A] focus:border-[#0E3B3A]'
              } rounded-xl px-2.5 py-2 text-xs text-[#1C2B26] focus:outline-none focus:ring-1 transition shadow-xs`}
            >
              <option value="">Fim</option>
              {options.anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          {filters.anoInicio !== undefined && filters.anoFim !== undefined && filters.anoInicio > filters.anoFim && (
            <p className="text-[11px] text-rose-700 font-medium mt-1.5 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              O ano inicial deve ser menor ou igual ao ano final.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
