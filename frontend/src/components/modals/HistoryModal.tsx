import React, { useEffect, useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { fetchHistorial } from '../../services/api';
import type { MovimientoHistorial } from '../../types';
import { ComprobanteBadge } from '../badges/ComprobanteBadge';
import { exportHistorialProveedorToCsv } from '../../utils/exporter';
import { FileSpreadsheet, ArrowDownRight, ArrowUpRight } from 'lucide-react';

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

  const handleExport = () => {
    if (items.length === 0) return;
    exportHistorialProveedorToCsv(proveedorNombre, items);
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Historial — ${proveedorNombre}`} maxWidth="720px">
      {/* Barra de Acciones Superior */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid #e5e7eb'
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto' }}>
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
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: isDeuda ? '#fee2e2' : '#dcfce7',
                      color: isDeuda ? '#dc2626' : '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {isDeuda ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
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
                    </div>
                    <span style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginTop: '2px' }}>
                      {new Date(mov.fecha).toLocaleDateString()} {new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {mov.referencia && ` • Ref: ${mov.referencia}`}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: '15px',
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
