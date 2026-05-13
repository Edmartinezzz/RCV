"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { generateRCVPDF } from '@/utils/pdfGenerator';

function MinimalDownload() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const dataEncoded = searchParams.get('d');
    if (!dataEncoded) return;

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

      const trigger = async () => {
        const pdfBlob = await generateRCVPDF(policy);
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `RCV_${policy.placa}_${policy.poliza_no}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Opcional: cerrar o avisar que terminó
        setTimeout(() => {
          document.title = "Descarga Completada";
        }, 1000);
      };

      trigger();
    } catch (e) {
      console.error("Error en descarga directa");
    }
  }, [searchParams]);

  return (
    <div style={{ 
      backgroundColor: '#000', 
      color: '#444', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '2px'
    }}>
      Iniciando Descarga...
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MinimalDownload />
    </Suspense>
  );
}
