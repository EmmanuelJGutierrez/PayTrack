import React from 'react';
import { Building2, Search, AlertTriangle, Clock } from 'lucide-react';
import type { ProveedorResumen } from '../../types';

interface Props {
  proveedores: ProveedorResumen[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onOpenNewProvider: () => void;
}

export const ProviderSidebar: React.FC<Props> = ({
  proveedores,
  selectedId,
  onSelect,
  searchTerm,
  onSearchChange,
  onOpenNewProvider
}) => {
  return (
    <aside
      style={{
        width: '320px',
        backgroundColor: '#fbfaf8',
        borderRight: '1px solid #e8e4dc',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 70px)',
        position: 'sticky',
        top: '70px',
        overflow: 'hidden'
      }}
    >
      {/* Header Sección Empresas */}
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #f1ede7' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
            <Building2 size={16} />
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Empresas ({proveedores.length})
            </span>
          </div>

          <button
            onClick={onOpenNewProvider}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 11px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              borderRadius: '7px',
              border: 'none',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(22, 163, 74, 0.25)',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#15803d')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#16a34a')}
            title='Registrar nuevo proveedor'
          >
            <span>Nuevo +</span>
          </button>
        </div>

        {/* Buscador Rápido */}
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            color="#9ca3af"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Buscar proveedor..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              borderRadius: '8px',
              border: '1px solid #e5e0d8',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Lista de Proveedores */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {proveedores.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '24px 10px', color: '#9ca3af', fontSize: '13px' }}>
            No se encontraron proveedores.
          </p>
        ) : (
          proveedores.map(p => {
            const isSelected = p.id === selectedId;
            const tieneSaldo = p.saldoPendiente > 0;

            return (
              <div
                key={p.id}
                onClick={() => onSelect(p.id)}
                style={{
                  position: 'relative',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#eef4fe' : 'transparent',
                  marginBottom: '6px',
                  transition: 'background-color 0.15s ease',
                  border: isSelected ? '1px solid #dbeafe' : '1px solid transparent'
                }}
              >
                {/* Barra azul de selección a la izquierda */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '0px',
                      top: '12px',
                      bottom: '12px',
                      width: '4px',
                      backgroundColor: '#2563eb',
                      borderRadius: '0 4px 4px 0'
                    }}
                  />
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontWeight: isSelected ? 800 : 700, fontSize: '14px', color: '#1f2937' }}>
                    {p.nombre}
                  </span>

                  {p.tieneDeudasVencidas ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#b91c1c',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fca5a5',
                        padding: '1px 5px',
                        borderRadius: '4px'
                      }}
                      title="Tiene deudas vencidas"
                    >
                      <AlertTriangle size={10} />
                      Vencido
                    </span>
                  ) : p.tieneDeudasPorVencer ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#b45309',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fde68a',
                        padding: '1px 5px',
                        borderRadius: '4px'
                      }}
                      title="Tiene deudas que vencen en los próximos 7 días"
                    >
                      <Clock size={10} />
                      Próximo
                    </span>
                  ) : null}
                </div>

                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: tieneSaldo ? '#dc2626' : '#16a34a',
                      opacity: tieneSaldo ? 0.9 : 1
                    }}
                  >
                    ${p.saldoPendiente.toLocaleString()} pendiente
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
