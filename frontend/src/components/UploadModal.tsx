import React, { useState, useEffect } from 'react';
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

  // Clear modal state whenever the modal closes so it opens fresh every time
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setLoading(false);
      setError(null);
      setReport(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setFile(null);
    setLoading(false);
    setError(null);
    setReport(null);
    onClose();
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl max-w-lg w-full p-7 relative overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#64748B] hover:text-[#0F5237] p-1.5 rounded-lg hover:bg-[#F1F5F9] transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-2.5 bg-[#ECF7F0] text-[#0F5237] border border-[#D8EEE0] rounded-xl flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#0F5237]">Importar Arquivo CSV</h2>
            <p className="text-xs text-[#64748B] mt-0.5">Processamento transacional em streaming no servidor</p>
          </div>
        </div>

        {!report ? (
          <div className="space-y-5">
            <label className="border-2 border-dashed border-[#CBD5E1] hover:border-[#0F5237] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-[#F8FAF9] hover:bg-[#ECF7F0]/60 transition-all text-center group">
              <FileText className="w-10 h-10 text-[#94A3B8] group-hover:text-[#0F5237] mb-3 transition" />
              <span className="text-sm font-medium text-[#1E293B]">
                {file ? file.name : 'Clique ou arraste o arquivo CSV aqui'}
              </span>
              <span className="text-xs text-[#64748B] mt-1">
                {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Suporta de 3.500 até 145.000+ linhas'}
              </span>
              <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </label>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#64748B] hover:text-[#0F5237] hover:bg-[#F1F5F9] rounded-lg transition"
              >
                Cancelar
              </button>

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0F5237] hover:bg-[#0B412B] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-xs uppercase tracking-wider rounded-lg shadow-xs transition"
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
          <div className="space-y-5 animate-fade-in">
            <div className="p-4 bg-[#ECF7F0] border border-[#D8EEE0] rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#0F5237] shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-[#0F5237]">Importação Concluída com Sucesso!</h3>
                <p className="text-xs text-[#0B412B] mt-0.5">Os dados foram armazenados no banco de dados.</p>
              </div>
            </div>

            {report.duplicados && report.duplicados > 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-950">
                    Arquivo contém dados duplicados. Os registros duplicados não foram importados.
                  </h3>
                  <p className="text-xs text-amber-800 mt-1 font-medium">
                    Quantidade de duplicados encontrados: {report.duplicados.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 bg-[#F8FAF9] rounded-xl border border-[#E2E8F0]">
                <div className="text-xl font-semibold text-[#1E293B]">{report.linhasLidas.toLocaleString('pt-BR')}</div>
                <div className="text-[10px] text-[#64748B] font-mono uppercase tracking-wider mt-0.5">Lidas</div>
              </div>
              <div className="p-3.5 bg-[#F8FAF9] rounded-xl border border-[#E2E8F0]">
                <div className="text-xl font-semibold text-[#0F5237]">{report.linhasImportadas.toLocaleString('pt-BR')}</div>
                <div className="text-[10px] text-[#0F5237] font-mono uppercase tracking-wider mt-0.5">Importadas</div>
              </div>
              <div className="p-3.5 bg-[#F8FAF9] rounded-xl border border-[#E2E8F0]">
                <div className="text-xl font-semibold text-[#902A20]">{report.linhasRejeitadas.toLocaleString('pt-BR')}</div>
                <div className="text-[10px] text-[#902A20] font-mono uppercase tracking-wider mt-0.5">Rejeitadas</div>
              </div>
            </div>

            {report.erros && report.erros.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold text-[#1E293B] mb-2">Linhas com Inconsistências ({report.erros.length}):</h4>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-xs text-[#64748B] font-mono">
                  {report.erros.map((err, idx) => (
                    <div key={idx} className="p-2 bg-[#F8FAF9] rounded border border-[#E2E8F0]">
                      Linha {err.linha}: {err.motivo}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleClose}
                className="px-5 py-2.5 bg-[#0F5237] hover:bg-[#0B412B] text-white font-medium text-xs uppercase tracking-wider rounded-lg shadow-xs transition"
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
