import React, { useState } from 'react';
import {
  Plus,
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
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const toggleRow = (id: number) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async (deuda: DeudaResumen) => {
    const confirmMsg = deuda.totalPagado > 0
      ? `Esta deuda tiene $${deuda.totalPagado.toLocaleString()} amortizados. ¿Estás seguro de que deseás eliminarla?`
      : `¿Estás seguro de eliminar la deuda "${deuda.concepto}" por $${deuda.monto.toLocaleString()}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setDeletingId(deuda.id);
      await eliminarDeuda(proveedor.id, deuda.id);
      if (onDebtDeleted) onDebtDeleted();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la deuda');
    } finally {
      setDeletingId(null);
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
          ✓ Saldado
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
      {/* Encabezado del Proveedor Seleccionado */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            {proveedor.nombre}
          </h1>

          {/* Estadísticas en línea (Figma) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', fontSize: '14px', flexWrap: 'wrap' }}>
            <span style={{ color: '#4b5563', fontWeight: 600 }}>
              Deudas: <strong style={{ color: '#111827' }}>{proveedor.cantidadDeudas}</strong>
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

          {/* Anotador y contacto */}
          {(proveedor.contacto || proveedor.notas) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px', fontSize: '13px', color: '#6b7280', flexWrap: 'wrap' }}>
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

        {/* Botones de acción del proveedor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => onOpenAddPayment()}
            disabled={proveedor.saldoPendiente <= 0}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              backgroundColor: proveedor.saldoPendiente > 0 ? '#16a34a' : '#e5e7eb',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              cursor: proveedor.saldoPendiente > 0 ? 'pointer' : 'not-allowed',
              boxShadow: proveedor.saldoPendiente > 0 ? '0 2px 4px rgba(22, 163, 74, 0.25)' : 'none'
            }}
          >
            <DollarSign size={16} />
            <span>Pagar Saldo</span>
          </button>

          <button
            onClick={onOpenAddDebt}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              backgroundColor: '#1f2937',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            <span>+ Cargar Deuda</span>
          </button>
        </div>
      </div>

      {/* Tabla / Card con estilo idéntico al Figma */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1.5px solid #e5e0d8',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        {/* Encabezado de la tabla */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2.6fr 1.2fr 1.2fr 1fr 1fr 1fr',
            padding: '16px 24px',
            backgroundColor: '#f1ede7',
            fontWeight: 800,
            fontSize: '13px',
            color: '#4b5563',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          <div>Concepto / Estado</div>
          <div style={{ textAlign: 'center' }}>Total Deuda</div>
          <div style={{ textAlign: 'center' }}>Saldo Pendiente</div>
          <div style={{ textAlign: 'center' }}>Agregar Pago</div>
          <div style={{ textAlign: 'center' }}>Historial</div>
          <div style={{ textAlign: 'center' }}>Este Mes</div>
        </div>

        {/* Listado de Deudas */}
        {deudas.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>
              No hay deudas registradas para este proveedor
            </p>
            <p style={{ fontSize: '14px' }}>
              Hacé clic en "+ Cargar Deuda" arriba para registrar un comprobante (Remito o Factura).
            </p>
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
                    gridTemplateColumns: '2.6fr 1.2fr 1.2fr 1fr 1fr 1fr',
                    padding: '18px 24px',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  {/* Columna 1: Concepto con flecha, badges y barra de progreso */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => toggleRow(d.id)}
                        style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>

                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                        {d.concepto}
                      </span>

                      <ComprobanteBadge tipo={d.tipoComprobante} numero={d.numeroComprobante} />
                      {renderVencimientoBadge(d)}
                    </div>

                    {/* Barra de progreso (% saldado) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', paddingLeft: '24px' }}>
                      <div
                        style={{
                          width: '110px',
                          height: '6px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${d.porcentajeSaldado}%`,
                            height: '100%',
                            backgroundColor: d.porcentajeSaldado >= 100 ? '#10b981' : d.porcentajeSaldado >= 50 ? '#f59e0b' : '#ef4444',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280' }}>
                        {d.porcentajeSaldado}%
                      </span>
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
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: isSaldado ? '#f3f4f6' : '#eff6ff',
                        color: isSaldado ? '#9ca3af' : '#2563eb',
                        border: isSaldado ? '1px solid #e5e7eb' : '1px solid #bfdbfe',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isSaldado ? 'not-allowed' : 'pointer',
                        boxShadow: isSaldado ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                      title={isSaldado ? 'Deuda totalmente saldada' : 'Registrar pago a esta deuda'}
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  {/* Columna 5: Botón Historial */}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={onOpenHistory}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#fef3c7',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Ver historial de pagos de este proveedor"
                    >
                      <History size={16} />
                    </button>
                  </div>

                  {/* Columna 6: Este Mes */}
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
                      padding: '14px 24px 16px 54px',
                      backgroundColor: '#fafaf9',
                      borderTop: '1px dashed #e5e0d8',
                      fontSize: '13px',
                      color: '#4b5563',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <div>
                        <strong>Fecha emisión:</strong> {new Date(d.fechaDeuda).toLocaleDateString()}
                      </div>
                      {d.fechaVencimiento && (
                        <div>
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
                      onClick={() => handleDelete(d)}
                      disabled={deletingId === d.id}
                      style={{
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
                        cursor: 'pointer'
                      }}
                      title="Eliminar este comprobante"
                    >
                      <Trash2 size={13} />
                      <span>{deletingId === d.id ? 'Eliminando...' : 'Eliminar Deuda'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
