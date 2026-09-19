import React, { useEffect, useState } from 'react';
import { ModalWrapper } from '../modals/ModalWrapper';
import { fetchCalendarioMensual, fetchDetalleDia } from '../../services/api';
import type { DiaCalendario, DetalleDiaResponse } from '../../types';
import { ComprobanteBadge } from '../badges/ComprobanteBadge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, ArrowDownRight, ArrowUpRight, ChevronDown
} from 'lucide-react';
import { MonthYearPickerPopover } from './MonthYearPickerPopover';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  anio: number;
  mes: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  nombreMes: string;
  onSelectProveedor?: (proveedorId: number) => void;
  onSelectMonthYear?: (anio: number, mes: number) => void;
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
  onSelectProveedor,
  onSelectMonthYear
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [dias, setDias] = useState<DiaCalendario[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [detalleDia, setDetalleDia] = useState<DetalleDiaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [showArrastreTooltip, setShowArrastreTooltip] = useState(false);
  const [resumenMes, setResumenMes] = useState<{
    totalMesPagos: number;
    totalMesDeudas: number;
    saldoNetoMes: number;
    totalArrastrePrevio: number;
    cantidadDeudasArrastre: number;
  }>({
    totalMesPagos: 0,
    totalMesDeudas: 0,
    saldoNetoMes: 0,
    totalArrastrePrevio: 0,
    cantidadDeudasArrastre: 0
  });

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchCalendarioMensual(anio, mes)
        .then(res => {
          setDias(res.dias);
          setResumenMes({
            totalMesPagos: res.totalMesPagos ?? 0,
            totalMesDeudas: res.totalMesDeudas ?? 0,
            saldoNetoMes: res.saldoNetoMes ?? ((res.totalMesPagos ?? 0) - (res.totalMesDeudas ?? 0)),
            totalArrastrePrevio: res.totalArrastrePrevio ?? 0,
            cantidadDeudasArrastre: res.cantidadDeudasArrastre ?? 0
          });
          const primerDiaConActividad = res.dias.find(
            d => d.cantidadDeudas > 0 || d.cantidadPagos > 0 || (d.cantidadVencimientos ?? 0) > 0
          );
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

  const saldoNeto = resumenMes.saldoNetoMes;
  const isSaldado = saldoNeto === 0;
  const isNegativo = saldoNeto < 0;

  const headerBadges = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Recuadro único de Total del mes */}
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          backgroundColor: isSaldado ? '#ecfdf5' : isNegativo ? '#fef2f2' : '#ecfdf5',
          border: isSaldado ? '1px solid #a7f3d0' : isNegativo ? '1px solid #fecaca' : '1px solid #a7f3d0',
          borderRadius: '8px',
          color: isSaldado ? '#15803d' : isNegativo ? '#dc2626' : '#15803d',
          fontSize: '13px',
          fontWeight: 800
        }}
      >
        <span>
          {isSaldado
            ? 'Total: $0'
            : isNegativo
            ? `Total: -$${Math.abs(saldoNeto).toLocaleString()}`
            : `Total: +$${saldoNeto.toLocaleString()}`}
        </span>

        {/* Alerta de arrastre previo con icono (!) sin emojis */}
        {resumenMes.totalArrastrePrevio > 0 && (
          <div
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
            onMouseEnter={() => setShowArrastreTooltip(true)}
            onMouseLeave={() => setShowArrastreTooltip(false)}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: isSaldado ? '#15803d' : '#dc2626',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'help',
                marginLeft: '3px',
                userSelect: 'none'
              }}
              title={`Si cree que hay inconsistencias en sus pagos de este mes es porque hay un arrastre de deuda del anterior monto: $${resumenMes.totalArrastrePrevio.toLocaleString()}.`}
            >
              !
            </div>

            {showArrastreTooltip && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: '0px',
                  width: '300px',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: '9px',
                  fontSize: '12px',
                  fontWeight: 500,
                  lineHeight: '1.45',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
                  zIndex: 10000,
                  pointerEvents: 'none'
                }}
              >
                Si cree que hay inconsistencias en sus pagos de este mes es porque hay un arrastre de deuda del anterior monto:{' '}
                <span style={{ color: '#fca5a5', fontWeight: 700 }}>
                  ${resumenMes.totalArrastrePrevio.toLocaleString()}
                </span>.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={`Calendario de Movimientos — ${nombreMes} ${anio}`}
      headerRight={headerBadges}
      maxWidth="880px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Barra superior de navegación de mes */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fafaf9',
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1px solid #e5e7eb'
          }}
        >
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsPickerOpen(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '8px',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              title="Seleccionar año y mes directamente"
            >
              <CalendarIcon size={18} color="#0f5132" />
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#1f2937' }}>
                {nombreMes} <span style={{ color: '#059669' }}>{anio}</span>
              </span>
              <ChevronDown size={14} color="#64748b" />
            </button>

            <MonthYearPickerPopover
              isOpen={isPickerOpen}
              onClose={() => setIsPickerOpen(false)}
              currentAnio={anio}
              currentMes={mes}
              onSelect={(newAnio, newMes) => {
                if (onSelectMonthYear) {
                  onSelectMonthYear(newAnio, newMes);
                }
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onPrevMonth}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
                fontSize: '12px',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={14} /> Mes anterior
            </button>
            <button
              onClick={onNextMonth}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
                fontSize: '12px',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              Mes siguiente <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Grilla y Panel de detalle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '14px', alignItems: 'start' }}>
          {/* Calendario mensual */}
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
              {DIAS_SEMANA.map(d => (
                <div
                  key={d}
                  style={{
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#6b7280',
                    padding: '2px 0',
                    textTransform: 'uppercase'
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '14px' }}>
                Cargando días del mes...
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {Array.from({ length: offsetInicial }).map((_, i) => (
                  <div key={`empty-${i}`} style={{ height: '56px' }} />
                ))}

                {dias.map(d => {
                  const isSelected = d.dia === diaSeleccionado;
                  const tienePagos = d.cantidadPagos > 0;
                  const tieneVencimientos = (d.cantidadVencimientos ?? 0) > 0;
                  const tieneDeudasEmitidas = (d.cantidadDeudas - (d.cantidadVencimientos ?? 0)) > 0;
                  const tieneActividad = tienePagos || tieneDeudasEmitidas || tieneVencimientos;

                  return (
                    <div
                      key={d.dia}
                      onClick={() => setDiaSeleccionado(d.dia)}
                      style={{
                        height: '56px',
                        padding: '4px 6px',
                        borderRadius: '8px',
                        border: isSelected
                          ? '2px solid #2563eb'
                          : tieneVencimientos
                          ? '1.5px solid #fcd34d'
                          : tieneActividad
                          ? '1.5px solid #d1d5db'
                          : '1px solid #f1f5f9',
                        backgroundColor: isSelected
                          ? '#eff6ff'
                          : tieneVencimientos
                          ? '#fffbeb'
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
                            fontSize: '12px',
                            fontWeight: isSelected || tieneActividad ? 800 : 600,
                            color: isSelected ? '#1e40af' : tieneVencimientos ? '#b45309' : tieneActividad ? '#111827' : '#9ca3af'
                          }}
                        >
                          {d.dia}
                        </span>

                        {tieneActividad && (
                          <div style={{ display: 'flex', gap: '3px' }}>
                            {tienePagos && (
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: '#16a34a'
                                }}
                                title={`${d.cantidadPagos} pago(s)`}
                              />
                            )}
                            {tieneVencimientos && (
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: '#d97706'
                                }}
                                title={`${d.cantidadVencimientos} vencimiento(s)`}
                              />
                            )}
                            {tieneDeudasEmitidas && (
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: '#dc2626'
                                }}
                                title="Deuda emitida"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden' }}>
                        {tienePagos && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              color: '#15803d',
                              backgroundColor: '#dcfce7',
                              padding: '1px 3px',
                              borderRadius: '3px',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden'
                            }}
                          >
                            -${Math.round(d.montoPagado).toLocaleString()}
                          </span>
                        )}

                        {tieneVencimientos ? (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              color: '#92400e',
                              backgroundColor: '#fef3c7',
                              border: '1px solid #fde68a',
                              padding: '0 3px',
                              borderRadius: '3px',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden'
                            }}
                            title={`Vence: $${Math.round(d.montoVencimientos ?? d.montoDeudas).toLocaleString()}`}
                          >
                            <Clock size={10} style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: '2px' }} />${Math.round(d.montoVencimientos ?? d.montoDeudas).toLocaleString()}
                          </span>
                        ) : tieneDeudasEmitidas ? (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              color: '#b91c1c',
                              backgroundColor: '#fee2e2',
                              padding: '1px 3px',
                              borderRadius: '3px',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden'
                            }}
                          >
                            +${Math.round(d.montoDeudas).toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel Lateral: Detalle del día seleccionado */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              height: '370px'
            }}
          >
            {diaSeleccionado === null ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', margin: 'auto', fontSize: '13px' }}>
                Selecciona un día en el calendario para ver sus movimientos.
              </p>
            ) : loadingDetalle ? (
              <p style={{ color: '#6b7280', textAlign: 'center', margin: 'auto', fontSize: '13px' }}>
                Cargando detalle...
              </p>
            ) : !detalleDia || detalleDia.movimientos.length === 0 ? (
              <div style={{ textAlign: 'center', margin: 'auto', color: '#64748b' }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                  {diaSeleccionado} de {nombreMes} {anio}
                </p>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>No se registraron movimientos en este día.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Cabecera del día */}
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    {diaSeleccionado} de {nombreMes} {anio}
                  </span>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {detalleDia.totalPagos > 0 && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#15803d',
                          backgroundColor: '#dcfce7',
                          padding: '2px 7px',
                          borderRadius: '5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <ArrowDownRight size={12} /> Pagos: ${detalleDia.totalPagos.toLocaleString()}
                      </span>
                    )}

                    {(detalleDia.cantidadVencimientos ?? 0) > 0 && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#92400e',
                          backgroundColor: '#fef3c7',
                          border: '1px solid #fde68a',
                          padding: '2px 7px',
                          borderRadius: '5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Clock size={12} /> Vence: ${detalleDia.totalDeudas.toLocaleString()}
                      </span>
                    )}

                    {detalleDia.totalDeudas > 0 && (detalleDia.cantidadVencimientos ?? 0) === 0 && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#b91c1c',
                          backgroundColor: '#fee2e2',
                          padding: '2px 7px',
                          borderRadius: '5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <ArrowUpRight size={12} /> Deudas: ${detalleDia.totalDeudas.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Lista de movimientos */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px' }}>
                  {detalleDia.movimientos.map(mov => {
                    const isPago = mov.tipoMovimiento === 'Pago';
                    const isVencimiento = mov.esVencimiento;

                    return (
                      <div
                        key={`${mov.tipoMovimiento}-${mov.id}-${isVencimiento ? 'venc' : 'mov'}`}
                        style={{
                          backgroundColor: '#ffffff',
                          padding: '9px 11px',
                          borderRadius: '8px',
                          border: isVencimiento ? '1px solid #fde68a' : '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}
                      >
                        <div style={{ overflow: 'hidden', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
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

                            {isVencimiento && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  color: '#b45309',
                                  backgroundColor: '#fef3c7',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <Clock size={10} /> Vence hoy
                              </span>
                            )}
                          </div>

                          <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {mov.concepto}
                          </p>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            {isVencimiento ? (
                              <span style={{ color: '#b45309', fontWeight: 600 }}>
                                Vencimiento de deuda
                              </span>
                            ) : (
                              <>
                                <Clock size={11} />
                                <span>
                                  {new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </>
                            )}
                            {mov.medioPago && <span>· {mov.medioPago}</span>}
                            {mov.referencia && <span>· Ref: {mov.referencia}</span>}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 800,
                              color: isPago ? '#16a34a' : isVencimiento ? '#b45309' : '#dc2626'
                            }}
                          >
                            {isPago ? `-$${mov.monto.toLocaleString()}` : isVencimiento ? `$${mov.monto.toLocaleString()}` : `+$${mov.monto.toLocaleString()}`}
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
