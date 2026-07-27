import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { uploadCsv } from '../services/api.js';
import { UploadReport } from '../types/index.js';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<UploadReport | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.csv')) {
        setError('Por favor, selecione um arquivo válido com extensão .csv');
        setFile(null);
      } else {
        setError(null);
        setFile(selected);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await uploadCsv(file);
      setReport(result);
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Falha ao processar arquivo CSV';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Importar Arquivo CSV</h2>
            <p className="text-xs text-slate-400">Processamento transacional em streaming no servidor</p>
          </div>
        </div>

        {!report ? (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-slate-600 hover:border-sky-400 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-900/40 hover:bg-slate-900/70 transition-all text-center group">
              <FileText className="w-10 h-10 text-slate-400 group-hover:text-sky-400 mb-2 transition" />
              <span className="text-sm font-medium text-slate-200">
                {file ? file.name : 'Clique ou arraste o arquivo CSV aqui'}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Suporta de 3.500 até 145.000+ linhas'}
              </span>
              <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </label>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition"
              >
                Cancelar
              </button>

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="flex items-center gap-2 px-5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg shadow-md transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando streaming...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Iniciar Importação</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-emerald-300">Importação Concluída com Sucesso!</h3>
                <p className="text-xs text-slate-300 mt-0.5">Os dados foram armazenados no banco de dados.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <div className="text-lg font-bold text-white">{report.linhasLidas.toLocaleString('pt-BR')}</div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">Lidas</div>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <div className="text-lg font-bold text-emerald-400">{report.linhasImportadas.toLocaleString('pt-BR')}</div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">Importadas</div>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <div className="text-lg font-bold text-rose-400">{report.linhasRejeitadas.toLocaleString('pt-BR')}</div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">Rejeitadas</div>
              </div>
            </div>

            {report.erros && report.erros.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold text-slate-300 mb-2">Linhas com Inconsistências ({report.erros.length}):</h4>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-xs text-slate-400 font-mono">
                  {report.erros.map((err, idx) => (
                    <div key={idx} className="p-1.5 bg-slate-900/40 rounded border border-slate-700/40">
                      Linha {err.linha}: {err.motivo}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white font-medium text-sm rounded-lg shadow-md transition"
              >
                Concluir & Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
