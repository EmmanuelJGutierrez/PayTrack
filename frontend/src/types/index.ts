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
}

export interface DeudaResumen {
  id: number;
  proveedorId: number;
  monto: number;
  concepto: string;
  tipoComprobante: 'Remito' | 'Factura';
  numeroComprobante?: string;
  fechaDeuda: string;
  activo: boolean;
  totalPagado: number;
  saldoPendiente: number;
  pagadoEsteMes: number;
  porcentajeSaldado: number;
  colorEstado: 'verde' | 'amarillo' | 'rojo' | 'gris';
}

export interface ResumenMensual {
  anio: number;
  mes: number;
  totalPagado: number;
  cantidadPagos: number;
  porMedioPago: Record<string, number>;
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
}

export interface DiaCalendario {
  dia: number;
  cantidadDeudas: number;
  cantidadPagos: number;
  montoDeudas: number;
  montoPagado: number;
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
}

export interface DetalleDiaResponse {
  anio: number;
  mes: number;
  dia: number;
  totalDeudas: number;
  totalPagos: number;
  movimientos: DetalleDiaMovimiento[];
}
