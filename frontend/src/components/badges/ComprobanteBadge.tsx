import React from 'react';

interface Props {
  tipo: 'Remito' | 'Factura';
  numero?: string;
}

export const ComprobanteBadge: React.FC<Props> = ({ tipo, numero }) => {
  const isRemito = tipo === 'Remito';

  const style: React.CSSProperties = isRemito
    ? {
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        border: '1.5px solid #1a1a1a'
      }
    : {
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
        border: '1.5px solid #1a1a1a'
      };

  return (
    <span
      style={{
        ...style,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '3px 8px',
        borderRadius: '6px',
        userSelect: 'none'
      }}
      title={numero ? `${tipo}: ${numero}` : tipo}
    >
      {tipo}
      {numero && <span style={{ opacity: 0.75, fontWeight: 500 }}>#{numero}</span>}
    </span>
  );
};
