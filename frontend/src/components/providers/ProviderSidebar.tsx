import React from 'react';
import { Building2, Search } from 'lucide-react';
import type { ProveedorResumen } from '../../types';

interface Props {
  proveedores: ProveedorResumen[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const ProviderSidebar: React.FC<Props> = ({
  proveedores,
  selectedId,
  onSelect,
  searchTerm,
  onSearchChange
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
      <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #f1ede7' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', marginBottom: '12px' }}>
          <Building2 size={16} />
          <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Empresas ({proveedores.length})
          </span>
        </div>

        {/* Buscador Rápido (promovido al core) */}
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
                  padding: '14px 16px',
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

                <div style={{ fontWeight: isSelected ? 800 : 700, fontSize: '15px', color: '#1f2937' }}>
                  {p.nombre}
                </div>

                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '13px',
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
