import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { LOGO_MAIN, LOGO_CIRCLE } from "../assets/logos";

export async function generateRCVPDF(data: any): Promise<Blob> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://joqpapropcfajdgqwodw.supabase.co";
  // --- LÓGICA DE VERIFICACIÓN OFFLINE ULTRA-COMPRIMIDA ---
  // Usamos un array en orden fijo para ahorrar muchísimo espacio en el QR
  const compactData = [
    data.nombres_tomador,    // 0
    data.cedula_tomador,     // 1
    data.placa,              // 2
    data.marca,              // 3
    data.modelo,             // 4
    data.ano,                // 5
    data.color,              // 6
    data.vigencia_desde,     // 7
    data.poliza_no,          // 8
    data.recibo_no,          // 9
    data.fecha_emision,      // 10
    data.sucursal,           // 11
    data.uso,                // 12
    data.tipo,               // 13
    data.pasajeros,          // 14
    data.serie_motor,        // 15
    data.serie_carroceria,   // 16
    data.clase,              // 17
    data.cilindros,          // 18
    data.tipo_carga,         // 19
    data.toneladas,          // 20
    data.domicilio_tomador,  // 21
    data.telefono_tomador,   // 22
    data.email               // 23
  ];

  // Convertimos a JSON -> Base64 (UTF-8 Safe) compatible con Browser y Node
  const jsonStr = JSON.stringify(compactData);
  let encodedData = "";
  if (typeof btoa !== 'undefined') {
    encodedData = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => 
      String.fromCharCode(parseInt(p1, 16))
    ));
  } else {
    encodedData = Buffer.from(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => 
      String.fromCharCode(parseInt(p1, 16))
    ), 'binary').toString('base64');
  }
  encodedData = encodedData.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const origin = typeof window !== "undefined" ? window.location.origin : "https://rcv-premium.vercel.app";
  const verifyUrl = `${origin}/v?d=${encodedData}`;
  
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 300, errorCorrectionLevel: 'L' });

  // Compute vigencia hasta (1 year after vigencia_desde)
  const desde = new Date(data.vigencia_desde);
  const hasta = new Date(desde);
  hasta.setFullYear(hasta.getFullYear() + 1);
  const fmtDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  const vigDesde = fmtDate(desde);
  const vigHasta = fmtDate(hasta);

  drawPage1(doc, data, qrDataUrl, vigDesde, vigHasta);
  doc.addPage();
  drawPage2(doc, data, qrDataUrl, vigDesde, vigHasta);

  return doc.output("blob");
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1  –  CUADRO POLIZA RECIBO
// ─────────────────────────────────────────────────────────────────────────────
function drawPage1(doc: jsPDF, data: any, qrDataUrl: string, vigDesde: string, vigHasta: string) {
  const L = 10;   // left margin
  const T = 8;    // top margin
  const W = 190;  // usable width
  const d = doc as any;

  // ── HEADER ──────────────────────────────────────────────────────────────────
  // Outer border of the header band
  d.setDrawColor(0); d.setLineWidth(0.3);
  d.rect(L, T, W, 26);

  // Logo area on the left
  d.addImage(LOGO_MAIN, "PNG", L + 2, T + 2, 50, 22);

  // Center title block
  d.setFont("helvetica", "bold"); d.setFontSize(11);
  const title1 = clipText(d, "CUADRO POLIZA RECIBO", 65, 11);
  d.text(title1, L + 86, T + 8, { align: "center" });
  d.setFontSize(10);
  const title2 = clipText(d, "POLIZA DE RESPONSABILIDAD", 65, 10);
  const title3 = clipText(d, "CIVIL DE VEHICULOS", 65, 10);
  d.text(title2, L + 86, T + 14, { align: "center" });
  d.text(title3, L + 86, T + 19, { align: "center" });

  // Circle logo (center-right area)
  d.addImage(LOGO_CIRCLE, "PNG", L + 105, T + 3, 18, 18);

  // Right info box
  const rX = L + 126; const rW = W - 126;
  d.rect(rX, T, rW, 26);
  d.line(rX + rW / 2, T, rX + rW / 2, T + 26);
  d.line(rX, T + 6.5, L + W, T + 6.5);
  d.line(rX, T + 13, L + W, T + 13);
  d.line(rX, T + 19.5, L + W, T + 19.5);

  d.setFont("helvetica", "normal"); d.setFontSize(6.5);
  const rx2 = rX + rW / 2 + 1;
  row6(d, rX + 1, rX + rW / 2 + 1, T + 5,   "Poliza No.",      data.poliza_no);
  row6(d, rX + 1, rX + rW / 2 + 1, T + 11.5, "Recibo No.",      data.recibo_no);
  row6(d, rX + 1, rX + rW / 2 + 1, T + 18,   "Certificado No.", data.recibo_no);
  row6(d, rX + 1, rX + rW / 2 + 1, T + 24.5, "Asociado No.",    "N/A");

  // ── SECTION: DATOS DEL TOMADOR / ASEGURADO ──────────────────────────────────
  let y = T + 26;
  y = sectionBar(d, L, y, W, "DATOS DEL TOMADOR / ASEGURADO");

  // Row 1: Nombres tomador | Cedula | Telefono
  const cW1 = 95, cW2 = 55, cW3 = W - cW1 - cW2;
  y = dataRow(d, L, y, [
    { label: "NOMBRES Y APELLIDOS DEL TOMADOR:", value: (data.nombres_tomador || "").toUpperCase(), w: cW1 },
    { label: "CEDULA DE IDENTIDAD O RIF:", value: data.cedula_tomador, w: cW2 },
    { label: "TELEFONO:", value: data.telefono_tomador, w: cW3 },
  ]);
  // Row 2: Nombres asegurado | Cedula
  y = dataRow(d, L, y, [
    { label: "NOMBRES Y APELLIDOS DEL ASEGURADO:", value: (data.nombres_tomador || "").toUpperCase(), w: cW1 },
    { label: "CEDULA DE IDENTIDAD O RIF:", value: data.cedula_tomador, w: cW2 + cW3 },
  ]);
  // Row 3: Domicilio tomador
  y = dataRow(d, L, y, [
    { label: "DOMICILIO DEL TOMADOR:", value: (data.domicilio_tomador || "").toUpperCase(), w: W },
  ]);
  const cWD = W / 2;
  y = dataRow(d, L, y, [
    { label: "DOMICILIO DEL ASEGURADO:", value: (data.domicilio_tomador || "").toUpperCase(), w: cWD },
    { label: "DIRECCION DE COBRO:", value: (data.domicilio_tomador || "").toUpperCase(), w: cWD },
  ]);
  y = dataRow(d, L, y, [
    { label: "EMAIL:", value: data.email, w: 48 },
    { label: "ZONA POSTAL:", value: "1061", w: 28 },
    { label: "OTROS NUMEROS TELEFONICOS DE TOMADOR Y ASEGURADO:", value: "", w: 74 },
    { label: "ENTIDAD:", value: data.entidad || "AMAZONAS", w: W - 48 - 28 - 74 },
  ]);

  // ── SECTION: INFORMACIÓN GENERAL ─────────────────────────────────────────────
  y = sectionBar(d, L, y, W, "INFORMACION GENERAL");

  // Row: Vigencia (taller because it contains 2 sub-date lines)
  const infoH = 14;
  d.setDrawColor(0); d.setLineWidth(0.2);
  // Draw the 4 cells manually with extra height
  d.rect(L,      y, 50, infoH); // Vigencia Seguro
  d.rect(L+50,   y, 50, infoH); // Vigencia Recibo
  d.rect(L+100,  y, 45, infoH); // Fecha Emisión
  d.rect(L+145,  y, 45, infoH); // Sucursal
  // Labels
  d.setFont("helvetica", "bold"); d.setFontSize(5.8);
  d.text("VIGENCIA DEL SEGURO:",  L + 1, y + 3);
  d.text("VIGENCIA DEL RECIBO:",  L + 51, y + 3);
  d.text("FECHA DE EMISION:",     L + 101, y + 3);
  d.text("SUCURSAL DE EMISION:",  L + 146, y + 3);
  // Date sub-lines
  d.setFont("helvetica", "normal"); d.setFontSize(6);
  d.text(`DESDE (A LAS 12:00 M)  ${vigDesde}`, L + 1, y + 7.5);
  d.text(`HASTA (A LAS 12:00 M)  ${vigHasta}`, L + 1, y + 11.5);
  d.text(`DESDE (A LAS 12:00 M)  ${vigDesde}`, L + 51, y + 7.5);
  d.text(`HASTA (A LAS 12:00 M)  ${vigHasta}`, L + 51, y + 11.5);
  // Emisión & Sucursal values
  d.text(clipText(d, data.fecha_emision.split(",")[0], 43, 6), L + 101, y + 7.5);
  d.text(clipText(d, data.sucursal, 43, 6), L + 146, y + 7.5);
  y += infoH;

  // ── SECTION: BIEN ASEGURADO ──────────────────────────────────────────────────
  y = sectionBar(d, L, y, W, "BIEN ASEGURADO");
  // Vehicle row 1: Placa | Serial Motor | Serial Carroceria | Marca | Modelo | Año
  y = dataRow(d, L, y, [
    { label: "PLACA:", value: data.placa, w: 25 },
    { label: "SERIAL DE MOTOR:", value: data.serie_motor, w: 30 },
    { label: "SERIAL DE CARROCERIA:", value: data.serie_carroceria, w: 45 },
    { label: "MARCA:", value: data.marca, w: 30 },
    { label: "MODELO:", value: data.modelo, w: 35 },
    { label: "AÑO:", value: data.ano, w: W - 25 - 30 - 45 - 30 - 35 },
  ]);
  // Vehicle row 2: Color | Clase | Tipo | Uso
  y = dataRow(d, L, y, [
    { label: "COLOR:", value: data.color, w: 25 },
    { label: "CLASE:", value: data.clase || "OTROS VEHICULOS", w: 40 },
    { label: "TIPO:", value: data.tipo || "MOTOCICLETA", w: 40 },
    { label: "USO:", value: data.uso, w: W - 25 - 40 - 40 },
  ]);
  // Vehicle row 3: Cilindros | Unidad | Cant Pasajeros | Conductor | Ayudantes | Tipo Carga | Toneladas
  y = dataRow(d, L, y, [
    { label: "CILINDROS:", value: data.cilindros || "0", w: 22 },
    { label: "UNIDAD:", value: "N/A", w: 20 },
    { label: "CANT. PASAJEROS:", value: data.pasajeros || "2", w: 32 },
    { label: "CONDUCTOR:", value: "PROPIETARIO", w: 32 },
    { label: "AYUDANTES:", value: "0", w: 28 },
    { label: "TIPO DE CARGA:", value: data.tipo_carga || "150", w: 28 },
    { label: "TONELADAS:", value: data.toneladas || "N/A", w: W - 22 - 20 - 32 - 32 - 28 - 28 },
  ]);

  // ── SECTION: SUB-RAMO / COBERTURAS ───────────────────────────────────────────
  const tblY = y;
  // Table header
  d.setFillColor(200, 200, 200); d.rect(L, tblY, W, 6, "F");
  d.rect(L, tblY, W, 6);
  d.setFont("helvetica", "bold"); d.setFontSize(7);
  const cols = [10, 70, 35, 30, 25, 20];
  const colX = [L, L+10, L+80, L+115, L+145, L+170];
  d.text("SUB-RAMO", colX[0]+1, tblY+4);
  d.text("COBERTURAS", colX[1]+1, tblY+4);
  d.text("SUMA ASEGURADA", colX[2]+1, tblY+4);
  d.text("PRIMA", colX[3]+1, tblY+4);
  d.text("RECARGO", colX[4]+1, tblY+4);
  d.text("PRIMA NETA", colX[5]+1, tblY+4);

  // Table body
  const coverages = [
    { sub: "01", name: "RESPONSABILIDAD CIVIL DE VEHICULO", suma: "", prima: "", recargo: "", neta: "" },
    { sub: "", name: "DAÑOS A COSAS", suma: "750.600,00", prima: "2.533,28", recargo: "0,00", neta: "2.533,28" },
    { sub: "", name: "DAÑOS A PERSONAS", suma: "940.128,50", prima: "3.096,23", recargo: "0,00", neta: "3.096,23" },
    { sub: "", name: "EXCESO DE RESPONSABILIDAD CIVIL", suma: "", prima: "", recargo: "", neta: "" },
    { sub: "", name: "DEFENSA PENAL Y ASISTENCIA LEGAL", suma: "", prima: "", recargo: "", neta: "" },
    { sub: "", name: "ACCID. PERSO. PARA OCUP. DEL VEH.", suma: "", prima: "", recargo: "", neta: "" },
    { sub: "", name: "  MUERTE", suma: "", prima: "", recargo: "", neta: "" },
    { sub: "", name: "  INVALIDEZ PERMANENTE", suma: "", prima: "", recargo: "", neta: "" },
    { sub: "", name: "  GASTOS MEDICOS", suma: "", prima: "", recargo: "", neta: "" },
    { sub: "", name: "  GASTOS FUNERARIOS", suma: "", prima: "", recargo: "", neta: "" },
  ];

  let cy = tblY + 6;
  const rH = 6;
  coverages.forEach((cov) => {
    d.setFillColor(255, 255, 255); d.rect(L, cy, W, rH);
    d.line(colX[1], cy, colX[1], cy + rH);
    d.line(colX[2], cy, colX[2], cy + rH);
    d.line(colX[3], cy, colX[3], cy + rH);
    d.line(colX[4], cy, colX[4], cy + rH);
    d.line(colX[5], cy, colX[5], cy + rH);
    d.setFont("helvetica", cov.sub ? "bold" : "normal"); d.setFontSize(7);
    d.text(cov.sub, colX[0]+2, cy+4);
    d.setFont("helvetica", cov.sub ? "bold" : "normal"); d.setFontSize(6.5);
    d.text(cov.name, colX[1]+2, cy+4);
    d.setFont("helvetica", "normal");
    d.text(cov.suma, colX[2]+2, cy+4);
    d.text(cov.prima, colX[3]+2, cy+4);
    d.text(cov.recargo, colX[4]+2, cy+4);
    d.text(cov.neta, colX[5]+2, cy+4);
    cy += rH;
  });

  // ── PAGADO WATERMARK ──────────────────────────────────────────────────────────
  d.saveGraphicsState();
  d.setGState(new (d as any).GState({ opacity: 0.12 }));
  d.setFontSize(58); d.setTextColor(180, 30, 30);
  d.setFont("helvetica", "bold");
  d.text("PAGADO", L + W / 2 + 10, cy - 20, { align: "center", angle: 20 });
  d.restoreGraphicsState(); d.setTextColor(0);

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  const footY = cy;
  // Total box bottom-right
  d.rect(L, footY, W, 14);
  d.line(L, footY + 7, L + W, footY + 7);
  // Logos in footer center
  d.addImage(LOGO_MAIN, "PNG", L + 55, footY + 2, 40, 10);
  // Totals right
  const tW = 60;
  d.setFont("helvetica", "bold"); d.setFontSize(7);
  d.text("TOTAL PRIMA NETA ANUAL:", L + W - tW, footY + 4); d.text("5.629,50", L + W - 2, footY + 4, { align: "right" });
  d.text("PRIMA A COBRAR:", L + W - tW, footY + 9); d.text("5.629,50", L + W - 2, footY + 9, { align: "right" });
  d.text("CODIGO:03-OF-07", L + W - tW, footY + 13); d.text("CONTROL: 562,95", L + W - 2, footY + 13, { align: "right" });

  // Signature row
  const sigY = footY + 14;
  d.rect(L, sigY, W, 10);
  d.line(L + 30, sigY, L + 30, sigY + 10);
  d.line(L + W / 2, sigY, L + W / 2, sigY + 10);
  d.setFont("helvetica", "normal"); d.setFontSize(6.5);
  d.text("ASOCIADO-CONDUCTO:", L + 1, sigY + 4);
  d.text("03-ADRIAN AULAR", L + 1, sigY + 8);
  d.text("FIRMA TOMADOR:", L + 32, sigY + 4);
  d.text("FIRMA DEL REPRESENTANTE LEGAL DEL ASEGURADO:", L + W / 2 + 2, sigY + 4);

  // Payment info row
  const payY = sigY + 10;
  d.rect(L, payY, W / 2, 6);
  d.rect(L + W / 2, payY, W / 2, 6);
  d.setFont("helvetica", "bold"); d.setFontSize(6.5);
  d.text("ESTE CUADRO ANULA Y SUSTITUYE AL EMITIDO EN FECHA:", L + 1, payY + 4);
  d.text("FORMA DE PAGO: PAGO UNICO", L + 1, payY + 8 > payY + 6 ? payY + 5 : payY + 8);
  d.text("CANCELADO EN:", L + W / 2 + 2, payY + 4);
  d.text("LUGAR DE PAGO:", L + W * 0.75 + 2, payY + 4);

  // Legal text
  const legalY = payY + 8;
  d.setFont("helvetica", "normal"); d.setFontSize(5.5);
  const legal1 = "El Cuadro-Póliza será entregado al Tomador conjuntamente con las Condiciones Generales, las Condiciones Particulares, los anexos así como los recibos que forman parte integrante del Contrato. En las renovaciones la obligación procederá para los nuevos documentos o para aquellas que hayan sido modificados.";
  const legal2 = "El Tomador, Asegurado o Beneficiario de la Póliza, que considere vulnerados sus derechos o requiera presentar cualquier denuncia, reclamo, queja o solicitud de asesoría, surgida con ocasión de este contrato de seguros podrá acudir a la Unidad de Defensa del Asegurado, o comunicarse a través de los mecanismos dispuestos para ello.";
  d.text(legal1, L, legalY, { maxWidth: W - 38 });
  d.text(legal2, L, legalY + 8, { maxWidth: W - 38 });

  // Fiscal address
  const addrY = legalY + 16;
  d.setFont("helvetica", "bold"); d.setFontSize(5.5);
  d.text("DIRECCION FISCAL: CALLE 2DA TRANSVERSAL CC CENTRO PROFESIONAL LUCCIOLA NIVEL 1 OF R-1-1 URB MIRAMAR.  Telf: (0212) 354.39.70 (0212) 354.24.10 (0412) 114.54.96. Parroquia: Maiquetia, Estado La Guaira. RIF No. J-31159778-6", L, addrY, { maxWidth: W - 38 });
  d.text("INSCRITA EN LA SUPERINTENDENCIA NACIONAL DE COOPERATIVAS BAJO EL No. 23262", L, addrY + 6, { maxWidth: W });
  d.text("INSCRITA EN LA SUPERINTENDENCIA DE LA ACTIVIDAD ASEGURADORA BAJO ACS - 000009", L, addrY + 10, { maxWidth: W });
  d.text("APROBADO POR LA SUPERINTENDENCIA DE LA ACTIVIDAD ASEGURADORA MEDIANTE PROV. SAA-SUT -38929 DE FECHA 12 DE SEPTIEMBRE DE 2024", L, addrY + 14, { maxWidth: W });

  // QR Code (bottom right)
  const qrSize = 30;
  d.addImage(qrDataUrl, "PNG", L + W - qrSize, addrY - 2, qrSize, qrSize);
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2  –  CUADRO DE RECIBO + 2 CARDS
// ─────────────────────────────────────────────────────────────────────────────
function drawPage2(doc: jsPDF, data: any, qrDataUrl: string, vigDesde: string, vigHasta: string) {
  const d = doc as any;
  const L = 10; const T = 10; const W = 190;

  // ── HEADER ───────────────────────────────────────────────────────────────────
  d.addImage(LOGO_MAIN, "PNG", L, T, 50, 20);
  d.setFont("helvetica", "bold"); d.setFontSize(20);
  d.text("CUADRO DE RECIBO", L + 65, T + 15);

  // ── INFO TABLE ────────────────────────────────────────────────────────────────
  const tableY = T + 28;
  const tH = 8.5; // Slightly more height for padding
  d.setDrawColor(0); d.setLineWidth(0.3);
  d.rect(L, tableY, W, tH * 4);
  d.line(L + 65, tableY, L + 65, tableY + tH * 4);

  d.setFont("helvetica", "bold"); d.setFontSize(7);
  const col1X = L + 2; const col2X = L + 67;

  const lbSz = 6.5; // label size
  const vlSz = 7.5; // value size

  // Left column
  d.setFont("helvetica", "bold"); d.setFontSize(lbSz);
  d.text(clipText(d, "NUMERO DE FACTURA / RECIBO:", 40, lbSz), col1X, tableY + 5.5);
  d.setFont("helvetica", "normal"); d.setFontSize(vlSz);
  d.text(`${data.recibo_no} / ${data.recibo_no}`, col1X + 42, tableY + 5.5);

  d.setFont("helvetica", "bold"); d.setFontSize(lbSz);
  d.text(clipText(d, "TIPO DE MOVIMIENTO:", 40, lbSz), col1X, tableY + 5.5 + tH);
  d.setFont("helvetica", "normal"); d.setFontSize(vlSz);
  d.text("", col1X + 42, tableY + 5.5 + tH);

  d.setFont("helvetica", "bold"); d.setFontSize(lbSz);
  d.text(clipText(d, "DIRECCION DE COBRO:", 40, lbSz), col1X, tableY + 5.5 + tH * 2);
  d.setFont("helvetica", "normal"); d.setFontSize(vlSz);
  d.text("", col1X + 42, tableY + 5.5 + tH * 2);

  d.setFont("helvetica", "bold"); d.setFontSize(lbSz);
  d.text(clipText(d, "FECHA DE COBRO:", 40, lbSz), col1X, tableY + 5.5 + tH * 3);
  d.setFont("helvetica", "normal"); d.setFontSize(vlSz);
  d.text(vigDesde, col1X + 42, tableY + 5.5 + tH * 3);

  // Right column
  d.setFont("helvetica", "bold"); d.setFontSize(lbSz);
  d.text(clipText(d, "VIGENCIA RECIBO DESDE:", 45, lbSz), col2X, tableY + 5.5);
  d.setFont("helvetica", "normal"); d.setFontSize(vlSz);
  d.text(vigDesde, col2X + 47, tableY + 5.5);

  d.setFont("helvetica", "bold"); d.setFontSize(lbSz);
  d.text("HASTA:", col2X + 85, tableY + 5.5);
  d.setFont("helvetica", "normal"); d.setFontSize(vlSz);
  d.text(vigHasta, col2X + 100, tableY + 5.5);

  d.setFont("helvetica", "bold"); d.setFontSize(lbSz);
  d.text(clipText(d, "TIPO DE PAGO:", 35, lbSz), col2X, tableY + 5.5 + tH);
  d.setFont("helvetica", "normal"); d.setFontSize(vlSz);
  d.text("CONTADO", col2X + 37, tableY + 5.5 + tH);

  d.setFont("helvetica", "bold"); d.setFontSize(lbSz);
  d.text(clipText(d, "FECHA Y HORA DE EMISION:", 48, lbSz), col2X, tableY + 5.5 + tH * 2);
  d.setFont("helvetica", "normal"); d.setFontSize(vlSz);
  d.text(data.fecha_emision, col2X + 50, tableY + 5.5 + tH * 2);

  d.setFont("helvetica", "bold"); d.setFontSize(lbSz);
  d.text(clipText(d, "BANCO:", 20, lbSz), col2X, tableY + 5.5 + tH * 3);
  d.text(clipText(d, "NRO. CHEQUE:", 30, lbSz), col2X + 22, tableY + 5.5 + tH * 3);
  d.text(clipText(d, "FIRMA DEL COBRADOR:", 40, lbSz), col2X + 54, tableY + 5.5 + tH * 3);
  d.text(clipText(d, "MONTO BS.:", 25, lbSz), col2X + 96, tableY + 5.5 + tH * 3);
  d.setFont("helvetica", "normal"); d.setFontSize(vlSz);
  d.text("5.629,5", col2X + 115, tableY + 5.5 + tH * 3);

  // ── TWO CARDS ─────────────────────────────────────────────────────────────────
  // Cards start at ~y=115 based on the screenshots
  const cardY = 115;
  const cardH = 60;
  const cardW1 = 88; // Left card width
  const cardW2 = 100; // Right card width

  // ── LEFT CARD: Póliza de Responsabilidad Civil ────────────────────────────────
  const lX = L;
  // Blue header bar
  d.setFillColor(0, 56, 147); d.rect(lX, cardY, cardW1, 12, "F");
  d.setFont("helvetica", "bold"); d.setFontSize(9); d.setTextColor(255);
  d.text("PÓLIZA DE RESPONSABILIDAD", lX + 2, cardY + 5);
  d.text("CIVIL PARA VEHÍCULOS", lX + 2, cardY + 10);
  // RCV label
  d.setFontSize(18); d.setFont("helvetica", "black");
  d.text("RCV", lX + cardW1 - 18, cardY + 10);

  // Card body (light blue background)
  d.setFillColor(235, 242, 255);
  d.rect(lX, cardY + 12, cardW1, cardH - 12, "F");
  d.setDrawColor(0, 56, 147); d.setLineWidth(0.5);
  d.rect(lX, cardY, cardW1, cardH);

  // Left body: text info (white box area)
  d.setFillColor(255); d.rect(lX + 2, cardY + 14, 58, cardH - 17, "F");
  d.setDrawColor(180); d.setLineWidth(0.2); d.rect(lX + 2, cardY + 14, 58, cardH - 17);

    d.setTextColor(0); d.setFont("helvetica", "bold"); d.setFontSize(7);
    d.text("NOMBRES Y APELLIDOS DEL TOMADOR:", lX + 3, cardY + 19);
    d.setFont("helvetica", "normal"); d.setFontSize(7.5);
    d.text((data.nombres_tomador || "").toUpperCase(), lX + 3, cardY + 24);
    d.setFont("helvetica", "normal"); d.setFontSize(6.5);
    d.text(`C.I: ${data.cedula_tomador}`, lX + 3, cardY + 28);
  
    d.setFont("helvetica", "bold"); d.setFontSize(7);
    d.text("NOMBRES Y APELLIDOS DEL ASEGURADO", lX + 3, cardY + 33);
    d.text("PROPUESTO:", lX + 3, cardY + 37);
    d.setFont("helvetica", "normal"); d.setFontSize(7.5);
    d.text((data.nombres_tomador || "").toUpperCase(), lX + 3, cardY + 42);
    d.setFont("helvetica", "normal"); d.setFontSize(6.5);
    d.text(`C.I: ${data.cedula_tomador}`, lX + 3, cardY + 46);
  
    d.setFont("helvetica", "bold"); d.setFontSize(7); d.text("DIRECCIÓN:", lX + 3, cardY + 50);
    d.setFont("helvetica", "normal"); d.setFontSize(6);
    d.text((data.domicilio_tomador || "").toUpperCase(), lX + 3, cardY + 54, { maxWidth: 56 });

  // Right section of card 1: QR + legal text
  d.addImage(qrDataUrl, "PNG", lX + 63, cardY + 14, 22, 22);
  d.setFont("helvetica", "normal"); d.setFontSize(5);
  d.setTextColor(0);
  d.text("ESCANEA PARA VALIDAR LA\nPÓLIZA EN LÍNEA", lX + 63, cardY + 37, { maxWidth: 24 });

  // ── RIGHT CARD: Garantías 456 info card ─────────────────────────────────────
  const rCardX = lX + cardW1 + 5;
  d.setDrawColor(0, 56, 147); d.setLineWidth(0.5);
  d.rect(rCardX, cardY, cardW2, cardH);

  // Blue header
  d.setFillColor(0, 56, 147); d.rect(rCardX, cardY, cardW2, 12, "F");
  d.addImage(LOGO_MAIN, "PNG", rCardX + 2, cardY + 2, 40, 8);
  d.setFont("helvetica", "bold"); d.setFontSize(7); d.setTextColor(255);
  d.text(`RIF: J-31159778-6`, rCardX + cardW2 - 2, cardY + 9, { align: "right" });

  // Card body (light background)
  d.setFillColor(245, 248, 255); d.rect(rCardX, cardY + 12, cardW2, cardH - 12, "F");

    // Vehicle detail grid
    const vInfoX = rCardX + 2; const vLabelX = rCardX + 45;
    d.setTextColor(0); d.setFont("helvetica", "bold"); d.setFontSize(7);
    d.text("MARCA:", vInfoX, cardY + 18); d.setFont("helvetica", "normal"); d.text((data.marca || "").toUpperCase(), vInfoX + 15, cardY + 18);
    d.setFont("helvetica", "bold"); d.text("COLOR:", vLabelX + 25, cardY + 18); d.setFont("helvetica", "normal"); d.text((data.color || "").toUpperCase(), vLabelX + 42, cardY + 18);
  
    d.setFont("helvetica", "bold"); d.text("MODELO:", vInfoX, cardY + 23); d.setFont("helvetica", "normal"); d.text((data.modelo || "").toUpperCase(), vInfoX + 18, cardY + 23);
    d.setFont("helvetica", "bold"); d.text("PLACA:", vLabelX + 25, cardY + 23); d.setFont("helvetica", "normal"); d.text((data.placa || "").toUpperCase(), vLabelX + 42, cardY + 23);
  
    d.setFont("helvetica", "bold"); d.text("SERIAL DE MOTOR:", vInfoX, cardY + 28); d.setFont("helvetica", "normal"); d.text(data.serie_motor || "", vInfoX + 32, cardY + 28);
    d.setFont("helvetica", "bold"); d.text("AÑO:", vLabelX + 25, cardY + 28); d.setFont("helvetica", "normal"); d.text(data.ano || "", vLabelX + 36, cardY + 28);
  
    d.setFont("helvetica", "bold"); d.text("SERIAL DE CARROCERIA:", vInfoX, cardY + 33); d.setFont("helvetica", "normal"); d.text(data.serie_carroceria || "", vInfoX + 42, cardY + 33);
    d.setFont("helvetica", "bold"); d.text("USO:", vLabelX + 25, cardY + 33); d.setFont("helvetica", "normal"); d.text((data.uso || "").toUpperCase(), vLabelX + 35, cardY + 33);

  // Green validation bar
  d.setFillColor(0, 100, 50); d.rect(rCardX, cardY + 38, cardW2, 10, "F");
  d.setFont("helvetica", "bold"); d.setFontSize(9); d.setTextColor(255);
  d.text(`${data.poliza_no}`, rCardX + 2, cardY + 44);
  d.setFontSize(7);
  d.text(`VIGENCIA DESDE: ${vigDesde}  HASTA: ${vigHasta}`, rCardX + 38, cardY + 44);

  // "Póliza cumple" bar
  d.setFillColor(0, 56, 147); d.rect(rCardX, cardY + 48, cardW2, 12, "F");
  d.setFont("helvetica", "bold"); d.setFontSize(7); d.setTextColor(255);
  d.text("LA SIGUIENTE PÓLIZA CUMPLE CON TODOS LOS REQUISITOS EXIGIDOS", rCardX + cardW2 / 2, cardY + 53, { align: "center" });
  d.text("POR LA LEY EN LA GORREV 6.835 DE FECHA 20/08/24", rCardX + cardW2 / 2, cardY + 58, { align: "center" });

  d.setTextColor(0);

  // ── LEGAL FOOTER (page 2) ─────────────────────────────────────────────────────
  const lfY = cardY + cardH + 12;
  d.setFont("helvetica", "bold"); d.setFontSize(7);
  d.text("UNIDAD DE ATENCIÓN AL ASEGURADO:", L, lfY);
  d.setFont("helvetica", "normal"); d.setFontSize(6.5);
  const uaa = "Conforme a la Providencia Administrativa N° SAA-01-0523-2024 y la Ley de la Actividad Aseguradora, disponemos de la figura del 'Defensor del Asegurado' y la Unidad de Defensa, con el objetivo de atender y gestionar los reclamos y quejas de tomadores, asegurados, beneficiarios, contratantes y usuarios.";
  d.text(uaa, L, lfY + 5, { maxWidth: W });

  d.setFont("helvetica", "bold"); d.setFontSize(7);
  d.text("SISTEMA INTEGRAL DE ADMINISTRACIÓN DE RIESGOS (SIAR):", L, lfY + 14);
  d.setFont("helvetica", "normal"); d.setFontSize(6.5);
  const siar = "Comprende el conjunto de políticas, procedimientos, controles y estructuras organizativas diseñadas para prevenir, detectar y reportar actividades relacionadas con la Legitimación de Capitales (LC), Financiamiento al Terrorismo (FT) y Financiamiento a la Proliferación de Armas de Destrucción Masiva (FPADM) y otros ilícitos. De conformidad a la providencia administrativa SAA-01-0536-2024.";
  d.text(siar, L, lfY + 19, { maxWidth: W });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function sectionBar(d: any, x: number, y: number, w: number, title: string): number {
  d.setFillColor(0, 56, 147); d.setDrawColor(0); d.setLineWidth(0.3);
  d.rect(x, y, w, 5, "F");
  d.rect(x, y, w, 5);
  d.setFont("helvetica", "bold"); d.setFontSize(7); d.setTextColor(255);
  d.text(title, x + w / 2, y + 3.8, { align: "center" });
  d.setTextColor(0);
  return y + 5;
}

/** Clips a string so it fits within maxWidthMm at the given fontSize */
function clipText(d: any, text: string, maxWidthMm: number, fontSize: number): string {
  if (!text) return "";
  d.setFontSize(fontSize);
  // jsPDF internal scale factor for mm is 2.8346... (points per mm)
  const scaleFactor = 2.834645669291339;
  let str = String(text);
  while (str.length > 0) {
    const widthInMm = (d.getStringUnitWidth(str) * fontSize) / scaleFactor;
    if (widthInMm <= maxWidthMm - 0.5) break; // 0.5mm safety margin
    str = str.slice(0, -1);
  }
  return str;
}

interface CellDef { label: string; value: string; w: number; }
function dataRow(d: any, startX: number, startY: number, cells: CellDef[]): number {
  const h = 8.5;        // row height in mm
  const pad = 1;        // left padding in mm
  const labelSz = 5.8;  // font size for label
  const valueSz = 6.8;  // font size for value (slightly smaller to aid fitting)
  let cx = startX;
  d.setDrawColor(0); d.setLineWidth(0.2);
  cells.forEach((cell) => {
    d.rect(cx, startY, cell.w, h);
    // Label (bold, small)
    d.setFont("helvetica", "bold"); d.setFontSize(labelSz);
    const labelClipped = clipText(d, cell.label, cell.w - pad, labelSz);
    d.text(labelClipped, cx + pad, startY + 3.2);
    // Value (normal, clipped to cell width)
    d.setFont("helvetica", "normal"); d.setFontSize(valueSz);
    const valueClipped = clipText(d, String(cell.value || "").toUpperCase(), cell.w - pad * 2, valueSz);
    d.text(valueClipped, cx + pad, startY + 7.2);
    cx += cell.w;
  });
  return startY + h;
}

function row6(d: any, lx: number, vx: number, y: number, label: string, value: string) {
  d.setFont("helvetica", "bold"); d.setFontSize(6);
  d.text(label, lx, y);
  d.setFont("helvetica", "normal"); d.text(value, vx, y);
}
