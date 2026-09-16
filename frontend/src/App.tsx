import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { ProviderSidebar } from './components/providers/ProviderSidebar';
import { DebtTable } from './components/debts/DebtTable';
import { AddProviderModal } from './components/modals/AddProviderModal';
import { AddDebtModal } from './components/modals/AddDebtModal';
import { AddPaymentModal } from './components/modals/AddPaymentModal';
import { HistoryModal } from './components/modals/HistoryModal';
import { MonthlySummaryModal } from './components/modals/MonthlySummaryModal';
import { HelpModal } from './components/modals/HelpModal';
import { CalendarModal } from './components/calendar/CalendarModal';
import { fetchProveedores, fetchDeudas } from './services/api';
import type { ProveedorResumen, DeudaResumen } from './types';

export const App: React.FC = () => {
  // Inicializamos en Julio 2026 (exacto como el diseño de Figma)
  const [anio, setAnio] = useState(2026);
  const [mes, setMes] = useState(7);

  const [proveedores, setProveedores] = useState<ProveedorResumen[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [deudas, setDeudas] = useState<DeudaResumen[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modales
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMonthlySummaryOpen, setIsMonthlySummaryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Deuda puntual para registrar pago
  const [paymentTargetDebt, setPaymentTargetDebt] = useState<DeudaResumen | undefined>(undefined);

  const NOMBRES_MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const loadProveedores = useCallback(async () => {
    try {
      const data = await fetchProveedores(anio, mes, searchTerm);
      setProveedores(data);

      if (data.length > 0) {
        setSelectedProviderId(prev => {
          if (prev !== null && data.some(p => p.id === prev)) {
            return prev;
          }
          const gamma = data.find(p => p.nombre.includes('Gamma'));
          return gamma ? gamma.id : data[0].id;
        });
      } else {
        setSelectedProviderId(null);
      }
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
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

  const selectedProvider = proveedores.find(p => p.id === selectedProviderId);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Fijo */}
      <Header
        anio={anio}
        mes={mes}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        onOpenNewProvider={() => setIsAddProviderOpen(true)}
        onOpenMonthlySummary={() => setIsMonthlySummaryOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Cuerpo Principal (Sidebar + Detalle) */}
      <div style={{ display: 'flex', flex: 1 }}>
        <ProviderSidebar
          proveedores={proveedores}
          selectedId={selectedProviderId}
          onSelect={setSelectedProviderId}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <main style={{ flex: 1, backgroundColor: '#f7f6f2', minHeight: 'calc(100vh - 70px)' }}>
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
            />
          ) : (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: '#9ca3af' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#4b5563', marginBottom: '8px' }}>
                No hay ningún proveedor seleccionado
              </h2>
              <p style={{ fontSize: '15px' }}>
                Hacé clic en "+ Nuevo Proveedor" arriba a la derecha para dar de alta tu primera empresa.
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

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};
export default App;
