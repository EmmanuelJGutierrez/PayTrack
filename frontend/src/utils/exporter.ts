import type { ResumenMensual, MovimientoHistorial, ProveedorResumen } from '../types';

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatMonto(monto: number): string {
  return monto.toFixed(2).replace('.', ',');
}

export function downloadCsv(filename: string, rows: (string | number | undefined | null)[][]) {
  const csvContent = rows
    .map(row => row.map(cell => escapeCsv(cell)).join(';'))
    .join('\r\n');

  // \uFEFF es el BOM (Byte Order Mark) UTF-8 para que Microsoft Excel abra las tildes y caracteres correctamente
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta el Resumen Mensual de Pagos a formato Excel/CSV
 */
export function exportResumenMensualToCsv(resumen: ResumenMensual, nombreMes: string, anio: number) {
  const rows: (string | number | undefined | null)[][] = [
    ['PAYTRACK - RESUMEN MENSUAL DE PAGOS'],
    [`Período: ${nombreMes} ${anio}`, '', '', `Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
    [],
    ['TOTAL GENERAL PAGADO', `$ ${formatMonto(resumen.totalPagado)}`],
    ['CANTIDAD TOTAL DE PAGOS', resumen.cantidadPagos],
    [],
    ['DESGLOSE POR FORMA DE PAGO'],
    ['Forma de Pago', 'Total Pagado']
  ];

  for (const [medio, total] of Object.entries(resumen.porMedioPago)) {
    rows.push([medio, `$ ${formatMonto(total)}`]);
  }

  rows.push([]);
  rows.push(['DETALLE DE PAGOS REGISTRADOS EN EL MES']);
  rows.push([
    'Fecha',
    'Hora',
    'Proveedor',
    'Concepto / Deuda',
    'Tipo Comprobante',
    'N° Comprobante',
    'Medio de Pago',
    'Referencia',
    'Comentario',
    'Monto Pagado'
  ]);

  if (resumen.pagos && resumen.pagos.length > 0) {
    for (const p of resumen.pagos) {
      const d = new Date(p.fechaPago);
      rows.push([
        d.toLocaleDateString(),
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        p.proveedorNombre,
        p.deudaConcepto || 'Pago directo',
        p.tipoComprobante || '-',
        p.numeroComprobante || '-',
        p.medioPago,
        p.referencia || '-',
        p.comentario || '-',
        `$ ${formatMonto(p.monto)}`
      ]);
    }
  } else {
    rows.push(['No se registraron pagos individuales en este período.']);
  }

  const safeNombreMes = nombreMes.replace(/\s+/g, '_');
  downloadCsv(`PayTrack_Resumen_${safeNombreMes}_${anio}.csv`, rows);
}

/**
 * Exporta el Historial de Deudas y Pagos de un Proveedor
 */
export function exportHistorialProveedorToCsv(proveedorNombre: string, items: MovimientoHistorial[]) {
  const rows: (string | number | undefined | null)[][] = [
    ['PAYTRACK - HISTORIAL DE PROVEEDOR'],
    [`Proveedor: ${proveedorNombre}`, '', '', `Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
    [],
    [
      'Fecha',
      'Hora',
      'Tipo de Movimiento',
      'Concepto',
      'Tipo Comprobante',
      'N° Comprobante',
      'Medio de Pago',
      'Referencia',
      'Monto',
      'Estado'
    ]
  ];

  for (const mov of items) {
    const d = new Date(mov.fecha);
    const signo = mov.tipoMovimiento === 'Deuda' ? '+' : '-';
    rows.push([
      d.toLocaleDateString(),
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mov.tipoMovimiento,
      mov.concepto,
      mov.tipoComprobante || '-',
      mov.numeroComprobante || '-',
      mov.medioPago || '-',
      mov.referencia || '-',
      `${signo}$ ${formatMonto(mov.monto)}`,
      mov.activo ? 'Activo' : 'Anulado'
    ]);
  }

  const safeNombre = proveedorNombre.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fechaHoy = new Date().toISOString().split('T')[0];
  downloadCsv(`PayTrack_Historial_${safeNombre}_${fechaHoy}.csv`, rows);
}

/**
 * Exporta la Planilla General de Proveedores y Estados de Deuda
 */
export function exportPlanillaProveedoresToCsv(proveedores: ProveedorResumen[], nombreMes: string, anio: number) {
  const rows: (string | number | undefined | null)[][] = [
    ['PAYTRACK - ESTADO GENERAL DE PROVEEDORES Y DEUDAS'],
    [`Período de referencia: ${nombreMes} ${anio}`, '', '', `Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
    [],
    [
      'Proveedor',
      'Contacto',
      'Cant. Deudas',
      'Total Deudas',
      'Total Pagado Histórico',
      'Pagado en Mes Seleccionado',
      'Saldo Pendiente',
      '% Saldado',
      'Estado'
    ]
  ];

  for (const p of proveedores) {
    rows.push([
      p.nombre,
      p.contacto || '-',
      p.cantidadDeudas,
      `$ ${formatMonto(p.totalDeudas)}`,
      `$ ${formatMonto(p.totalPagado)}`,
      `$ ${formatMonto(p.pagadoEsteMes)}`,
      `$ ${formatMonto(p.saldoPendiente)}`,
      `${p.porcentajeSaldado}%`,
      p.estadoTexto
    ]);
  }

  const safeNombreMes = nombreMes.replace(/\s+/g, '_');
  downloadCsv(`PayTrack_Planilla_Proveedores_${safeNombreMes}_${anio}.csv`, rows);
}
