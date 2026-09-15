import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, BarChart3, HelpCircle } from 'lucide-react';

interface Props {
  anio: number;
  mes: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenNewProvider: () => void;
  onOpenMonthlySummary: () => void;
  onOpenHelp: () => void;
}

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const Header: React.FC<Props> = ({
  anio,
  mes,
  onPrevMonth,
  onNextMonth,
  onOpenNewProvider,
  onOpenMonthlySummary,
  onOpenHelp
}) => {
  const nombreMes = NOMBRES_MESES[mes - 1] || 'Mes';

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e0d8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      {/* Selector de Mes Central / Izquierda según Figma */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f8fafc',
            padding: '8px 16px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}
        >
          <Calendar size={20} color="#2563eb" />
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>
            {nombreMes} <span style={{ color: '#2563eb' }}>{anio}</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={onPrevMonth}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569'
            }}
            title="Mes anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={onNextMonth}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569'
            }}
            title="Mes siguiente"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Acciones principales a la derecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onOpenMonthlySummary}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: '#f0fdf4',
            color: '#15803d',
            borderRadius: '10px',
            border: '1.5px solid #bbf7d0',
            fontWeight: 700,
            fontSize: '14px'
          }}
        >
          <BarChart3 size={18} />
          <span>Resumen de Pagos del Mes</span>
        </button>

        <button
          onClick={onOpenNewProvider}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '14px',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)'
          }}
        >
          <Plus size={18} />
          <span>+ Nuevo Proveedor</span>
        </button>

        <button
          onClick={onOpenHelp}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#1e293b',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Ayuda / Instrucciones"
        >
          <HelpCircle size={20} />
        </button>
      </div>
    </header>
  );
};
