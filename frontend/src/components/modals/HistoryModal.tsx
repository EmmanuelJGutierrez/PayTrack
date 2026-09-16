import React, { useEffect, useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { fetchHistorial, anularPago, restaurarDeuda } from '../../services/api';
import type { MovimientoHistorial } from '../../types';
import { ComprobanteBadge } from '../badges/ComprobanteBadge';
import { exportHistorialProveedorToCsv } from '../../utils/exporter';
import { FileSpreadsheet, ArrowDownRight, ArrowUpRight, Trash2, RotateCcw, FileText } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  proveedorId: number;
  proveedorNombre: string;
  onSuccess?: () => void;
}

export const HistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  proveedorId,
  proveedorNombre,
  onSuccess
}) => {
  const [items, setItems] = useState<MovimientoHistorial[]>([]);
  const [filter, setFilter] = useState<'todos' | 'deudas' | 'pagos'>('todos');

  const deudasCount = items.filter(m => m.tipoMovimiento === 'Deuda').length;
  const pagosCount = items.filter(m => m.tipoMovimiento === 'Pago').length;

  const filteredItems = items.filter(m => {
    if (filter === 'deudas') return m.tipoMovimiento === 'Deuda';
    if (filter === 'pagos') return m.tipoMovimiento === 'Pago';
    return true;
  });
  const [loading, setLoading] = useState(false);

  // Estados para modales de confirmación en la interfaz (sin alerts de navegador)
  const [pagoToCancel, setPagoToCancel] = useState<MovimientoHistorial | null>(null);
  const [deudaToRestore, setDeudaToRestore] = useState<MovimientoHistorial | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = () => {
    if (!proveedorId) return;
    setLoading(true);
    fetchHistorial(proveedorId)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen && proveedorId) {
      loadData();
    }
  }, [isOpen, proveedorId]);

  const handleExport = () => {
    if (items.length === 0) return;
    exportHistorialProveedorToCsv(proveedorNombre, items);
  };

  const confirmAnularPago = async () => {
    if (!pagoToCancel) return;

    try {
      setActionLoading(true);
      await anularPago(pagoToCancel.id);
      setPagoToCancel(null);
      loadData();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message || 'Error al anular pago');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmRestaurarDeuda = async () => {
    if (!deudaToRestore) return;

    try {
      setActionLoading(true);
      await restaurarDeuda(proveedorId, deudaToRestore.id);
      setDeudaToRestore(null);
      loadData();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message || 'Error al restaurar deuda');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Historial de Movimientos — ${proveedorNombre}`} maxWidth="780px">
      {/* Barra de Acciones Superior */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid #e5e7eb',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          {items.length} movimiento{items.length === 1 ? '' : 's'} registrado{items.length === 1 ? '' : 's'}
        </span>

        <button
          onClick={handleExport}
          disabled={items.length === 0}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: items.length > 0 ? '#15803d' : '#9ca3af',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: items.length > 0 ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (items.length > 0) e.currentTarget.style.backgroundColor = '#166534';
          }}
          onMouseLeave={(e) => {
            if (items.length > 0) e.currentTarget.style.backgroundColor = '#15803d';
          }}
          title="Descargar este historial en formato Excel / CSV"
        >
          <FileSpreadsheet size={16} />
          Exportar a Excel (.csv)
        </button>
      </div>

            {/* Filtros de Navegación Rápida */}
      {!loading && items.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setFilter('todos')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              border: filter === 'todos' ? '1.5px solid #111827' : '1.5px solid #e5e7eb',
              backgroundColor: filter === 'todos' ? '#111827' : '#ffffff',
              color: filter === 'todos' ? '#ffffff' : '#4b5563',
              transition: 'all 0.15s ease'
            }}
          >
            Todos ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('deudas')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              border: filter === 'deudas' ? '1.5px solid #dc2626' : '1.5px solid #e5e7eb',
              backgroundColor: filter === 'deudas' ? '#fee2e2' : '#ffffff',
              color: filter === 'deudas' ? '#991b1b' : '#4b5563',
              transition: 'all 0.15s ease'
            }}
          >
            📦 Deudas ({deudasCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pagos')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              border: filter === 'pagos' ? '1.5px solid #16a34a' : '1.5px solid #e5e7eb',
              backgroundColor: filter === 'pagos' ? '#dcfce7' : '#ffffff',
              color: filter === 'pagos' ? '#166534' : '#4b5563',
              transition: 'all 0.15s ease'
            }}
          >
            💳 Pagos ({pagosCount})
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '15px' }}>
          Cargando historial...
        </p>
      ) : items.length === 0 ? (
        <div
          style={{
            padding: '32px',
            backgroundColor: '#f9fafb',
            borderRadius: '10px',
            border: '1px dashed #d1d5db',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}
        >
          No hay movimientos registrados para este proveedor.
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          style={{
            padding: '32px',
            backgroundColor: '#f9fafb',
            borderRadius: '10px',
            border: '1px dashed #d1d5db',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}
        >
          No hay {filter === 'deudas' ? 'deudas registradas' : 'pagos registrados'} para este proveedor.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto' }}>
          {filteredItems.map((mov, idx) => {
            const isDeuda = mov.tipoMovimiento === 'Deuda';
            const isPago = mov.tipoMovimiento === 'Pago';

            return (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: !mov.activo ? '#f9fafb' : isDeuda ? '#ffffff' : '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  opacity: mov.activo ? 1 : 0.65
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: !mov.activo ? '#e5e7eb' : isDeuda ? '#fee2e2' : '#dcfce7',
                      color: !mov.activo ? '#6b7280' : isDeuda ? '#dc2626' : '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {isDeuda ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '14px',
                          color: '#111827',
                          textDecoration: mov.activo ? 'none' : 'line-through'
                        }}
                      >
                        {mov.concepto}
                      </span>

                      {/* Badge de comprobante si es deuda */}
                      {mov.tipoComprobante && (
                        <ComprobanteBadge tipo={mov.tipoComprobante} numero={mov.numeroComprobante} />
                      )}

                      {/* Badge de forma de pago */}
                      {mov.medioPago && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#15803d',
                            backgroundColor: '#dcfce7',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          {mov.medioPago}
                        </span>
                      )}

                      {!mov.activo && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#dc2626',
                            backgroundColor: '#fee2e2',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          {isDeuda ? 'Deuda Eliminada' : 'Pago Anulado'}
                        </span>
                      )}
                    </div>

                    {/* CONFIRMACIÓN DE A QUÉ DEUDA HACE REFERENCIA EL PAGO */}
                    {isPago && (
                      <div style={{ fontSize: '12px', color: '#4338ca', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <FileText size={12} />
                        <span>
                          <strong>Deuda aplicada:</strong>{' '}
                          {mov.deudaConcepto ? mov.deudaConcepto : 'Pago a cuenta general del proveedor'}
                        </span>
                        {mov.deudaTipoComprobante && (
                          <ComprobanteBadge tipo={mov.deudaTipoComprobante} numero={mov.deudaNumeroComprobante} />
                        )}
                      </div>
                    )}

                    <span style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginTop: '2px' }}>
                      {new Date(mov.fecha).toLocaleDateString()} {new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {mov.referencia && ` • Ref: ${mov.referencia}`}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: !mov.activo ? '#9ca3af' : isDeuda ? '#dc2626' : '#16a34a',
                        textDecoration: mov.activo ? 'none' : 'line-through'
                      }}
                    >
                      {isDeuda ? `+$${mov.monto.toLocaleString()}` : `-$${mov.monto.toLocaleString()}`}
                    </span>
                  </div>

                  {/* Botón para anular pago activo */}
                  {isPago && mov.activo && (
                    <button
                      onClick={() => setPagoToCancel(mov)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#fff1f2',
                        border: '1px solid #fecdd3',
                        color: '#e11d48',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ffe4e6')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff1f2')}
                      title="Anular este pago (recalcula los saldos automáticamente)"
                    >
                      <Trash2 size={12} />
                      <span>Anular</span>
                    </button>
                  )}

                  {/* Botón para RESTAURAR DEUDA eliminada */}
                  {isDeuda && !mov.activo && (
                    <button
                      onClick={() => setDeudaToRestore(mov)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #86efac',
                        color: '#15803d',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dcfce7')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
                      title="Restaurar esta deuda y traerla de vuelta a la lista activa"
                    >
                      <RotateCcw size={12} />
                      <span>Restaurar Deuda</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmación en la interfaz para ANULAR PAGO */}
      <ConfirmModal
        isOpen={!!pagoToCancel}
        onClose={() => setPagoToCancel(null)}
        onConfirm={confirmAnularPago}
        title="¿Anular este pago?"
        message={
          pagoToCancel && (
            <div>
              <p style={{ margin: '0 0 10px 0' }}>
                ¿Estás seguro de anular el pago de <strong>${pagoToCancel.monto.toLocaleString()}</strong> ({pagoToCancel.medioPago || 'Pago'}) registrado el {new Date(pagoToCancel.fecha).toLocaleDateString()}?
              </p>
              {pagoToCancel.deudaConcepto && (
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#4338ca' }}>
                  Estaba imputado a la deuda: <strong>{pagoToCancel.deudaConcepto}</strong>
                </p>
              )}
              <p style={{ margin: 0, color: '#b91c1c', fontWeight: 600 }}>
                ⚠️ El saldo pendiente de la deuda aumentará automáticamente por este importe.
              </p>
            </div>
          )
        }
        confirmText="Sí, Anular Pago"
        cancelText="Cancelar"
        variant="danger"
        loading={actionLoading}
      />

      {/* Modal de confirmación en la interfaz para RESTAURAR DEUDA */}
      <ConfirmModal
        isOpen={!!deudaToRestore}
        onClose={() => setDeudaToRestore(null)}
        onConfirm={confirmRestaurarDeuda}
        title="¿Restaurar comprobante de deuda?"
        message={
          deudaToRestore && (
            <div>
              <p style={{ margin: '0 0 10px 0' }}>
                Estás a punto de recuperar la deuda <strong>"{deudaToRestore.concepto}"</strong> por <strong>${deudaToRestore.monto.toLocaleString()}</strong>.
              </p>
              <p style={{ margin: 0, color: '#15803d', fontWeight: 600 }}>
                ✓ Volverá a aparecer en la lista de deudas activas y su saldo adeudado se reintegrará al total del proveedor.
              </p>
            </div>
          )
        }
        confirmText="Sí, Restaurar Deuda"
        cancelText="Cancelar"
        variant="success"
        loading={actionLoading}
      />
    </ModalWrapper>
  );
};
