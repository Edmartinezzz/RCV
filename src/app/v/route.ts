import { NextRequest, NextResponse } from 'next/server';
import { generateRCVPDF } from '@/utils/pdfGenerator';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dataEncoded = searchParams.get('d');

  if (!dataEncoded) {
    return new NextResponse("Faltan datos de la póliza", { status: 400 });
  }

  try {
    // Decodificar Base64 UTF-8 Safe (Server Side)
    const normalized = dataEncoded.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      Buffer.from(normalized, 'base64')
        .toString('binary')
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonStr);

    // Reconstruir objeto de datos
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

    // Generar el PDF en el servidor
    const pdfBlob = await generateRCVPDF(policy);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Responder con el archivo PDF directamente
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="RCV_${policy.placa}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF on server:", error);
    return new NextResponse("Error generando el certificado", { status: 500 });
  }
}
