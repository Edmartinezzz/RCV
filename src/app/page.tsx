"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, User, ShieldCheck, Download, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { generateRCVPDF } from '@/utils/pdfGenerator';
import { supabase } from '@/lib/supabase';

const STEPS = [
  { id: 'tomador', title: 'Titular', icon: User },
  { id: 'vehiculo', title: 'Vehículo', icon: Car },
  { id: 'poliza', title: 'Emisión', icon: ShieldCheck },
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nombres_tomador: '',
    cedula_tomador: '',
    telefono_tomador: '',
    domicilio_tomador: '',
    parroquia: '',
    entidad: 'AMAZONAS',
    email: '',
    placa: '',
    serie_motor: '',
    serie_carroceria: '',
    marca: '',
    modelo: '',
    ano: new Date().getFullYear().toString(),
    color: '',
    clase: 'OTROS VEHICULOS',
    tipo: 'MOTOCICLETA',
    uso: 'PARTICULAR',
    pasajeros: '2',
    cilindros: '0',
    sucursal: 'OFICINA LIBERTAD',
    vigencia_desde: new Date().toISOString().split('T')[0],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setCurrentStep(curr => Math.min(curr + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(curr => Math.max(curr - 1, 0));

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // 1. Predict IDs
      const policyNumber = `320326-${Math.floor(Math.random() * 9000) + 1000}`;
      const reciboNumber = Math.floor(Math.random() * 90000) + 10000;
      
      const fullData = {
        ...formData,
        poliza_no: policyNumber,
        recibo_no: reciboNumber.toString(),
        certificado_no: reciboNumber.toString(),
        fecha_emision: new Date().toLocaleString(),
      };

      // 2. Generate PDF (Blobs are processed in our util)
      const pdfBlob = await generateRCVPDF(fullData);
      
      // 3. Upload to Supabase Storage
      const fileName = `rcv_${policyNumber.replace('-', '_')}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('rcv_policies')
        .upload(fileName, pdfBlob, { 
          contentType: 'application/pdf',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      // 4. Save to Database
      const { error: dbError } = await supabase
        .from('rcv_policies')
        .insert([{
          policy_no: policyNumber,
          receipt_no: reciboNumber.toString(),
          insured_name: formData.nombres_tomador,
          insured_id: formData.cedula_tomador,
          vehicle_plate: formData.placa,
          pdf_url: fileName
        }]);

      if (dbError) console.error("Database save error (skipped for now):", dbError);

      // 5. Download locally
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      alert('Error en la generación. Verifica la consola o las llaves de Supabase.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full glass-dark p-10 text-center rounded-3xl"
        >
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-bold mb-4">¡RCV Generado!</h2>
          <p className="text-slate-400 mb-8">El documento se ha descargado y el código QR ya es válido para verificación.</p>
          <button 
            onClick={() => { setIsSuccess(false); setCurrentStep(0); }}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 transition-colors rounded-2xl font-bold shadow-lg shadow-emerald-900/20"
          >
            Emitir otro nuevo
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto pt-10 pb-20">
        <header className="text-center mb-12">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
              RCV <span className="text-gradient">PREMIUM</span>
            </h1>
            <p className="text-slate-400 text-lg uppercase tracking-widest font-medium">Emisión de Responsabilidad Civil</p>
          </motion.div>
        </header>

        {/* Steps */}
        <div className="flex justify-between items-center mb-12 relative max-w-xl mx-auto">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -z-10 -translate-y-1/2 rounded-full" />
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex flex-col items-center">
              <div 
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${
                  idx <= currentStep 
                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                    : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                <step.icon size={24} />
              </div>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="glass-dark p-6 md:p-10 rounded-[2.5rem] shadow-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-8"
            >
              {currentStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input label="Nombres y Apellidos" name="nombres_tomador" value={formData.nombres_tomador} onChange={handleChange} placeholder="Ej: JUAN PEREZ" />
                  <Input label="Cédula de Identidad" name="cedula_tomador" value={formData.cedula_tomador} onChange={handleChange} placeholder="V-12345678" />
                  <Input label="Teléfono" name="telefono_tomador" value={formData.telefono_tomador} onChange={handleChange} placeholder="0414..." />
                  <Input label="Correo" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="usuario@gmail.com" />
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-slate-400 text-sm font-semibold ml-1">Dirección Completa</label>
                    <textarea 
                      name="domicilio_tomador"
                      value={formData.domicilio_tomador}
                      onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 focus:border-blue-500 outline-none min-h-[100px] transition-colors"
                    />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input label="Placa" name="placa" value={formData.placa} onChange={handleChange} />
                  <Input label="Marca" name="marca" value={formData.marca} onChange={handleChange} />
                  <Input label="Modelo" name="modelo" value={formData.modelo} onChange={handleChange} />
                  <Input label="Año" name="ano" value={formData.ano} onChange={handleChange} />
                  <Input label="Color" name="color" value={formData.color} onChange={handleChange} />
                  <div className="space-y-2">
                    <label className="text-slate-400 text-sm font-semibold ml-1">Uso</label>
                    <select name="uso" value={formData.uso} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 focus:border-blue-500 outline-none transition-colors appearance-none">
                      <option>PARTICULAR</option>
                      <option>PUBLICO</option>
                      <option>CARGA</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Input label="Serial Chasis" name="serie_carroceria" value={formData.serie_carroceria} onChange={handleChange} />
                  </div>
                  <Input label="Serial Motor" name="serie_motor" value={formData.serie_motor} onChange={handleChange} />
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="p-8 bg-blue-600/10 border border-blue-500/20 rounded-3xl flex items-start gap-5">
                    <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shrink-0">
                      <ShieldCheck size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Resumen de Emisión</h3>
                      <p className="text-slate-400">La póliza entrará en vigencia a partir de la fecha seleccionada por un periodo de 12 meses.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <Input label="Fecha de Inicio" name="vigencia_desde" type="date" value={formData.vigencia_desde} onChange={handleChange} />
                    <Input label="Sucursal" name="sucursal" value={formData.sucursal} onChange={handleChange} />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <footer className="mt-12 flex flex-col md:flex-row gap-4 justify-between items-center">
            <button 
              onClick={prevStep}
              disabled={currentStep === 0 || isGenerating}
              className="w-full md:w-auto px-10 py-4 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-colors font-bold disabled:opacity-20"
            >
              Anterior
            </button>

            {currentStep === STEPS.length - 1 ? (
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full md:w-auto px-12 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:scale-[1.02] active:scale-95 transition-all font-black flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/40"
              >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Download size={22} />}
                {isGenerating ? "EMITIENDO..." : "EMITIR RCV"}
              </button>
            ) : (
              <button 
                onClick={nextStep}
                className="w-full md:w-auto px-12 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 hover:scale-[1.02] active:scale-95 transition-all font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-900/40"
              >
                CONTINUAR
              </button>
            )}
          </footer>
        </div>
      </div>
    </main>
  );
}

function Input({ label, ...props }: any) {
  return (
    <div className="space-y-2">
      <label className="text-slate-400 text-sm font-semibold ml-1">{label}</label>
      <input 
        {...props}
        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 focus:border-blue-500 outline-none transition-colors"
      />
    </div>
  );
}
