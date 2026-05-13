"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Loader2, FileText, User, Car, Calendar } from 'lucide-react';
import { generateRCVPDF } from '@/utils/pdfGenerator';

function OfflineVerifyContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<any>(null);
  const [error, setError] = useState(false);

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
        
        // Map back to full keys
        const fullData = {
          nombres_tomador: decoded.nt,
          cedula_tomador: decoded.ct,
          placa: decoded.pl,
          marca: decoded.ma,
          modelo: decoded.mo,
          ano: decoded.an,
          color: decoded.co,
          vigencia_desde: decoded.vd,
          poliza_no: decoded.pn,
          recibo_no: decoded.rn,
          fecha_emision: decoded.fe,
          sucursal: decoded.su,
          uso: decoded.us,
          tipo: decoded.ti,
          pasajeros: decoded.pa,
          serie_motor: decoded.sm,
          serie_carroceria: decoded.sc,
          clase: decoded.cl,
          cilindros: decoded.ci,
          tipo_carga: decoded.tc,
          toneladas: decoded.to
        };
        
        setPolicy(fullData);
      } catch (err) {
        console.error("Decode error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    } else {
      setError(true);
      setLoading(false);
    }
  }, [searchParams]);

  const handleDownload = async () => {
    if (!policy) return;
    try {
      const pdfBlob = await generateRCVPDF(policy);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rcv_${policy.poliza_no.replace('-', '_')}.pdf`;
      link.click();
    } catch (err) {
      alert("Error reconstruyendo el PDF");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-dark rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5"
        >
          {error ? (
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert size={48} />
              </div>
              <h1 className="text-3xl font-bold mb-4">Datos Inválidos</h1>
              <p className="text-slate-400 mb-8">El código QR escaneado no contiene información válida o está corrupto.</p>
              <a href="/" className="inline-block w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition-colors">
                Volver al inicio
              </a>
            </div>
          ) : (
            <>
              <div className="bg-blue-500/10 p-8 text-center border-b border-blue-500/20">
                <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                  <ShieldCheck size={48} />
                </div>
                <h1 className="text-3xl font-black text-blue-400 uppercase tracking-tight">Verificación Offline</h1>
                <p className="text-blue-500/60 font-bold tracking-widest text-sm mt-1">CERTIFICADO AUTOCONTENIDO</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-slate-500 text-xs font-bold uppercase">Nro. Póliza</p>
                    <p className="font-mono text-lg">{policy.poliza_no}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-slate-500 text-xs font-bold uppercase">Placa</p>
                    <p className="font-mono text-lg text-blue-400 font-bold">{policy.placa}</p>
                  </div>
                </div>

                <div className="h-px bg-white/5 w-full" />

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] font-bold uppercase leading-none mb-1">Titular</p>
                      <p className="font-semibold uppercase">{policy.nombres_tomador}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                      <Car size={20} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] font-bold uppercase leading-none mb-1">Vehículo</p>
                      <p className="font-semibold uppercase">{policy.marca} {policy.modelo} ({policy.ano})</p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <Calendar size={18} />
                    <span className="text-sm font-bold uppercase">Vigencia:</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-sm uppercase">Póliza Emitida</span>
                </div>

                <button 
                  onClick={handleDownload}
                  className="w-full py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:scale-[1.02] active:scale-95 transition-all rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/40"
                >
                  <FileText size={22} />
                  RECONSTRUIR PDF COMPLETO
                </button>
              </div>
            </>
          )}
        </motion.div>
        
        <p className="text-center mt-8 text-slate-600 text-xs font-medium uppercase tracking-widest">
          Verificación Local • Sin dependencia de servidores
        </p>
      </div>
    </main>
  );
}

export default function OfflineVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    }>
      <OfflineVerifyContent />
    </Suspense>
  );
}
