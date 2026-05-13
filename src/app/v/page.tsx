"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, FileCheck, ShieldCheck } from 'lucide-react';
import { generateRCVPDF } from '@/utils/pdfGenerator';
import { motion } from 'framer-motion';

function RedirectContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Verificando Póliza...");

  useEffect(() => {
    const dataEncoded = searchParams.get('d');
    if (dataEncoded) {
      try {
        // Decode Base64 UTF-8 Safe
        const normalized = dataEncoded.replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(normalized);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const jsonStr = decodeURIComponent(Array.from(bytes).map(b => '%' + b.toString(16).padStart(2, '0')).join(''));
        const decoded = JSON.parse(jsonStr);

        // Map back from Array indices
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

        setStatus("Póliza Válida. Generando Documento...");

        // Auto-generate and download
        const triggerDownload = async () => {
          const pdfBlob = await generateRCVPDF(policy);
          const url = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `rcv_${policy.poliza_no.replace('-', '_')}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setStatus("Certificado Descargado Correctamente.");
        };

        triggerDownload();
      } catch (err) {
        setStatus("Error: Código QR Inválido o Corrupto.");
      }
    } else {
      setStatus("Error: No hay datos para verificar.");
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-dark p-10 rounded-[2.5rem] max-w-md w-full border border-white/5 shadow-2xl"
      >
        <div className="w-24 h-24 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
          {status.includes("Error") ? (
             <ShieldCheck size={56} className="text-red-500" />
          ) : status.includes("Descargado") ? (
            <FileCheck size={56} className="text-emerald-400" />
          ) : (
            <Loader2 size={56} className="animate-spin" />
          )}
        </div>
        
        <h1 className="text-2xl font-black mb-4 tracking-tight uppercase">
          {status.includes("Válida") ? "SISTEMA DE VERIFICACIÓN" : status.includes("Descargado") ? "¡ÉXITO!" : "VERIFICANDO"}
        </h1>
        
        <p className="text-slate-400 font-medium mb-8">
          {status}
        </p>

        {status.includes("Descargado") && (
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition-all"
          >
            Volver a intentar descarga
          </button>
        )}
      </motion.div>
      
      <p className="mt-10 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
        RCV PREMIUM • VERIFICACIÓN INSTANTÁNEA
      </p>
    </main>
  );
}

export default function RedirectPage() {
  return (
    <Suspense fallback={null}>
      <RedirectContent />
    </Suspense>
  );
}
