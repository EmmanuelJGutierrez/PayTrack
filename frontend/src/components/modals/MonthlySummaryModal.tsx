import React, { useEffect, useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { fetchResumenMensual } from '../../services/api';
import type { ResumenMensual } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  anio: number;
  mes: number;
  nombreMes: string;
}

export const MonthlySummaryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  anio,
  mes,
  nombreMes
}) => {
  const [resumen, setResumen] = useState<ResumenMensual | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchResumenMensual(anio, mes)
        .then(setResumen)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, anio, mes]);

  const iconosMedio: Record<string, string> = {
    Transferencia: '🏦',
    Efectivo: '💵',
    Debito: '💳',
    Cheque: '📄',
    Otro: '🔄'
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Resumen de Pagos — ${nombreMes} ${anio}`}>
      {loading ? (
        <p style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>Cargando resumen mensual...</p>
      ) : !resumen ? (
        <p style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>No se pudo cargar la información.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card Principal Total */}
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '2px solid #bbf7d0',
              borderRadius: '14px',
              padding: '20px',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>
              Total Pagado en el Mes
            </span>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
              ${resumen.totalPagado.toLocaleString()}
            </div>
            <span style={{ fontSize: '13px', color: '#166534', opacity: 0.85 }}>
              {resumen.cantidadPagos} pago(s) registrado(s)
            </span>
          </div>

          {/* Desglose por Medio de Pago */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>
              Desglose por Forma de Pago:
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {Object.entries(resumen.porMedioPago).map(([medio, total]) => (
                <div
                  key={medio}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{iconosMedio[medio] || '💰'}</span>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>{medio}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: total > 0 ? '#111827' : '#9ca3af' }}>
                    ${total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ModalWrapper>
  );
};
