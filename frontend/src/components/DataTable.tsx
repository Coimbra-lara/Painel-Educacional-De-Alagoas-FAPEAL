import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Table, Loader2 } from 'lucide-react';
import { TabelaData } from '../types/index.js';
import { formatNumber, formatFloat } from '../utils/formatters.js';

interface DataTableProps {
  data: TabelaData | null;
  loading: boolean;
  pagina: number;
  tamanho: number;
  onPageChange: (newPage: number) => void;
  onTamanhoChange: (newTamanho: number) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  loading,
  pagina,
  tamanho,
  onPageChange,
  onTamanhoChange,
}) => {
  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/60 pb-3">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-base font-bold text-white">Tabela de Dados Paginada (Servidor)</h3>
            <p className="text-xs text-slate-400">
              Visualização detalhada dos registros do recorte atual
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Linhas por página:</span>
          <select
            value={tamanho}
            onChange={(e) => onTamanhoChange(parseInt(e.target.value, 10))}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900/60">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/90 text-slate-300 font-semibold uppercase tracking-wider border-b border-slate-700/60">
            <tr>
              <th className="p-3">Cód. IBGE</th>
              <th className="p-3">Município</th>
              <th className="p-3">Ano</th>
              <th className="p-3">Fonte</th>
              <th className="p-3">Variável</th>
              <th className="p-3">Rede de Ensino</th>
              <th className="p-3">Etapa de Ensino</th>
              <th className="p-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-sans">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                    <span>Carregando dados do servidor...</span>
                  </div>
                </td>
              </tr>
            ) : !data || data.itens.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Nenhum registro encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              data.itens.map((item) => {
                const isRate = item.variavel.startsWith('Taxa');
                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono text-slate-400">{item.co_mun}</td>
                    <td className="p-3 font-medium text-slate-200">{item.no_mun}</td>
                    <td className="p-3 font-mono text-slate-300">{item.ano}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md text-[10px] text-slate-300 font-mono">
                        {item.fonte}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-sky-300">{item.variavel}</td>
                    <td className="p-3 text-slate-300">{item.ensino_rede}</td>
                    <td className="p-3 text-slate-300">{item.ensino_tipo}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-100">
                      {isRate ? `${formatFloat(item.valor, 2)}%` : formatNumber(item.valor)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {data && data.paginas > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <div className="text-xs text-slate-400">
            Mostrando <span className="font-semibold text-slate-200">{((pagina - 1) * tamanho) + 1}</span> até{' '}
            <span className="font-semibold text-slate-200">{Math.min(pagina * tamanho, data.total)}</span> de{' '}
            <span className="font-semibold text-slate-200">{data.total.toLocaleString('pt-BR')}</span> registros
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <button
              onClick={() => onPageChange(1)}
              disabled={pagina === 1 || loading}
              className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition"
            >
              <ChevronsLeft className="w-4 h-4 text-slate-300" />
            </button>
            <button
              onClick={() => onPageChange(pagina - 1)}
              disabled={pagina === 1 || loading}
              className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>

            <span className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200">
              Página {pagina} de {data.paginas}
            </span>

            <button
              onClick={() => onPageChange(pagina + 1)}
              disabled={pagina >= data.paginas || loading}
              className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
            <button
              onClick={() => onPageChange(data.paginas)}
              disabled={pagina >= data.paginas || loading}
              className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition"
            >
              <ChevronsRight className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
