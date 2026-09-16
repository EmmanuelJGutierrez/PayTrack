import type {
  ProveedorResumen,
  DeudaResumen,
  ResumenMensual,
  MovimientoHistorial,
  CalendarioMensualResponse,
  DetalleDiaResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5177/api';

export async function fetchHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchProveedores(anio: number, mes: number, buscar: string = ''): Promise<ProveedorResumen[]> {
  const params = new URLSearchParams({
    anio: anio.toString(),
    mes: mes.toString(),
    ...(buscar ? { buscar } : {})
  });
  const res = await fetch(`${API_BASE}/proveedores?${params}`);
  if (!res.ok) throw new Error('Error al cargar proveedores');
  return res.json();
}

export async function createProveedor(data: { nombre: string; contacto?: string; notas?: string }): Promise<ProveedorResumen> {
  const res = await fetch(`${API_BASE}/proveedores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Error al crear proveedor');
  return body;
}

export async function fetchDeudas(proveedorId: number, anio: number, mes: number): Promise<DeudaResumen[]> {
  const res = await fetch(`${API_BASE}/proveedores/${proveedorId}/deudas?anio=${anio}&mes=${mes}`);
  if (!res.ok) throw new Error('Error al cargar deudas');
  return res.json();
}

export async function createDeuda(proveedorId: number, data: {
  monto: number;
  concepto: string;
  tipoComprobante: 'Remito' | 'Factura';
  numeroComprobante?: string;
  fechaDeuda?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/proveedores/${proveedorId}/deudas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Error al registrar deuda');
}

export async function createPago(proveedorId: number, data: {
  monto: number;
  medioPago: 'Efectivo' | 'Transferencia' | 'Debito' | 'Cheque' | 'Otro';
  referencia?: string;
  comentario?: string;
  fechaPago?: string;
  deudaId?: number;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/proveedores/${proveedorId}/pagos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Error al registrar pago');
}

export async function fetchResumenMensual(anio: number, mes: number): Promise<ResumenMensual> {
  const res = await fetch(`${API_BASE}/pagos/resumen-mensual?anio=${anio}&mes=${mes}`);
  if (!res.ok) throw new Error('Error al cargar resumen');
  return res.json();
}

export async function fetchHistorial(proveedorId: number): Promise<MovimientoHistorial[]> {
  const res = await fetch(`${API_BASE}/proveedores/${proveedorId}/historial`);
  if (!res.ok) throw new Error('Error al cargar historial');
  return res.json();
}

export async function fetchCalendarioMensual(anio: number, mes: number, tzOffset?: number): Promise<CalendarioMensualResponse> {
  const offset = tzOffset !== undefined ? tzOffset : -new Date().getTimezoneOffset();
  const res = await fetch(`${API_BASE}/calendario?anio=${anio}&mes=${mes}&tzOffset=${offset}`);
  if (!res.ok) throw new Error('Error al cargar calendario mensual');
  return res.json();
}

export async function fetchDetalleDia(anio: number, mes: number, dia: number): Promise<DetalleDiaResponse> {
  const res = await fetch(`${API_BASE}/calendario/${anio}/${mes}/${dia}`);
  if (!res.ok) throw new Error(`Error al cargar detalle del día ${dia}`);
  return res.json();
}
