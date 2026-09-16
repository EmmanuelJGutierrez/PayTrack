import React, { useEffect, useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { fetchResumenMensual } from '../../services/api';
import type { ResumenMensual } from '../../types';
import { exportResumenMensualToCsv } from '../../utils/exporter';
import { FileSpreadsheet, CreditCard, Banknote, ArrowRightLeft, FileCheck, HelpCircle } from 'lucide-react';
import { ComprobanteBadge } from '../badges/ComprobanteBadge';

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

  const getMedioIcon = (medio: string) => {
    switch (medio.toLowerCase()) {
      case 'transferencia':
        return <ArrowRightLeft size={18} color="#2563eb" />;
      case 'efectivo':
        return <Banknote size={18} color="#16a34a" />;
      case 'debito':
        return <CreditCard size={18} color="#7c3aed" />;
      case 'cheque':
        return <FileCheck size={18} color="#ea580c" />;
      default:
        return <HelpCircle size={18} color="#6b7280" />;
    }
  };

  const handleExport = () => {
    if (!resumen) return;
    exportResumenMensualToCsv(resumen, nombreMes, anio);
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Resumen de Pagos — ${nombreMes} ${anio}`} maxWidth="750px">
      {loading ? (
        <p style={{ textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '15px' }}>
          Cargando resumen mensual...
        </p>
      ) : !resumen ? (
        <p style={{ textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '15px' }}>
          No se pudo cargar la información.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Barra de Acciones y Totales */}
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '2px solid #bbf7d0',
              borderRadius: '14px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Pagado en el Mes
              </span>
              <div style={{ fontSize: '34px', fontWeight: 800, color: '#15803d', lineHeight: 1.1, marginTop: '4px' }}>
                ${resumen.totalPagado.toLocaleString()}
              </div>
              <span style={{ fontSize: '13px', color: '#166534', opacity: 0.9, marginTop: '2px', display: 'inline-block' }}>
                {resumen.cantidadPagos} pago{resumen.cantidadPagos === 1 ? '' : 's'} registrado{resumen.cantidadPagos === 1 ? '' : 's'}
              </span>
            </div>

            <button
              onClick={handleExport}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 18px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#166534')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#15803d')}
              title="Descarga una planilla compatible con Excel con el resumen y todos los pagos"
            >
              <FileSpreadsheet size={18} />
              Exportar a Excel (.csv)
            </button>
          </div>

          {/* Desglose por Medio de Pago */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>
              Desglose por Forma de Pago:
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              {Object.entries(resumen.porMedioPago).map(([medio, total]) => (
                <div
                  key={medio}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getMedioIcon(medio)}
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>{medio}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: total > 0 ? '#111827' : '#9ca3af' }}>
                    ${total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Detalle Individual de Pagos del Mes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#374151' }}>
                Detalle de Pagos Realizados:
              </h4>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                {resumen.pagos ? resumen.pagos.length : 0} movimiento{resumen.pagos?.length === 1 ? '' : 's'}
              </span>
            </div>

            {(!resumen.pagos || resumen.pagos.length === 0) ? (
              <div
                style={{
                  padding: '24px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '10px',
                  border: '1px dashed #d1d5db',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '14px'
                }}
              >
                No hay pagos registrados en este mes.
              </div>
            ) : (
              <div
                style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  paddingRight: '4px'
                }}
              >
                {resumen.pagos.map((p) => {
                  const fecha = new Date(p.fechaPago);
                  return (
                    <div
                      key={p.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {getMedioIcon(p.medioPago)}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
                              {p.proveedorNombre}
                            </span>
                            {p.tipoComprobante && (
                              <ComprobanteBadge tipo={p.tipoComprobante} numero={p.numeroComprobante} />
                            )}
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
                              {p.medioPago}
                            </span>
                          </div>

                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            {fecha.toLocaleDateString()} {fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {p.deudaConcepto && ` • ${p.deudaConcepto}`}
                            {p.referencia && ` • Ref: ${p.referencia}`}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#15803d' }}>
                          ${p.monto.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </ModalWrapper>
  );
};
