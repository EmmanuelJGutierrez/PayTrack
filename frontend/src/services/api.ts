import type {
  ProveedorResumen,
  DeudaResumen,
  ResumenMensual,
  MovimientoHistorial,
  CalendarioMensualResponse,
  DetalleDiaResponse,
  BackupInfo,
  RestoreResponse
} from '../types';

// Usar proxy relativo /api (enrutado a http://localhost:5177 por Vite o Tauri)
const API_BASE = 'http://localhost:5177/api';

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

export async function updateProveedor(id: number, data: { nombre: string; contacto?: string; notas?: string }): Promise<ProveedorResumen> {
  const res = await fetch(`${API_BASE}/proveedores/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Error al actualizar proveedor');
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
  fechaVencimiento?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/proveedores/${proveedorId}/deudas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Error al registrar deuda');
}

export async function eliminarDeuda(proveedorId: number, deudaId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/proveedores/${proveedorId}/deudas/${deudaId}`, {
    method: 'DELETE'
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Error al eliminar deuda');
}

export async function restaurarDeuda(proveedorId: number, deudaId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/proveedores/${proveedorId}/deudas/${deudaId}/restaurar`, {
    method: 'PATCH'
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Error al restaurar deuda');
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

export async function anularPago(pagoId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/pagos/${pagoId}`, {
    method: 'DELETE'
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Error al anular pago');
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

export async function fetchDetalleDia(anio: number, mes: number, dia: number, tzOffset?: number): Promise<DetalleDiaResponse> {
  const offset = tzOffset !== undefined ? tzOffset : -new Date().getTimezoneOffset();
  const res = await fetch(`${API_BASE}/calendario/${anio}/${mes}/${dia}?tzOffset=${offset}`);
  if (!res.ok) throw new Error(`Error al cargar detalle del día ${dia}`);
  return res.json();
}

// Servicios de Copia de Seguridad y Restauración (HU-20)
export async function fetchBackupInfo(): Promise<BackupInfo> {
  const res = await fetch(`${API_BASE}/backup/info`);
  if (!res.ok) throw new Error('Error al obtener información de la base de datos');
  return res.json();
}

export function getBackupDownloadUrl(): string {
  return `${API_BASE}/backup/descargar`;
}

export async function restoreBackup(file: File): Promise<RestoreResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/backup/restaurar`, {
    method: 'POST',
    body: formData
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Error al restaurar la copia de seguridad');
  return body;
}
