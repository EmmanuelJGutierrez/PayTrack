import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, BarChart3, HelpCircle, FileSpreadsheet } from 'lucide-react';

interface Props {
  anio: number;
  mes: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenCalendar: () => void;
  onOpenNewProvider: () => void;
  onOpenMonthlySummary: () => void;
  onOpenHelp: () => void;
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
  onOpenNewProvider,
  onOpenMonthlySummary,
  onOpenHelp,
  onExportPlanilla
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
      {/* Selector de Mes con acceso directo al Calendario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onOpenCalendar}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f8fafc',
            padding: '8px 16px',
            borderRadius: '12px',
            border: '1.5px solid #cbd5e1',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          title="Hacer clic para abrir la vista de Calendario mensual"
        >
          <Calendar size={20} color="#2563eb" />
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>
            {nombreMes} <span style={{ color: '#2563eb' }}>{anio}</span>
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>
            Ver Calendario 📅
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

      {/* Acciones principales a la derecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {onExportPlanilla && (
          <button
            onClick={onExportPlanilla}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              backgroundColor: '#f8fafc',
              color: '#334155',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
            title="Exporta el estado general de deudas de todos los proveedores a una planilla Excel (.csv)"
          >
            <FileSpreadsheet size={16} color="#15803d" />
            <span>Exportar Planilla</span>
          </button>
        )}

        <button
          onClick={onOpenMonthlySummary}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            backgroundColor: '#f0fdf4',
            color: '#15803d',
            borderRadius: '10px',
            border: '1.5px solid #bbf7d0',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer'
          }}
          title="Ver resumen y desglose de pagos del mes"
        >
          <BarChart3 size={17} />
          <span>Resumen del Mes</span>
        </button>

        <button
          onClick={onOpenNewProvider}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            fontSize: '13px',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
            cursor: 'pointer'
          }}
        >
          <Plus size={17} />
          <span>+ Nuevo Proveedor</span>
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
          title="Ayuda / Instrucciones"
        >
          <HelpCircle size={18} />
        </button>
      </div>
    </header>
  );
};
