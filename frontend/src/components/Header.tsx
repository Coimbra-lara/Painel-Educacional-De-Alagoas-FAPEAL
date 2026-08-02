import React from 'react';
import { Upload, GraduationCap, Database, MapPin } from 'lucide-react';

interface HeaderProps {
  onOpenUpload: () => void;
  totalRows?: number;
  municipiosCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenUpload, totalRows, municipiosCount }) => {
  const munLabel = municipiosCount && municipiosCount > 0
    ? `${municipiosCount} Municípios`
    : 'Alagoas';

  return (
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
  );
};
