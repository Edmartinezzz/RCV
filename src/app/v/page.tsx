"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { generateRCVPDF } from '@/utils/pdfGenerator';
import { Download, ShieldCheck, Loader2 } from 'lucide-react';

function SimpleDownload() {
  const searchParams = useSearchParams();
  const [policy, setPolicy] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const dataEncoded = searchParams.get('d');
    if (!dataEncoded) {
      setError(true);
      return;
    }

    try {
      const normalized = dataEncoded.replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(normalized);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const jsonStr = decodeURIComponent(Array.from(bytes).map(b => '%' + b.toString(16).padStart(2, '0')).join(''));
      const decoded = JSON.parse(jsonStr);

      setPolicy({
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
      });
    } catch (e) {
      setError(true);
    }
  }, [searchParams]);

  const handleDownload = async () => {
    if (!policy) return;
    try {
      const pdfBlob = await generateRCVPDF(policy);
      const url = URL.createObjectURL(pdfBlob);
      
      // En móviles, a veces es mejor abrir en pestaña nueva o usar este método
      const link = document.createElement('a');
      link.href = url;
      link.download = `RCV_${policy.placa}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Error al generar el archivo.");
    }
  };

  if (error) return <div className="min-h-screen bg-black text-red-500 flex items-center justify-center p-6 text-center font-bold">CÓDIGO QR INVÁLIDO</div>;
  if (!policy) return <div className="min-h-screen bg-black text-white flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2rem] p-8 text-center shadow-2xl">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={40} />
        </div>
        
        <h1 className="text-white text-xl font-bold mb-2 uppercase tracking-tight">Póliza Verificada</h1>
        <p className="text-slate-400 text-sm mb-8">La información de la placa <span className="text-emerald-400 font-mono font-bold">{policy.placa}</span> es correcta.</p>

        <button 
          onClick={handleDownload}
          className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
        >
          <Download size={24} />
          DESCARGAR PDF
        </button>
        
        <p className="mt-6 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
          Sistema Oficial de Verificación
        </p>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SimpleDownload />
    </Suspense>
  );
}
