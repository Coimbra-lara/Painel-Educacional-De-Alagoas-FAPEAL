import React, { useState } from 'react';
import { Upload, GraduationCap, Database, MapPin, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface HeaderProps {
  onOpenUpload: () => void;
  onClearData: () => void;
  isClearing: boolean;
  totalRows?: number;
  municipiosCount?: number;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  onClearData,
  isClearing,
  totalRows,
  municipiosCount,
  hasData,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const munLabel = municipiosCount && municipiosCount > 0
    ? `${municipiosCount} Municípios`
    : 'Alagoas';

  const handleClearClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmClear = () => {
    setShowConfirm(false);
    onClearData();
  };

  const handleCancelClear = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <header className="bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] sticky top-0 z-30 px-4 lg:px-8 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-[#0F5237] text-white rounded-xl shadow-xs border border-[#0B412B] flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl text-[#0F5237] font-semibold tracking-tight">
                Painel Educacional de Alagoas
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] flex items-center gap-2 mt-0.5 font-sans">
                <MapPin className="w-3.5 h-3.5 text-[#0F5237] inline shrink-0" /> {munLabel} | Censo Escolar, Rendimento e Censo Demográfico
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            {totalRows !== undefined && totalRows > 0 && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#ECF7F0] border border-[#D8EEE0] rounded-lg text-xs font-mono text-[#0F5237]">
                <Database className="w-3.5 h-3.5 text-[#0F5237]" />
                <span>{totalRows.toLocaleString('pt-BR')} registros</span>
              </div>
            )}

            {/* Limpar Dados — only visible when there is data */}
            {hasData && (
              <button
                onClick={handleClearClick}
                disabled={isClearing}
                title="Limpar todos os dados importados"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] hover:border-rose-300 hover:bg-rose-50 text-[#64748B] hover:text-rose-700 font-medium text-xs uppercase tracking-wider rounded-lg shadow-xs transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Limpando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Limpar Dados</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-4 py-2 bg-[#0F5237] hover:bg-[#0B412B] text-white font-medium text-xs uppercase tracking-wider rounded-lg shadow-xs transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload CSV</span>
            </button>
          </div>
        </div>
      </header>

      {/* Confirmation dialog for "Limpar Dados" */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl max-w-sm w-full p-7 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h2 className="text-lg font-semibold text-[#1E293B]">Limpar todos os dados?</h2>
            </div>
            <p className="text-sm text-[#64748B] mb-6 leading-relaxed">
              Esta ação remove <strong>todos os registros importados</strong> do banco de dados. O painel voltará ao estado vazio e pedirá um novo upload de CSV.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelClear}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#64748B] hover:text-[#0F5237] hover:bg-[#F1F5F9] rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmClear}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs uppercase tracking-wider rounded-lg shadow-xs transition"
              >
                <Trash2 className="w-4 h-4" />
                Sim, limpar tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
