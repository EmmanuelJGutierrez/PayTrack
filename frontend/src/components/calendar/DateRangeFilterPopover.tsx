import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  startDate: Date | null;
  endDate: Date | null;
  onApply: (start: Date | null, end: Date | null) => void;
  onClear: () => void;
}

const DIAS_SEMANA = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];
const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DateRangeFilterPopover: React.FC<Props> = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  onApply,
  onClear
}) => {
  const [viewAnio, setViewAnio] = useState(new Date().getFullYear());
  const [viewMes, setViewMes] = useState(new Date().getMonth() + 1); // 1-12

  const [tempStart, setTempStart] = useState<Date | null>(startDate);
  const [tempEnd, setTempEnd] = useState<Date | null>(endDate);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTempStart(startDate);
      setTempEnd(endDate);
      if (startDate) {
        setViewAnio(startDate.getFullYear());
        setViewMes(startDate.getMonth() + 1);
      } else {
        setViewAnio(new Date().getFullYear());
        setViewMes(new Date().getMonth() + 1);
      }
    }
  }, [isOpen, startDate, endDate]);

  // Click outside to close
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

  const handlePrevMonth = () => {
    if (viewMes === 1) {
      setViewMes(12);
      setViewAnio(a => a - 1);
    } else {
      setViewMes(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMes === 12) {
      setViewMes(1);
      setViewAnio(a => a + 1);
    } else {
      setViewMes(m => m + 1);
    }
  };

  // Cálculo de días de la grilla
  const diasEnMes = new Date(viewAnio, viewMes, 0).getDate();
  const primerDiaSemana = new Date(viewAnio, viewMes - 1, 1).getDay();
  // Ajuste lunes = 0, domingo = 6
  const primerDiaAjustado = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

  const handleDayClick = (dia: number) => {
    const clickedDate = new Date(viewAnio, viewMes - 1, dia, 0, 0, 0, 0);

    if (!tempStart || (tempStart && tempEnd)) {
      // Comenzar nuevo rango
      setTempStart(clickedDate);
      setTempEnd(null);
    } else {
      // Segundo clic para cerrar rango
      if (clickedDate < tempStart) {
        setTempEnd(tempStart);
        setTempStart(clickedDate);
      } else {
        const endOfDay = new Date(viewAnio, viewMes - 1, dia, 23, 59, 59, 999);
        setTempEnd(endOfDay);
      }
    }
  };

  // Atajos
  const applyPreset = (preset: 'esteMes' | 'mesPasado' | 'ultimos3Meses' | 'esteAnio' | 'todo') => {
    const now = new Date();
    if (preset === 'todo') {
      setTempStart(null);
      setTempEnd(null);
      onClear();
      onClose();
      return;
    }

    if (preset === 'esteMes') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      setTempStart(s);
      setTempEnd(e);
      onApply(s, e);
      onClose();
      return;
    }

    if (preset === 'mesPasado') {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      setTempStart(s);
      setTempEnd(e);
      onApply(s, e);
      onClose();
      return;
    }

    if (preset === 'ultimos3Meses') {
      const s = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      setTempStart(s);
      setTempEnd(e);
      onApply(s, e);
      onClose();
      return;
    }

    if (preset === 'esteAnio') {
      const s = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const e = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      setTempStart(s);
      setTempEnd(e);
      onApply(s, e);
      onClose();
      return;
    }
  };

  const handleApply = () => {
    onApply(tempStart, tempEnd);
    onClose();
  };

  const handleClear = () => {
    setTempStart(null);
    setTempEnd(null);
    onClear();
    onClose();
  };

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: '0px',
        zIndex: 1000,
        width: '320px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      {/* Cabecera Verde Corporativo (Inspirado en la imagen de referencia) */}
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
          onClick={handlePrevMonth}
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
            cursor: 'pointer'
          }}
          title="Mes anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <span style={{ fontSize: '15px', fontWeight: 800 }}>
          {MESES_NOMBRES[viewMes - 1]} {viewAnio}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
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
            cursor: 'pointer'
          }}
          title="Mes siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Días de la semana en español */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          backgroundColor: '#f8fafc',
          padding: '8px 12px 4px 12px',
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: 800,
          color: '#64748b',
          borderBottom: '1px solid #f1f5f9'
        }}
      >
        {DIAS_SEMANA.map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Grilla de Días del Mes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          padding: '10px 12px',
          gap: '2px',
          backgroundColor: '#ffffff'
        }}
      >
        {/* Días en blanco iniciales */}
        {Array.from({ length: primerDiaAjustado }).map((_, i) => (
          <div key={`blank-${i}`} style={{ height: '32px' }} />
        ))}

        {/* Días reales del mes */}
        {Array.from({ length: diasEnMes }).map((_, i) => {
          const dia = i + 1;
          const fechaActual = new Date(viewAnio, viewMes - 1, dia);

          const isStart = tempStart ? isSameDay(fechaActual, tempStart) : false;
          const isEnd = tempEnd ? isSameDay(fechaActual, tempEnd) : false;

          let inRange = false;
          if (tempStart && tempEnd) {
            inRange = fechaActual >= tempStart && fechaActual <= tempEnd;
          } else if (tempStart && !tempEnd && hoverDate) {
            const rangeStart = tempStart < hoverDate ? tempStart : hoverDate;
            const rangeEnd = tempStart < hoverDate ? hoverDate : tempStart;
            inRange = fechaActual >= rangeStart && fechaActual <= rangeEnd;
          }

          const isToday = isSameDay(fechaActual, new Date());

          return (
            <div
              key={dia}
              onClick={() => handleDayClick(dia)}
              onMouseEnter={() => setHoverDate(fechaActual)}
              onMouseLeave={() => setHoverDate(null)}
              style={{
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: isStart || isEnd ? 800 : inRange ? 600 : 500,
                color: isStart || isEnd ? '#ffffff' : inRange ? '#065f46' : isToday ? '#059669' : '#1e293b',
                backgroundColor: isStart || isEnd ? '#15803d' : inRange ? '#dcfce7' : 'transparent',
                borderRadius: isStart ? '8px 0 0 8px' : isEnd ? '0 8px 8px 0' : inRange ? '0px' : '8px',
                transition: 'background-color 0.1s ease',
                border: isToday && !isStart && !isEnd && !inRange ? '1px dashed #10b981' : 'none'
              }}
            >
              {dia}
            </div>
          );
        })}
      </div>

      {/* Sección Atajos Rápidos (Inspirado en la imagen de referencia) */}
      <div style={{ padding: '8px 12px 10px 12px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fafaf9' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
          Atajos rápidos:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          <button
            type="button"
            onClick={() => applyPreset('esteMes')}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #bbf7d0',
              backgroundColor: '#f0fdf4',
              color: '#15803d',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Este mes
          </button>
          <button
            type="button"
            onClick={() => applyPreset('mesPasado')}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Mes pasado
          </button>
          <button
            type="button"
            onClick={() => applyPreset('ultimos3Meses')}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Últimos 3 meses
          </button>
          <button
            type="button"
            onClick={() => applyPreset('esteAnio')}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Este año
          </button>
        </div>
      </div>

      {/* Barra de Acciones Final */}
      <div
        style={{
          padding: '10px 14px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <button
          type="button"
          onClick={handleClear}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#64748b',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Limpiar filtro
        </button>

        <button
          type="button"
          onClick={handleApply}
          style={{
            padding: '6px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#15803d',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(21, 128, 61, 0.2)'
          }}
        >
          Aplicar
        </button>
      </div>
    </div>
  );
};
