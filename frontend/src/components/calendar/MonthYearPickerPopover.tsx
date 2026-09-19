import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentAnio: number;
  currentMes: number; // 1-12
  onSelect: (anio: number, mes: number) => void;
}

const MESES_ABREV = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export const MonthYearPickerPopover: React.FC<Props> = ({
  isOpen,
  onClose,
  currentAnio,
  currentMes,
  onSelect
}) => {
  const [viewAnio, setViewAnio] = useState(currentAnio);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setViewAnio(currentAnio);
    }
  }, [isOpen, currentAnio]);

  // Cerrar al cliquear afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actualAnio = new Date().getFullYear();
  const actualMes = new Date().getMonth() + 1;

  const handleSelectMonth = (mesIndex: number) => {
    onSelect(viewAnio, mesIndex + 1);
    onClose();
  };

  const handleQuickCurrent = () => {
    onSelect(actualAnio, actualMes);
    onClose();
  };

  const handleQuickAddYear = () => {
    onSelect(currentAnio + 1, currentMes);
    onClose();
  };

  const handleQuickSubYear = () => {
    onSelect(currentAnio - 1, currentMes);
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: '0px',
        zIndex: 1000,
        width: '280px',
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      {/* Cabecera Verde Corporativo Oscuro (Estilo PayTrack) */}
      <div
        style={{
          backgroundColor: '#0f5132',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff'
        }}
      >
        <button
          type="button"
          onClick={() => setViewAnio(a => a - 1)}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            color: '#ffffff',
            borderRadius: '6px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
          title="Año anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.02em' }}>
          Año {viewAnio}
        </span>

        <button
          type="button"
          onClick={() => setViewAnio(a => a + 1)}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            color: '#ffffff',
            borderRadius: '6px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
          title="Año siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grilla de los 12 Meses en Español */}
      <div
        style={{
          padding: '14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          backgroundColor: '#fafaf9'
        }}
      >
        {MESES_ABREV.map((nombre, idx) => {
          const isSelected = viewAnio === currentAnio && idx + 1 === currentMes;
          const isCurrentMonth = viewAnio === actualAnio && idx + 1 === actualMes;

          return (
            <button
              key={nombre}
              type="button"
              onClick={() => handleSelectMonth(idx)}
              style={{
                padding: '9px 4px',
                borderRadius: '8px',
                border: isSelected ? '1.5px solid #15803d' : isCurrentMonth ? '1.5px dashed #059669' : '1px solid #e5e7eb',
                backgroundColor: isSelected ? '#15803d' : isCurrentMonth ? '#ecfdf5' : '#ffffff',
                color: isSelected ? '#ffffff' : isCurrentMonth ? '#065f46' : '#374151',
                fontSize: '13px',
                fontWeight: isSelected || isCurrentMonth ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                boxShadow: isSelected ? '0 2px 4px rgba(21, 128, 61, 0.25)' : 'none'
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#f0fdf4';
                  e.currentTarget.style.borderColor = '#86efac';
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = isCurrentMonth ? '#ecfdf5' : '#ffffff';
                  e.currentTarget.style.borderColor = isCurrentMonth ? '#059669' : '#e5e7eb';
                }
              }}
            >
              {nombre}
            </button>
          );
        })}
      </div>

      {/* Atajos Rápidos en la base (Inspirado en la imagen de referencia) */}
      <div
        style={{
          padding: '10px 14px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px'
        }}
      >
        <button
          type="button"
          onClick={handleQuickCurrent}
          style={{
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid #bbf7d0',
            backgroundColor: '#f0fdf4',
            color: '#15803d',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Ir al mes y año corriente"
        >
          <Sparkles size={12} />
          Mes Actual
        </button>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={handleQuickSubYear}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#475569',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Restar 1 año al mes actual"
          >
            -1 Año
          </button>
          <button
            type="button"
            onClick={handleQuickAddYear}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#475569',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Sumar 1 año al mes actual"
          >
            +1 Año
          </button>
        </div>
      </div>
    </div>
  );
};
