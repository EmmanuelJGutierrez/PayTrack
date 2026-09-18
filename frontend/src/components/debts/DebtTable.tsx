import React, { useState } from 'react';
import {
  Plus,
  Check,
  History,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Phone,
  BookOpen,
  AlertTriangle,
  Clock,
  Calendar,
  Trash2
} from 'lucide-react';
import type { ProveedorResumen, DeudaResumen } from '../../types';
import { ComprobanteBadge } from '../badges/ComprobanteBadge';
import { eliminarDeuda } from '../../services/api';
import { ConfirmModal } from '../modals/ConfirmModal';

interface Props {
  proveedor: ProveedorResumen;
  deudas: DeudaResumen[];
  onOpenAddDebt: () => void;
  onOpenAddPayment: (deuda?: DeudaResumen) => void;
  onOpenHistory: () => void;
  onDebtDeleted?: () => void;
}

export const DebtTable: React.FC<Props> = ({
  proveedor,
  deudas,
  onOpenAddDebt,
  onOpenAddPayment,
  onOpenHistory,
  onDebtDeleted
}) => {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [deudaToDelete, setDeudaToDelete] = useState<DeudaResumen | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleRow = (id: number) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const confirmDelete = async () => {
    if (!deudaToDelete) return;

    try {
      setDeleting(true);
      await eliminarDeuda(proveedor.id, deudaToDelete.id);
      setDeudaToDelete(null);
      if (onDebtDeleted) onDebtDeleted();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la deuda');
    } finally {
      setDeleting(false);
    }
  };

  const renderVencimientoBadge = (d: DeudaResumen) => {
    if (d.saldoPendiente <= 0) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#16a34a',
            backgroundColor: '#dcfce7',
            padding: '2px 7px',
            borderRadius: '5px'
          }}
        >
          <Check size={12} style={{ strokeWidth: 3 }} /> Saldado
        </span>
      );
    }

    if (d.estadoVencimiento === 'Vencido') {
      const dias = Math.abs(d.diasParaVencer ?? 0);
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 800,
            color: '#b91c1c',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            padding: '2px 8px',
            borderRadius: '6px'
          }}
          title={`Venció hace ${dias} día${dias === 1 ? '' : 's'}`}
        >
          <AlertTriangle size={12} />
          Venció hace {dias}d
        </span>
      );
    }

    if (d.estadoVencimiento === 'PorVencer') {
      const dias = d.diasParaVencer ?? 0;
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 800,
            color: '#b45309',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            padding: '2px 8px',
            borderRadius: '6px'
          }}
          title={dias === 0 ? 'Vence hoy' : `Vence en ${dias} día${dias === 1 ? '' : 's'}`}
        >
          <Clock size={12} />
          {dias === 0 ? 'Vence hoy' : `Vence en ${dias}d`}
        </span>
      );
    }

    if (d.fechaVencimiento) {
      const fecha = new Date(d.fechaVencimiento);
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#475569',
            backgroundColor: '#f1f5f9',
            padding: '2px 7px',
            borderRadius: '5px'
          }}
        >
          <Calendar size={12} />
          Vence {fecha.toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
        </span>
      );
    }

    return null;
  };

  return (
    <div style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
      {/* Encabezado del Proveedor Seleccionado (Card con elevación) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '24px',
        backgroundColor: '#ffffff',
        padding: '24px 28px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 16px -4px rgba(15, 23, 42, 0.04)'
      }}>
        {/* Fila 1: Título a la izquierda y Botones de Acción fijados siempre arriba a la derecha */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
            {proveedor.nombre}
          </h1>

          {/* Botones de acción del proveedor fijados siempre arriba */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={onOpenHistory}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                border: '1.5px solid #fde68a',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fde68a')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fef3c7')}
              title="Ver todos los movimientos (deudas y pagos) de este proveedor"
            >
              <History size={17} />
              <span>Historial</span>
            </button>

            <button
              onClick={onOpenAddDebt}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                backgroundColor: '#0f5132',
                boxShadow: '0 2px 4px rgba(15, 81, 50, 0.25)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
            >
              <Plus size={17} />
              <span>Deuda</span>
            </button>
          </div>
        </div>

        {/* Fila 2: Estadísticas en línea */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', flexWrap: 'wrap' }}>
          <span style={{ color: '#4b5563', fontWeight: 600 }}>
            Deudas activas: <strong style={{ color: '#111827' }}>{proveedor.cantidadDeudas}</strong>
          </span>

          <span style={{ color: '#4b5563', fontWeight: 600 }}>
            Saldo pendiente:{' '}
            <span
              style={{
                color: proveedor.saldoPendiente > 0 ? '#dc2626' : '#16a34a',
                fontWeight: 800,
                backgroundColor: proveedor.saldoPendiente > 0 ? '#fee2e2' : '#dcfce7',
                padding: '2px 8px',
                borderRadius: '6px'
              }}
            >
              ${proveedor.saldoPendiente.toLocaleString()}
            </span>
          </span>

          <span style={{ color: '#4b5563', fontWeight: 600 }}>
            Pagado este mes:{' '}
            <span
              style={{
                color: '#16a34a',
                fontWeight: 800,
                backgroundColor: '#dcfce7',
                padding: '2px 8px',
                borderRadius: '6px'
              }}
            >
              ${proveedor.pagadoEsteMes.toLocaleString()}
            </span>
          </span>
        </div>

        {/* Fila 3: Anotador y contacto */}
        {(proveedor.contacto || proveedor.notas) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#6b7280', flexWrap: 'wrap' }}>
            {proveedor.contacto && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} color="#6b7280" />
                <span>{proveedor.contacto}</span>
              </div>
            )}
            {proveedor.notas && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={14} color="#6b7280" />
                <span style={{ fontStyle: 'italic' }}>"{proveedor.notas}"</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabla / Card con estilo limpio y espacioso */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1.5px solid #e5e0d8',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        {/* Encabezado de la tabla (5 columnas limpias) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '3fr 1.2fr 1.2fr 1fr 1fr',
            padding: '16px 24px',
            backgroundColor: '#f1ede7',
            fontWeight: 800,
            fontSize: '13px',
            color: '#4b5563',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          <div>Concepto / Comprobante</div>
          <div style={{ textAlign: 'center' }}>Total Deuda</div>
          <div style={{ textAlign: 'center' }}>Saldo Pendiente</div>
          <div style={{ textAlign: 'center' }}>Agregar Pago</div>
          <div style={{ textAlign: 'center' }}>Pagado Este Mes</div>
        </div>

        {/* Listado de Deudas */}
        {deudas.length === 0 ? (
          <div style={{ padding: '52px 24px', textAlign: 'center', color: '#6b7280' }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
              No hay deudas vigentes en este mes
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '440px', margin: '0 auto 16px auto' }}>
              Este proveedor no tiene comprobantes emitidos ni vencimientos pendientes en el mes seleccionado.
            </p>
            <button
              onClick={onOpenHistory}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '1.5px solid #d1d5db',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              <History size={15} /> Ver historial completo de movimientos
            </button>
          </div>
        ) : (
          deudas.map((d) => {
            const isExpanded = !!expandedRows[d.id];
            const isSaldado = d.saldoPendiente <= 0;

            return (
              <div
                key={d.id}
                style={{
                  borderBottom: '1px solid #e5e0d8',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '3fr 1.2fr 1.2fr 1fr 1fr',
                    padding: '18px 24px',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                                    {/* Columna 1: Concepto alineado con Factura en fila 1, Progreso y Estado en fila 2 */}
                  <div>
                    {/* Fila 1: Concepto y Comprobante siempre juntos y alineados */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => toggleRow(d.id)}
                        style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>

                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        {d.concepto}
                      </span>

                      <ComprobanteBadge tipo={d.tipoComprobante} numero={d.numeroComprobante} />
                    </div>

                    {/* Fila 2: Barra de progreso, Porcentaje y Estado (Saldado / Vencido) siempre juntos */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', paddingLeft: '26px' }}>
                      <div
                        style={{
                          width: '110px',
                          height: '6px',
                          backgroundColor: '#e2e8f0',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, Math.max(0, d.porcentajeSaldado))}%`,
                            height: '100%',
                            background: d.porcentajeSaldado >= 100
                              ? '#16a34a'
                              : `linear-gradient(90deg, #38bdf8 0%, #10b981 ${Math.max(25, d.porcentajeSaldado)}%)`,
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>

                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: d.porcentajeSaldado >= 100 ? '#15803d' : d.porcentajeSaldado >= 50 ? '#059669' : '#0284c7'
                      }}>
                        {d.porcentajeSaldado}%
                      </span>

                      {/* Estado al lado del porcentaje en fila 2 */}
                      {renderVencimientoBadge(d)}
                    </div>
                  </div>

                  {/* Columna 2: Total Deuda */}
                  <div style={{ textAlign: 'center', fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    ${d.monto.toLocaleString()}
                  </div>

                  {/* Columna 3: Saldo Pendiente */}
                  <div style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        padding: '4px 12px',
                        borderRadius: '8px',
                        backgroundColor: isSaldado ? '#dcfce7' : '#fee2e2',
                        color: isSaldado ? '#15803d' : '#dc2626'
                      }}
                    >
                      ${d.saldoPendiente.toLocaleString()}
                    </span>
                  </div>

                  {/* Columna 4: Botón Agregar Pago (+) */}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => onOpenAddPayment(d)}
                      disabled={isSaldado}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: isSaldado ? '#f3f4f6' : '#eff6ff',
                        color: isSaldado ? '#9ca3af' : '#2563eb',
                        border: isSaldado ? '1px solid #e5e7eb' : '1px solid #bfdbfe',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isSaldado ? 'not-allowed' : 'pointer',
                        boxShadow: isSaldado ? 'none' : '0 1px 3px rgba(37, 99, 235, 0.15)',
                        transition: 'transform 0.1s ease'
                      }}
                      title={isSaldado ? 'Deuda totalmente saldada' : `Pagar sobre deuda: ${d.concepto}`}
                    >
                      <Plus size={19} />
                    </button>
                  </div>

                  {/* Columna 5: Pagado Este Mes */}
                  <div style={{ textAlign: 'center' }}>
                    {d.pagadoEsteMes > 0 ? (
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '2px'
                          }}
                        >
                          <DollarSign size={15} />
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>
                          ${d.pagadoEsteMes.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          backgroundColor: '#f3f4f6',
                          color: '#9ca3af',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Sin pagos en este mes"
                      >
                        <DollarSign size={15} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Detalle expandible de la fila */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '12px 24px 14px 54px',
                      backgroundColor: '#fafaf9',
                      borderTop: '1px dashed #e5e0d8',
                      fontSize: '13px',
                      color: '#4b5563',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                      <div>
                        <strong>Fecha emisión:</strong> {new Date(d.fechaDeuda).toLocaleDateString()}
                      </div>
                      {d.fechaVencimiento && (
                        <div style={{ color: '#b45309', fontWeight: 600 }}>
                          <strong>Vencimiento:</strong> {new Date(d.fechaVencimiento).toLocaleDateString()}
                        </div>
                      )}
                      <div>
                        <strong>Total amortizado:</strong> ${d.totalPagado.toLocaleString()}
                      </div>
                      {d.numeroComprobante && (
                        <div>
                          <strong>Comprobante Nº:</strong> {d.numeroComprobante}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setDeudaToDelete(d)}
                      style={{
                        flexShrink: 0,
                        marginLeft: 'auto',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fca5a5',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fecdd3')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                      title="Eliminar este comprobante"
                    >
                      <Trash2 size={13} />
                      <span>Eliminar Deuda</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de confirmación en interfaz para eliminar deuda (sin alert de navegador) */}
      <ConfirmModal
        isOpen={!!deudaToDelete}
        onClose={() => setDeudaToDelete(null)}
        onConfirm={confirmDelete}
        title="¿Eliminar comprobante de deuda?"
        message={
          deudaToDelete && (
            <div>
              <p style={{ margin: '0 0 10px 0' }}>
                Estás a punto de eliminar la deuda <strong>"{deudaToDelete.concepto}"</strong> por <strong>${deudaToDelete.monto.toLocaleString()}</strong>.
              </p>
              {deudaToDelete.totalPagado > 0 && (
                <p style={{ color: '#b91c1c', fontWeight: 600, margin: '0 0 8px 0' }}>
                  ⚠️ Esta deuda tiene pagos amortizados por ${deudaToDelete.totalPagado.toLocaleString()}.
                </p>
              )}
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Si la eliminás por error, podrás restaurarla en cualquier momento desde el <strong>Historial de Movimientos</strong>.
              </p>
            </div>
          )
        }
        confirmText="Sí, Eliminar Deuda"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};
