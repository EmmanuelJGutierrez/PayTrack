import React, { useState } from 'react';
import { Plus, History, DollarSign, ChevronDown, ChevronRight, FileText, Phone, BookOpen } from 'lucide-react';
import type { ProveedorResumen, DeudaResumen } from '../../types';
import { ComprobanteBadge } from '../badges/ComprobanteBadge';

interface Props {
  proveedor: ProveedorResumen;
  deudas: DeudaResumen[];
  onOpenAddDebt: () => void;
  onOpenAddPayment: (deuda?: DeudaResumen) => void;
  onOpenHistory: () => void;
}

export const DebtTable: React.FC<Props> = ({
  proveedor,
  deudas,
  onOpenAddDebt,
  onOpenAddPayment,
  onOpenHistory
}) => {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (id: number) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
      {/* Encabezado del Proveedor Seleccionado */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            {proveedor.nombre}
          </h1>

          {/* Estadísticas en línea (exacto Figma) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '8px', fontSize: '15px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px', fontSize: '13px', color: '#6b7280' }}>
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
              gap: '6px'
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
            gridTemplateColumns: '2.5fr 1.2fr 1.2fr 1fr 1fr 1fr',
            padding: '16px 24px',
            backgroundColor: '#f1ede7',
            borderBottom: '1px solid #e5e0d8',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.07em',
            color: '#6b7280',
            textTransform: 'uppercase',
            alignItems: 'center'
          }}
        >
          <div>CONCEPTO</div>
          <div style={{ textAlign: 'center' }}>TOTAL DEUDA</div>
          <div style={{ textAlign: 'center' }}>SALDO PENDIENTE</div>
          <div style={{ textAlign: 'center' }}>AGREGAR PAGO</div>
          <div style={{ textAlign: 'center' }}>HISTORIAL TOTAL</div>
          <div style={{ textAlign: 'center' }}>ESTE MES</div>
        </div>

        {/* Filas */}
        {deudas.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
            <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: '16px', fontWeight: 600 }}>No hay deudas cargadas para este proveedor.</p>
            <button
              onClick={onOpenAddDebt}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              + Cargar primera deuda
            </button>
          </div>
        ) : (
          deudas.map((d, index) => {
            const isSaldado = d.saldoPendiente <= 0;
            const isExpanded = !!expandedRows[d.id];

            return (
              <div
                key={d.id}
                style={{
                  borderBottom: index < deudas.length - 1 ? '1px solid #f1ede7' : 'none',
                  backgroundColor: '#ffffff'
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2.5fr 1.2fr 1.2fr 1fr 1fr 1fr',
                    padding: '20px 24px',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  {/* Columna 1: Concepto con flecha y barra de progreso */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => toggleRow(d.id)}
                        style={{ color: '#9ca3af', display: 'flex', alignItems: 'center' }}
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>

                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                        {d.concepto}
                      </span>

                      <ComprobanteBadge tipo={d.tipoComprobante} numero={d.numeroComprobante} />
                    </div>

                    {/* Barra de progreso (% saldado) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', paddingLeft: '26px' }}>
                      <div
                        style={{
                          width: '120px',
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
                  <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
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
                        boxShadow: isSaldado ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                      title={isSaldado ? 'Deuda totalmente saldada' : 'Registrar pago a esta deuda'}
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  {/* Columna 5: Botón Historial (⏱️) */}
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
                        justifyContent: 'center'
                      }}
                      title="Ver historial de pagos de esta deuda"
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
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '2px'
                          }}
                        >
                          <DollarSign size={16} />
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>
                          ${d.pagadoEsteMes.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#f3f4f6',
                          color: '#9ca3af',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Sin pagos en este mes"
                      >
                        <DollarSign size={16} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Detalle expandible de la fila */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '14px 24px 18px 58px',
                      backgroundColor: '#fafaf9',
                      borderTop: '1px dashed #e5e0d8',
                      fontSize: '13px',
                      color: '#4b5563',
                      display: 'flex',
                      gap: '24px'
                    }}
                  >
                    <div>
                      <strong>Fecha de carga:</strong> {new Date(d.fechaDeuda).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Total amortizado:</strong> ${d.totalPagado.toLocaleString()}
                    </div>
                    {d.numeroComprobante && (
                      <div>
                        <strong>Comprobante Nº:</strong> {d.numeroComprobante}
                      </div>
                    )}
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
