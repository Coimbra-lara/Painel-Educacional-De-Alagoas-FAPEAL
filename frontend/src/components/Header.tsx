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
    <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700/60 sticky top-0 z-30 px-4 lg:px-8 py-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-xl shadow-md text-white">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-sky-200 bg-clip-text text-transparent">
              Painel Educacional de Alagoas
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400 inline" /> {munLabel} | Censo Escolar, Rendimento e Censo Demográfico
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          {totalRows !== undefined && totalRows > 0 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-xs font-mono text-slate-300">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{totalRows.toLocaleString('pt-BR')} registros</span>
            </div>
          )}

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium text-sm rounded-lg shadow-md transition-all duration-200 hover:shadow-sky-500/25 active:scale-[0.98]"
          >
            <Upload className="w-4 h-4" />
            <span>Upload CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
