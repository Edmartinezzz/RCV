"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { generateRCVPDF } from '@/utils/pdfGenerator';
import { FileDown, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

function AutoDownloadContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [policyData, setPolicy] = useState<any>(null);

  useEffect(() => {
    const dataEncoded = searchParams.get('d');
    if (!dataEncoded) {
      setStatus('error');
      return;
    }

    try {
      const normalized = dataEncoded.replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(normalized);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const jsonStr = decodeURIComponent(Array.from(bytes).map(b => '%' + b.toString(16).padStart(2, '0')).join(''));
      const decoded = JSON.parse(jsonStr);

      const policy = {
        nombres_tomador: decoded[0],
        cedula_tomador: decoded[1],
        placa: decoded[2],
        marca: decoded[3],
        modelo: decoded[4],
        ano: decoded[5],
        color: decoded[6],
        vigencia_desde: decoded[7],
        poliza_no: decoded[8],
        recibo_no: decoded[9],
        fecha_emision: decoded[10],
        sucursal: decoded[11],
        uso: decoded[12],
        tipo: decoded[13],
        pasajeros: decoded[14],
        serie_motor: decoded[15],
        serie_carroceria: decoded[16],
        clase: decoded[17],
        cilindros: decoded[18],
        tipo_carga: decoded[19],
        toneladas: decoded[20]
      };

      setPolicy(policy);
      setStatus('ready');

      // Intentar descarga automática con un pequeño delay para que el navegador lo permita
      const timeout = setTimeout(() => {
        handleDownload(policy);
      }, 1000);

      return () => clearTimeout(timeout);
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  }, [searchParams]);

  const handleDownload = async (data: any = policyData) => {
    if (!data) return;
    try {
      const pdfBlob = await generateRCVPDF(data);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `RCV_${data.placa}_${data.poliza_no}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Error al generar el PDF. Intente de nuevo.");
    }
  };

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h1 className="text-white text-2xl font-bold mb-2">Error de Verificación</h1>
        <p className="text-slate-400">El código QR no contiene datos válidos o está corrupto.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-slate-900 border border-white/5 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-emerald-500 blur-lg opacity-50"></div>
        
        <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
          <ShieldCheck size={56} />
        </div>
        
        <h1 className="text-white text-2xl font-black mb-2 uppercase tracking-tight">Póliza Válida</h1>
        <p className="text-slate-400 text-sm mb-10 leading-relaxed">
          Estamos generando su certificado RCV de forma segura. La descarga iniciará en breve.
        </p>

        {status === 'loading' ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={40} className="text-emerald-500 animate-spin" />
            <span className="text-emerald-500 font-bold text-xs uppercase tracking-widest">Cifrando Datos</span>
          </div>
        ) : (
          <button 
            onClick={() => handleDownload()}
            className="group w-full py-5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-2xl font-black flex flex-col items-center justify-center gap-1 transition-all shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)]"
          >
            <div className="flex items-center gap-3">
              <FileDown size={24} className="group-hover:bounce" />
              <span>DESCARGAR PDF</span>
            </div>
            <span className="text-[10px] opacity-70 font-normal italic">Si no inicia solo, toque aquí</span>
          </button>
        )}
        
        <p className="mt-10 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
          RCV PREMIUM • OFICIAL
        </p>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <AutoDownloadContent />
    </Suspense>
  );
}
