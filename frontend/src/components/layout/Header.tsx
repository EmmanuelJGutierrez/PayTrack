import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, BarChart3, HelpCircle, FileSpreadsheet } from 'lucide-react';

interface Props {
  anio: number;
  mes: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenCalendar: () => void;
  onOpenMonthlySummary: () => void;
  onOpenHelp: () => void;
  onOpenBackup?: () => void;
  onExportPlanilla?: () => void;
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
  onOpenCalendar,
  onOpenMonthlySummary,
  onOpenHelp,
  onOpenBackup,
  onExportPlanilla
}) => {
  const nombreMes = NOMBRES_MESES[mes - 1] || 'Mes';

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)'
      }}
    >
      {/* Selector de Mes con acceso directo al Calendario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onOpenCalendar}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'transparent',
            padding: '6px 12px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          title="Abrir vista de Calendario mensual"
        >
          <Calendar size={22} color="#0f5132" />
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {nombreMes} <span style={{ color: '#059669' }}>{anio}</span>
          </span>
        </button>

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
              color: '#475569',
              border: 'none',
              cursor: 'pointer'
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
              color: '#475569',
              border: 'none',
              cursor: 'pointer'
            }}
            title="Mes siguiente"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Acciones principales a la derecha (limpio y despejado) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {onExportPlanilla && (
          <button
            onClick={onExportPlanilla}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #bbf7d0',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dcfce7')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
            title='Exportar Planilla a Excel (.csv)'
          >
            <FileSpreadsheet size={19} color='#15803d' />
          </button>
        )}

        {onOpenBackup && (
          <button
            onClick={onOpenBackup}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#f0f9ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #bae6fd',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0f2fe')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
            title='Respaldo y Restauración de Base de Datos'
          >
            <svg width='22' height='22' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <ellipse cx='20' cy='11' rx='13' ry='5' fill='#bae6fd' stroke='#0284c7' strokeWidth='2' />
              <path d='M7 11V18C7 20.8 12.8 23 20 23C27.2 23 33 20.8 33 18V11' fill='#e0f2fe' stroke='#0284c7' strokeWidth='2' />
              <path d='M7 18V25C7 27.8 12.8 30 20 30C23.6 30 26.8 29.5 29.2 28.5' stroke='#0284c7' strokeWidth='2' />
              <path d='M7 25V32C7 34.8 12.8 37 20 37C22.6 37 25.1 36.6 27.2 35.8' stroke='#0284c7' strokeWidth='2' />
              <circle cx='10' cy='14' r='0.9' fill='#0284c7' />
              <circle cx='10' cy='21.5' r='0.9' fill='#0284c7' />
              <circle cx='10' cy='28.5' r='0.9' fill='#0284c7' />
              <circle cx='34' cy='33' r='11' fill='#ffffff' stroke='#bae6fd' strokeWidth='1.5' />
              <path d='M34 26C37.8 26 41 29.2 41 33C41 36.8 37.8 40 34 40C30.8 40 28.1 37.8 27.3 34.8' stroke='#0284c7' strokeWidth='2.4' strokeLinecap='round' />
              <polyline points='30,26 34,26 34,30' stroke='#0284c7' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round' fill='none' />
            </svg>
          </button>
        )}

        <button
          onClick={onOpenMonthlySummary}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            backgroundColor: '#f0fdf4',
            color: '#15803d',
            borderRadius: '10px',
            border: '1.5px solid #bbf7d0',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dcfce7')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
          title='Ver resumen y desglose de pagos del mes'
        >
          <BarChart3 size={17} />
          <span>Resumen</span>
        </button>

        <button
          onClick={onOpenHelp}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#1e293b',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer'
          }}
          title='Ayuda / Instrucciones'
        >
          <HelpCircle size={18} />
        </button>
      </div>
    </header>
  );
};
