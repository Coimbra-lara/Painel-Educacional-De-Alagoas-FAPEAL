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
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Filter className="w-4 h-4 text-sky-400" />
          <span>Filtros Globais do Dashboard</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-300 transition hover:bg-slate-700/40 px-2.5 py-1 rounded-lg"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Limpar Filtros</span>
        </button>
      </div>

      {/* Aviso quando variável do censo demográfico está selecionada */}
      {isCensoDemografico && (
        <div className="flex items-start gap-2.5 bg-amber-900/30 border border-amber-600/40 rounded-xl px-4 py-2.5 text-xs text-amber-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
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
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Indicador Principal</span>
          </label>
          <select
            value={filters.variavel}
            onChange={(e) => onChange({ variavel: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition"
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
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Município</span>
          </label>
          <select
            value={filters.municipios.length === 1 ? filters.municipios[0] : ''}
            onChange={(e) => {
              const val = e.target.value;
              onChange({ municipios: val ? [val] : [] });
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition"
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
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Rede de Ensino</span>
            {isCensoDemografico && (
              <span className="text-amber-500 text-[10px] font-normal">(não aplicável)</span>
            )}
          </label>
          <select
            value={isCensoDemografico ? 'Não se aplica' : filters.rede || 'Todos'}
            onChange={(e) => onChange({ rede: e.target.value })}
            disabled={isCensoDemografico}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition disabled:cursor-not-allowed"
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
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Etapa de Ensino</span>
            {isCensoDemografico && (
              <span className="text-amber-500 text-[10px] font-normal">(não aplicável)</span>
            )}
          </label>
          <select
            value={isCensoDemografico ? 'Pessoas de 15 anos ou mais de idade' : filters.etapa || 'Todas'}
            onChange={(e) => onChange({ etapa: e.target.value })}
            disabled={isCensoDemografico}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition disabled:cursor-not-allowed"
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
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>Ano / Intervalo</span>
          </label>
          <div className="flex items-center gap-2">
            <select
              value={filters.anoInicio || ''}
              onChange={(e) =>
                onChange({ anoInicio: e.target.value ? parseInt(e.target.value, 10) : undefined })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            >
              <option value="">Início</option>
              {options.anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <span className="text-slate-500 text-xs">até</span>
            <select
              value={filters.anoFim || ''}
              onChange={(e) =>
                onChange({ anoFim: e.target.value ? parseInt(e.target.value, 10) : undefined })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            >
              <option value="">Fim</option>
              {options.anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
