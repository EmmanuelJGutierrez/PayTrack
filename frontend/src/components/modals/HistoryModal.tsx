import React, { useEffect, useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { fetchHistorial, anularPago } from '../../services/api';
import type { MovimientoHistorial } from '../../types';
import { ComprobanteBadge } from '../badges/ComprobanteBadge';
import { exportHistorialProveedorToCsv } from '../../utils/exporter';
import { FileSpreadsheet, ArrowDownRight, ArrowUpRight, Trash2 } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [anulandoId, setAnulandoId] = useState<number | null>(null);

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

  const handleAnular = async (mov: MovimientoHistorial) => {
    const fechaStr = new Date(mov.fecha).toLocaleDateString();
    const confirmacion = window.confirm(
      `¿Estás seguro de anular el pago de $${mov.monto.toLocaleString()} (${mov.medioPago || 'Pago'}, ${fechaStr})?\n\n` +
      `El saldo de la deuda aumentará automáticamente por este monto.`
    );

    if (!confirmacion) return;

    try {
      setAnulandoId(mov.id);
      await anularPago(mov.id);
      loadData();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message || 'Error al anular pago');
    } finally {
      setAnulandoId(null);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Historial — ${proveedorNombre}`} maxWidth="740px">
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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '460px', overflowY: 'auto' }}>
          {items.map((mov, idx) => {
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
                  opacity: mov.activo ? 1 : 0.6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
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

                  <div style={{ minWidth: 0 }}>
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
                      {mov.tipoComprobante && (
                        <ComprobanteBadge tipo={mov.tipoComprobante} numero={mov.numeroComprobante} />
                      )}
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
                          Anulado
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginTop: '2px' }}>
                      {new Date(mov.fecha).toLocaleDateString()} {new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {mov.referencia && ` • Ref: ${mov.referencia}`}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
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
                      onClick={() => handleAnular(mov)}
                      disabled={anulandoId === mov.id}
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
                      <span>{anulandoId === mov.id ? 'Anulando...' : 'Anular'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ModalWrapper>
  );
};
