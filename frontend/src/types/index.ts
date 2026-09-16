export interface ProveedorResumen {
  id: number;
  nombre: string;
  contacto?: string;
  notas?: string;
  activo: boolean;
  cantidadDeudas: number;
  totalDeudas: number;
  totalPagado: number;
  saldoPendiente: number;
  pagadoEsteMes: number;
  porcentajeSaldado: number;
  colorEstado: 'verde' | 'amarillo' | 'rojo' | 'gris';
  estadoTexto: 'Saldado' | 'Parcial' | 'Pendiente' | 'Sin deuda';
  tieneDeudasVencidas?: boolean;
  tieneDeudasPorVencer?: boolean;
}

export interface DeudaResumen {
  id: number;
  proveedorId: number;
  monto: number;
  concepto: string;
  tipoComprobante: 'Remito' | 'Factura';
  numeroComprobante?: string;
  fechaDeuda: string;
  fechaVencimiento?: string;
  estadoVencimiento?: 'Vencido' | 'PorVencer' | 'EnFecha' | 'Saldado' | 'SinVencimiento';
  diasParaVencer?: number;
  activo: boolean;
  totalPagado: number;
  saldoPendiente: number;
  pagadoEsteMes: number;
  porcentajeSaldado: number;
  colorEstado: 'verde' | 'amarillo' | 'rojo' | 'gris';
}

export interface PagoItemResumen {
  id: number;
  proveedorId: number;
  proveedorNombre: string;
  monto: number;
  fechaPago: string;
  medioPago: string;
  referencia?: string;
  comentario?: string;
  deudaConcepto?: string;
  tipoComprobante?: 'Remito' | 'Factura';
  numeroComprobante?: string;
}

export interface ResumenMensual {
  anio: number;
  mes: number;
  totalPagado: number;
  cantidadPagos: number;
  porMedioPago: Record<string, number>;
  pagos?: PagoItemResumen[];
}

export interface MovimientoHistorial {
  tipoMovimiento: 'Deuda' | 'Pago';
  id: number;
  monto: number;
  concepto: string;
  tipoComprobante?: 'Remito' | 'Factura';
  numeroComprobante?: string;
  medioPago?: 'Efectivo' | 'Transferencia' | 'Debito' | 'Cheque' | 'Otro';
  referencia?: string;
  fecha: string;
  activo: boolean;
  deudaId?: number;
  deudaConcepto?: string;
  deudaTipoComprobante?: 'Remito' | 'Factura';
  deudaNumeroComprobante?: string;
}

export interface DiaCalendario {
  dia: number;
  cantidadDeudas: number;
  cantidadPagos: number;
  montoDeudas: number;
  montoPagado: number;
  cantidadVencimientos?: number;
  montoVencimientos?: number;
}

export interface CalendarioMensualResponse {
  anio: number;
  mes: number;
  dias: DiaCalendario[];
}

export interface DetalleDiaMovimiento {
  tipoMovimiento: 'Deuda' | 'Pago';
  id: number;
  proveedorId: number;
  proveedorNombre: string;
  monto: number;
  concepto: string;
  tipoComprobante?: 'Remito' | 'Factura';
  numeroComprobante?: string;
  medioPago?: string;
  referencia?: string;
  fecha: string;
  activo: boolean;
  esVencimiento?: boolean;
  fechaVencimiento?: string;
}

export interface DetalleDiaResponse {
  anio: number;
  mes: number;
  dia: number;
  totalDeudas: number;
  totalPagos: number;
  cantidadVencimientos?: number;
  movimientos: DetalleDiaMovimiento[];
}

export interface BackupInfo {
  databasePath: string;
  tamanoBytes: number;
  tamanoFormateado: string;
  ultimaModificacion: string;
  totalProveedores: number;
  totalDeudas: number;
  totalPagos: number;
}

export interface RestoreResponse {
  message: string;
  totalProveedores: number;
  totalDeudas: number;
  totalPagos: number;
}
