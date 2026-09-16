import React, { useEffect, useState } from 'react';
import { ModalWrapper } from '../modals/ModalWrapper';
import { fetchCalendarioMensual, fetchDetalleDia } from '../../services/api';
import type { DiaCalendario, DetalleDiaResponse } from '../../types';
import { ComprobanteBadge } from '../badges/ComprobanteBadge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  anio: number;
  mes: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  nombreMes: string;
  onSelectProveedor?: (proveedorId: number) => void;
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const CalendarModal: React.FC<Props> = ({
  isOpen,
  onClose,
  anio,
  mes,
  onPrevMonth,
  onNextMonth,
  nombreMes,
  onSelectProveedor
}) => {
  const [dias, setDias] = useState<DiaCalendario[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [detalleDia, setDetalleDia] = useState<DetalleDiaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchCalendarioMensual(anio, mes)
        .then(res => {
          setDias(res.dias);
          const primerDiaConActividad = res.dias.find(d => d.cantidadDeudas > 0 || d.cantidadPagos > 0);
          if (primerDiaConActividad) {
            setDiaSeleccionado(primerDiaConActividad.dia);
          } else {
            setDiaSeleccionado(1);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, anio, mes]);

  useEffect(() => {
    if (isOpen && diaSeleccionado !== null) {
      setLoadingDetalle(true);
      fetchDetalleDia(anio, mes, diaSeleccionado)
        .then(setDetalleDia)
        .catch(console.error)
        .finally(() => setLoadingDetalle(false));
    } else {
      setDetalleDia(null);
    }
  }, [isOpen, anio, mes, diaSeleccionado]);

  const primerDiaSemana = new Date(anio, mes - 1, 1).getDay();
  const offsetInicial = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={`Calendario de Movimientos — ${nombreMes} ${anio}`}
      maxWidth="920px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fafaf9',
            padding: '12px 18px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarIcon size={20} color="#2563eb" />
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#1f2937' }}>
              {nombreMes} <span style={{ color: '#2563eb' }}>{anio}</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onPrevMonth}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
                fontSize: '13px',
                color: '#374151'
              }}
            >
              <ChevronLeft size={16} /> Mes anterior
            </button>
            <button
              onClick={onNextMonth}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
                fontSize: '13px',
                color: '#374151'
              }}
            >
              Mes siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '6px' }}>
              {DIAS_SEMANA.map(d => (
                <div
                  key={d}
                  style={{
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#6b7280',
                    padding: '4px 0',
                    textTransform: 'uppercase'
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Cargando días del mes...</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                {Array.from({ length: offsetInicial }).map((_, i) => (
                  <div key={`empty-${i}`} style={{ height: '70px' }} />
                ))}

                {dias.map(d => {
                  const isSelected = d.dia === diaSeleccionado;
                  const tienePagos = d.cantidadPagos > 0;
                  const tieneDeudas = d.cantidadDeudas > 0;
                  const tieneActividad = tienePagos || tieneDeudas;

                  return (
                    <div
                      key={d.dia}
                      onClick={() => setDiaSeleccionado(d.dia)}
                      style={{
                        height: '74px',
                        padding: '6px 8px',
                        borderRadius: '10px',
                        border: isSelected
                          ? '2px solid #2563eb'
                          : tieneActividad
                          ? '1.5px solid #d1d5db'
                          : '1px solid #f3f4f6',
                        backgroundColor: isSelected
                          ? '#eff6ff'
                          : tieneActividad
                          ? '#ffffff'
                          : '#fafaf9',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: isSelected ? '0 2px 4px rgba(37,99,235,0.15)' : 'none',
                        transition: 'all 0.1s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: isSelected || tieneActividad ? 800 : 600,
                            color: isSelected ? '#1e40af' : tieneActividad ? '#111827' : '#9ca3af'
                          }}
                        >
                          {d.dia}
                        </span>

                        {tieneActividad && (
                          <div style={{ display: 'flex', gap: '3px' }}>
                            {tienePagos && (
                              <span
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  backgroundColor: '#16a34a'
                                }}
                                title={`${d.cantidadPagos} pago(s)`}
                              />
                            )}
                            {tieneDeudas && (
                              <span
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  backgroundColor: '#dc2626'
                                }}
                                title={`${d.cantidadDeudas} deuda(s)`}
                              />
                            )}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                        {tienePagos && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#15803d',
                              backgroundColor: '#dcfce7',
                              padding: '1px 4px',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden'
                            }}
                          >
                            -${Math.round(d.montoPagado).toLocaleString()}
                          </span>
                        )}

                        {tieneDeudas && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#b91c1c',
                              backgroundColor: '#fee2e2',
                              padding: '1px 4px',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden'
                            }}
                          >
                            +${Math.round(d.montoDeudas).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '440px'
            }}
          >
            {diaSeleccionado === null ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', margin: 'auto' }}>
                Selecciona un día en el calendario para ver sus movimientos.
              </p>
            ) : loadingDetalle ? (
              <p style={{ color: '#6b7280', textAlign: 'center', margin: 'auto' }}>Cargando detalle...</p>
            ) : !detalleDia || detalleDia.movimientos.length === 0 ? (
              <div style={{ textAlign: 'center', margin: 'auto', color: '#64748b' }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                  {diaSeleccionado} de {nombreMes} {anio}
                </p>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>No se registraron movimientos en este día.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    {diaSeleccionado} de {nombreMes} {anio}
                  </span>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    {detalleDia.totalPagos > 0 && (
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#15803d',
                          backgroundColor: '#dcfce7',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <ArrowDownRight size={13} /> Pagos: ${detalleDia.totalPagos.toLocaleString()}
                      </span>
                    )}

                    {detalleDia.totalDeudas > 0 && (
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#b91c1c',
                          backgroundColor: '#fee2e2',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <ArrowUpRight size={13} /> Deudas: ${detalleDia.totalDeudas.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {detalleDia.movimientos.map(mov => {
                    const isPago = mov.tipoMovimiento === 'Pago';

                    return (
                      <div
                        key={`${mov.tipoMovimiento}-${mov.id}`}
                        style={{
                          backgroundColor: '#ffffff',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}
                      >
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '13px',
                                color: '#1e40af',
                                cursor: onSelectProveedor ? 'pointer' : 'default',
                                textDecoration: onSelectProveedor ? 'underline' : 'none'
                              }}
                              onClick={() => {
                                if (onSelectProveedor) {
                                  onSelectProveedor(mov.proveedorId);
                                  onClose();
                                }
                              }}
                              title={onSelectProveedor ? 'Ver proveedor en pantalla principal' : ''}
                            >
                              {mov.proveedorNombre}
                            </span>

                            {mov.tipoComprobante && (
                              <ComprobanteBadge tipo={mov.tipoComprobante as any} numero={mov.numeroComprobante} />
                            )}
                          </div>

                          <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {mov.concepto}
                          </p>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            <Clock size={11} />
                            <span>
                              {new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {mov.medioPago && <span>· {mov.medioPago}</span>}
                            {mov.referencia && <span>· Ref: {mov.referencia}</span>}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 800,
                              color: isPago ? '#16a34a' : '#dc2626'
                            }}
                          >
                            {isPago ? `-$${mov.monto.toLocaleString()}` : `+$${mov.monto.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
