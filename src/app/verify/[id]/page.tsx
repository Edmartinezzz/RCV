"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Loader2, FileText, User, Car, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function VerifyPolicy() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchPolicy() {
      try {
        const { data, error: dbError } = await supabase
          .from('rcv_policies')
          .select('*')
          .eq('policy_no', params.id)
          .single();

        if (dbError || !data) {
          setError(true);
        } else {
          setPolicy(data);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) fetchPolicy();
  }, [params.id]);

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
              <h1 className="text-3xl font-bold mb-4">Póliza no encontrada</h1>
              <p className="text-slate-400 mb-8">El código escaneado no corresponde a una póliza válida en nuestro sistema.</p>
              <a href="/" className="inline-block w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition-colors">
                Volver al inicio
              </a>
            </div>
          ) : (
            <>
              <div className="bg-emerald-500/10 p-8 text-center border-b border-emerald-500/20">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  <ShieldCheck size={48} />
                </div>
                <h1 className="text-3xl font-black text-emerald-400 uppercase tracking-tight">Póliza Válida</h1>
                <p className="text-emerald-500/60 font-bold tracking-widest text-sm mt-1">SISTEMA NACIONAL DE VERIFICACIÓN</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-slate-500 text-xs font-bold uppercase">Nro. Póliza</p>
                    <p className="font-mono text-lg">{policy.policy_no}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-slate-500 text-xs font-bold uppercase">Placa</p>
                    <p className="font-mono text-lg text-blue-400 font-bold">{policy.vehicle_plate}</p>
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
                      <p className="font-semibold">{policy.insured_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                      <Car size={20} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] font-bold uppercase leading-none mb-1">Cédula / RIF</p>
                      <p className="font-semibold">{policy.insured_id}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-blue-400">
                    <Calendar size={18} />
                    <span className="text-sm font-bold uppercase">Estado:</span>
                  </div>
                  <span className="bg-emerald-500 text-emerald-950 text-[10px] font-black px-3 py-1 rounded-full uppercase">Activa</span>
                </div>

                <button 
                  onClick={() => {
                    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://joqpapropcfajdgqwodw.supabase.co';
                    window.open(`${supabaseUrl}/storage/v1/object/public/rcv_policies/${policy.pdf_url}`, '_blank');
                  }}
                  className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-500 hover:scale-[1.02] active:scale-95 transition-all rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-900/40"
                >
                  <FileText size={22} />
                  DESCARGAR CERTIFICADO PDF
                </button>
              </div>
            </>
          )}
        </motion.div>
        
        <p className="text-center mt-8 text-slate-600 text-xs font-medium uppercase tracking-widest">
          © {new Date().getFullYear()} RCV Premium • Verificación Oficial
        </p>
      </div>
    </main>
  );
}
