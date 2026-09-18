import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Building2, Plus, Calendar, FileText, FileSpreadsheet } from 'lucide-react';
import { Header } from './components/layout/Header';
import { ProviderSidebar } from './components/providers/ProviderSidebar';
import { DebtTable } from './components/debts/DebtTable';
import { AddProviderModal } from './components/modals/AddProviderModal';
import { AddDebtModal } from './components/modals/AddDebtModal';
import { AddPaymentModal } from './components/modals/AddPaymentModal';
import { HistoryModal } from './components/modals/HistoryModal';
import { MonthlySummaryModal } from './components/modals/MonthlySummaryModal';
import { BackupModal } from './components/modals/BackupModal';
import { HelpModal } from './components/modals/HelpModal';
import { CalendarModal } from './components/calendar/CalendarModal';
import { fetchProveedores, fetchDeudas } from './services/api';
import type { ProveedorResumen, DeudaResumen } from './types';
import { exportPlanillaProveedoresToCsv } from './utils/exporter';

export const App: React.FC = () => {
  // Inicializamos en Julio 2026 (exacto como el diseño de Figma)
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);

  const [proveedores, setProveedores] = useState<ProveedorResumen[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [deudas, setDeudas] = useState<DeudaResumen[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Modales
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMonthlySummaryOpen, setIsMonthlySummaryOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Deuda puntual para registrar pago
  const [paymentTargetDebt, setPaymentTargetDebt] = useState<DeudaResumen | undefined>(undefined);

  const NOMBRES_MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const loadProveedores = useCallback(async () => {
    try {
      setConnectionError(null);
      const data = await fetchProveedores(anio, mes, searchTerm);
      setProveedores(data);

      if (data.length > 0) {
        setSelectedProviderId(prev => {
          if (prev !== null && data.some(p => p.id === prev)) {
            return prev;
          }
          return data[0].id;
        });
      } else {
        setSelectedProviderId(null);
      }
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      setConnectionError('No se pudo conectar con el servidor backend. Verificá que la API de .NET esté corriendo en http://localhost:5177');
    } finally {
      setLoading(false);
    }
  }, [anio, mes, searchTerm]);

  const loadDeudas = useCallback(async (provId: number) => {
    try {
      const data = await fetchDeudas(provId, anio, mes);
      setDeudas(data);
    } catch (err) {
      console.error('Error al cargar deudas:', err);
    }
  }, [anio, mes]);

  useEffect(() => {
    loadProveedores();
  }, [loadProveedores]);

  useEffect(() => {
    if (selectedProviderId !== null) {
      loadDeudas(selectedProviderId);
    } else {
      setDeudas([]);
    }
  }, [selectedProviderId, loadDeudas]);

  const handlePrevMonth = () => {
    if (mes === 1) {
      setMes(12);
      setAnio(a => a - 1);
    } else {
      setMes(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (mes === 12) {
      setMes(1);
      setAnio(a => a + 1);
    } else {
      setMes(m => m + 1);
    }
  };

  const handleOpenAddPayment = (deuda?: DeudaResumen) => {
    setPaymentTargetDebt(deuda);
    setIsAddPaymentOpen(true);
  };

  const handleDataChanged = () => {
    loadProveedores();
    if (selectedProviderId !== null) {
      loadDeudas(selectedProviderId);
    }
  };

  const handleExportPlanilla = () => {
    if (proveedores.length === 0) return;
    exportPlanillaProveedoresToCsv(proveedores, NOMBRES_MESES[mes - 1] || 'Mes', anio);
  };

  const selectedProvider = proveedores.find(p => p.id === selectedProviderId);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Banner de error de conexión si el backend está caído */}
      {connectionError && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            padding: '10px 24px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 700,
            borderBottom: '1.5px solid #f87171'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={16} /> {connectionError}</span>
        </div>
      )}

      {/* Header Fijo */}
      <Header
        anio={anio}
        mes={mes}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        onOpenMonthlySummary={() => setIsMonthlySummaryOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onExportPlanilla={handleExportPlanilla}
      />

      {/* Cuerpo Principal (Sidebar + Detalle) */}
      <div style={{ display: 'flex', flex: 1 }}>
        <ProviderSidebar
          proveedores={proveedores}
          selectedId={selectedProviderId}
          onSelect={setSelectedProviderId}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onOpenNewProvider={() => setIsAddProviderOpen(true)}
        />

        <main style={{ flex: 1, backgroundColor: '#f4f7f5', zIndex: 10, minHeight: 'calc(100vh - 70px)' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
              Cargando información del sistema...
            </div>
          ) : selectedProvider ? (
            <DebtTable
              proveedor={selectedProvider}
              deudas={deudas}
              onOpenAddDebt={() => setIsAddDebtOpen(true)}
              onOpenAddPayment={handleOpenAddPayment}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onDebtDeleted={handleDataChanged}
            />
          ) : proveedores.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 120px)',
                padding: '40px 24px'
              }}
            >
              <div
                style={{
                  maxWidth: '540px',
                  width: '100%',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
                  padding: '40px 32px',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '18px',
                    color: '#15803d',
                    boxShadow: '0 4px 12px rgba(21, 128, 61, 0.12)'
                  }}
                >
                  <Building2 size={32} />
                </div>
                
                <h2
                  style={{
                    fontSize: '24px',
                    fontWeight: 800,
                    color: '#1e293b',
                    marginBottom: '8px',
                    letterSpacing: '-0.02em'
                  }}
                >
                  PayTrack
                </h2>
                
                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#15803d',
                    marginBottom: '14px'
                  }}
                >
                  Su aplicación confiable para gestionar y controlar sus deudas
                </h3>
                
                <p
                  style={{
                    fontSize: '14px',
                    color: '#64748b',
                    lineHeight: '1.6',
                    marginBottom: '26px'
                  }}
                >
                  Puede registrar y dar seguimiento a sus comprobantes (facturas y remitos), controlar fechas de vencimiento, registrar pagos parciales o totales y exportar planillas resumen. Para iniciar agregue un nuevo proveedor.
                </p>

                <button
                  onClick={() => setIsAddProviderOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#166534')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#15803d')}
                >
                  <Plus size={18} />
                  <span>Agregar nuevo proveedor</span>
                </button>

                <div
                  style={{
                    marginTop: '32px',
                    paddingTop: '20px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-around',
                    fontSize: '12.5px',
                    color: '#64748b'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={15} color="#15803d" /> Control mensual
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={15} color="#15803d" /> Facturas y Remitos
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileSpreadsheet size={15} color="#15803d" /> Planillas Excel
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: '#9ca3af' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#4b5563', marginBottom: '8px' }}>
                Seleccioná una empresa
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Hacé clic en cualquier proveedor del menú lateral para consultar sus comprobantes y pagos.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Modales */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        anio={anio}
        mes={mes}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        nombreMes={NOMBRES_MESES[mes - 1]}
        onSelectProveedor={(provId) => setSelectedProviderId(provId)}
      />

      <AddProviderModal
        isOpen={isAddProviderOpen}
        onClose={() => setIsAddProviderOpen(false)}
        onSuccess={handleDataChanged}
      />

      {selectedProvider && (
        <>
          <AddDebtModal
            isOpen={isAddDebtOpen}
            onClose={() => setIsAddDebtOpen(false)}
            onSuccess={handleDataChanged}
            proveedorId={selectedProvider.id}
            proveedorNombre={selectedProvider.nombre}
          />

          <AddPaymentModal
            isOpen={isAddPaymentOpen}
            onClose={() => setIsAddPaymentOpen(false)}
            onSuccess={handleDataChanged}
            proveedorId={selectedProvider.id}
            proveedorNombre={selectedProvider.nombre}
            saldoPendienteTotal={selectedProvider.saldoPendiente}
            deudaId={paymentTargetDebt?.id}
            deudaConcepto={paymentTargetDebt?.concepto}
            deudaSaldoPendiente={paymentTargetDebt?.saldoPendiente}
          />

          <HistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            proveedorId={selectedProvider.id}
            proveedorNombre={selectedProvider.nombre}
            onSuccess={handleDataChanged}
          />
        </>
      )}

      <MonthlySummaryModal
        isOpen={isMonthlySummaryOpen}
        onClose={() => setIsMonthlySummaryOpen(false)}
        anio={anio}
        mes={mes}
        nombreMes={NOMBRES_MESES[mes - 1]}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onSuccess={handleDataChanged}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};
export default App;
