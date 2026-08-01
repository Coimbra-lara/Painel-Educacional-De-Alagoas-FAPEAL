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
    <header className="bg-[#F7F5F0]/90 backdrop-blur-md border-b border-[#E5E0D7] sticky top-0 z-30 px-4 lg:px-8 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-[#0E3B3A] text-white rounded-xl shadow-xs border border-[#092B2A] flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl text-[#0E3B3A] font-normal tracking-tight">
              Painel Educacional de Alagoas
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6A63] flex items-center gap-2 mt-0.5 font-sans">
              <MapPin className="w-3.5 h-3.5 text-[#0E3B3A] inline shrink-0" /> {munLabel} | Censo Escolar, Rendimento e Censo Demográfico
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          {totalRows !== undefined && totalRows > 0 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#F2EDE4] border border-[#E5E0D7] rounded-lg text-xs font-mono text-[#0E3B3A]">
              <Database className="w-3.5 h-3.5 text-[#0E3B3A]" />
              <span>{totalRows.toLocaleString('pt-BR')} registros</span>
            </div>
          )}

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2 bg-[#0E3B3A] hover:bg-[#092B2A] text-white font-medium text-xs uppercase tracking-wider rounded-lg shadow-xs transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
