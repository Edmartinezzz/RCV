"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { generateRCVPDF } from '@/utils/pdfGenerator';
import { Download, Loader2 } from 'lucide-react';

function MinimalDownload() {
  const searchParams = useSearchParams();
  const [policy, setPolicy] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

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

      const policyData = {
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
        toneladas: decoded[20],
        domicilio_tomador: decoded[21] || ""
      };

      setPolicy(policyData);
      setStatus('ready');

      // Intentar auto-descarga silenciosa
      setTimeout(() => {
        handleDownload(policyData);
      }, 1000);
    } catch (e) {
      setStatus('error');
    }
  }, [searchParams]);

  const handleDownload = async (data: any = policy) => {
    if (!data) return;
    try {
      const pdfBlob = await generateRCVPDF(data);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `RCV_${data.placa}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  if (status === 'error') return <div className="min-h-screen bg-black" />;

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-xs text-center">
        {status === 'loading' ? (
          <Loader2 className="animate-spin text-slate-700 mx-auto" size={40} />
        ) : (
          <button 
            onClick={() => handleDownload()}
            className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-2xl font-black flex items-center justify-center gap-4 transition-all shadow-xl"
          >
            <Download size={28} />
            <span className="text-lg">DESCARGAR PDF</span>
          </button>
        )}
        <p className="mt-8 text-slate-800 text-[10px] uppercase tracking-widest font-bold">
          Sistema de Verificación Vehicular
        </p>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <MinimalDownload />
    </Suspense>
  );
}
