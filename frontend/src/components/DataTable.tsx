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
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E2E8F0] pb-3.5">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-[#0F5237]" />
          <div>
            <h3 className="text-lg font-semibold text-[#0F5237]">Tabela de Dados Paginada (Servidor)</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Visualização detalhada dos registros do recorte atual
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B]">Linhas por página:</span>
          <select
            value={tamanho}
            onChange={(e) => onTamanhoChange(parseInt(e.target.value, 10))}
            className="bg-[#F8FAF9] border border-[#E2E8F0] rounded-lg px-2.5 py-1 text-xs text-[#1E293B] focus:outline-none focus:border-[#0F5237]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAF9] text-[#475569] font-semibold uppercase tracking-wider border-b border-[#E2E8F0]">
            <tr>
              <th className="p-3.5">Cód. IBGE</th>
              <th className="p-3.5">Município</th>
              <th className="p-3.5">Ano</th>
              <th className="p-3.5">Fonte</th>
              <th className="p-3.5">Variável</th>
              <th className="p-3.5">Rede de Ensino</th>
              <th className="p-3.5">Etapa de Ensino</th>
              <th className="p-3.5 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] font-sans">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[#64748B]">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#0F5237]" />
                    <span>Carregando dados do servidor...</span>
                  </div>
                </td>
              </tr>
            ) : !data || data.itens.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[#64748B]">
                  Nenhum registro encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              data.itens.map((item) => {
                const isRate = item.variavel.startsWith('Taxa');
                return (
                  <tr key={item.id} className="hover:bg-[#F8FAF9] transition">
                    <td className="p-3.5 font-mono text-[#64748B]">{item.co_mun}</td>
                    <td className="p-3.5 font-semibold text-[#0F5237]">{item.no_mun}</td>
                    <td className="p-3.5 font-mono text-[#475569]">{item.ano}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-[#ECF7F0] border border-[#D8EEE0] rounded text-[10px] text-[#0F5237] font-mono font-medium">
                        {item.fonte}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-[#0F5237]">{item.variavel}</td>
                    <td className="p-3.5 text-[#475569]">{item.ensino_rede}</td>
                    <td className="p-3.5 text-[#475569]">{item.ensino_tipo}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-[#0F5237]">
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
          <div className="text-xs text-[#64748B]">
            Mostrando <span className="font-semibold text-[#1E293B]">{((pagina - 1) * tamanho) + 1}</span> até{' '}
            <span className="font-semibold text-[#1E293B]">{Math.min(pagina * tamanho, data.total)}</span> de{' '}
            <span className="font-semibold text-[#1E293B]">{data.total.toLocaleString('pt-BR')}</span> registros
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <button
              onClick={() => onPageChange(1)}
              disabled={pagina === 1 || loading}
              className="p-1.5 bg-[#F8FAF9] border border-[#E2E8F0] hover:bg-[#ECF7F0] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition"
            >
              <ChevronsLeft className="w-4 h-4 text-[#0F5237]" />
            </button>
            <button
              onClick={() => onPageChange(pagina - 1)}
              disabled={pagina === 1 || loading}
              className="p-1.5 bg-[#F8FAF9] border border-[#E2E8F0] hover:bg-[#ECF7F0] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4 text-[#0F5237]" />
            </button>

            <span className="px-3 py-1 bg-[#F8FAF9] border border-[#E2E8F0] rounded-lg text-xs font-mono text-[#0F5237]">
              Página {pagina} de {data.paginas}
            </span>

            <button
              onClick={() => onPageChange(pagina + 1)}
              disabled={pagina >= data.paginas || loading}
              className="p-1.5 bg-[#F8FAF9] border border-[#E2E8F0] hover:bg-[#ECF7F0] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4 text-[#0F5237]" />
            </button>
            <button
              onClick={() => onPageChange(data.paginas)}
              disabled={pagina >= data.paginas || loading}
              className="p-1.5 bg-[#F8FAF9] border border-[#E2E8F0] hover:bg-[#ECF7F0] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition"
            >
              <ChevronsRight className="w-4 h-4 text-[#0F5237]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
