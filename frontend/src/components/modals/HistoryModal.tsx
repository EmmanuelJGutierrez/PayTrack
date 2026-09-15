import React, { useEffect, useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { fetchHistorial } from '../../services/api';
import type { MovimientoHistorial } from '../../types';
import { ComprobanteBadge } from '../badges/ComprobanteBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  proveedorId: number;
  proveedorNombre: string;
}

export const HistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  proveedorId,
  proveedorNombre
}) => {
  const [items, setItems] = useState<MovimientoHistorial[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && proveedorId) {
      setLoading(true);
      fetchHistorial(proveedorId)
        .then(setItems)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, proveedorId]);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Historial — ${proveedorNombre}`} maxWidth="680px">
      {loading ? (
        <p style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>Cargando historial...</p>
      ) : items.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>No hay movimientos registrados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((mov, idx) => {
            const isDeuda = mov.tipoMovimiento === 'Deuda';
            return (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: isDeuda ? '#ffffff' : '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  opacity: mov.activo ? 1 : 0.5
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '22px' }}>{isDeuda ? '📋' : '💵'}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>
                        {mov.concepto}
                      </span>
                      {mov.tipoComprobante && (
                        <ComprobanteBadge tipo={mov.tipoComprobante} numero={mov.numeroComprobante} />
                      )}
                      {mov.medioPago && (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#15803d',
                            backgroundColor: '#dcfce7',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          {mov.medioPago}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      {new Date(mov.fecha).toLocaleDateString()} {new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {mov.referencia && ` · Ref: ${mov.referencia}`}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: isDeuda ? '#dc2626' : '#16a34a'
                    }}
                  >
                    {isDeuda ? `+$${mov.monto.toLocaleString()}` : `-$${mov.monto.toLocaleString()}`}
                  </span>
                  {!mov.activo && (
                    <span style={{ display: 'block', fontSize: '11px', color: '#9ca3af' }}>Anulado</span>
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
