import React, { useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { createPago } from '../../services/api';
import {
  Banknote,
  ArrowRightLeft,
  CreditCard,
  FileCheck,
  HelpCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  proveedorId: number;
  proveedorNombre: string;
  saldoPendienteTotal: number;
  deudaId?: number;
  deudaConcepto?: string;
  deudaSaldoPendiente?: number;
}

export const AddPaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  proveedorId,
  proveedorNombre,
  saldoPendienteTotal,
  deudaId,
  deudaConcepto,
  deudaSaldoPendiente
}) => {
  const saldoMaximo = deudaSaldoPendiente !== undefined ? deudaSaldoPendiente : saldoPendienteTotal;

  const [monto, setMonto] = useState('');
  const [medioPago, setMedioPago] = useState<'Efectivo' | 'Transferencia' | 'Debito' | 'Cheque' | 'Otro'>('Transferencia');
  const [referencia, setReferencia] = useState('');
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numMontoInput = parseFloat(monto);
  const isExcedido = !isNaN(numMontoInput) && numMontoInput > saldoMaximo + 0.005;
  const isSubmitDisabled = loading || !monto || isNaN(numMontoInput) || numMontoInput <= 0 || isExcedido;

  const handleMontoChange = (val: string) => {
    setMonto(val);
    const num = Math.round(parseFloat(val) * 100) / 100;
    if (!isNaN(num) && num > saldoMaximo + 0.005) {
      setError(`El monto no puede superar el saldo pendiente (${saldoMaximo.toLocaleString()})`);
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numMonto = Math.round(parseFloat(monto) * 100) / 100;
    if (isNaN(numMonto) || numMonto <= 0) {
      setError('El monto a pagar debe ser mayor a 0');
      return;
    }

    if (numMonto > saldoMaximo + 0.005) {
      setError(`No podés pagar más del saldo adeudado (${saldoMaximo.toLocaleString()})`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fecha y hora del pago cargada automáticamente en tiempo real
      await createPago(proveedorId, {
        monto: numMonto,
        medioPago,
        referencia: referencia.trim() || undefined,
        comentario: comentario.trim() || undefined,
        fechaPago: new Date().toISOString(),
        deudaId
      });
      setMonto('');
      setReferencia('');
      setComentario('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar pago');
    } finally {
      setLoading(false);
    }
  };

  const medios = [
    { key: 'Transferencia' as const, label: 'Transferencia', icon: <ArrowRightLeft size={20} color="#2563eb" /> },
    { key: 'Efectivo' as const, label: 'Efectivo', icon: <Banknote size={20} color="#16a34a" /> },
    { key: 'Debito' as const, label: 'Tarjeta Débito', icon: <CreditCard size={20} color="#7c3aed" /> },
    { key: 'Cheque' as const, label: 'Cheque', icon: <FileCheck size={20} color="#ea580c" /> },
    { key: 'Otro' as const, label: 'Otro', icon: <HelpCircle size={20} color="#64748b" /> }
  ];

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Registrar Pago" maxWidth="560px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Banner informativo de imputación y saldo */}
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1.5px solid #bbf7d0',
            padding: '14px 18px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div>
            <p style={{ fontSize: '13px', color: '#166534', fontWeight: 600, margin: 0 }}>
              {deudaConcepto ? `Imputado a deuda: ${deudaConcepto}` : `Proveedor: ${proveedorNombre}`}
            </p>
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#14532d', marginTop: '4px', margin: 0 }}>
              Saldo Pendiente: ${saldoMaximo.toLocaleString()}
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Selector de Medios de Pago */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            Forma de Pago *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
            {medios.map(m => {
              const isSelected = medioPago === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMedioPago(m.key)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #059669' : '1.5px solid #e2e8f0',
                    backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                    color: isSelected ? '#1e40af' : '#374151',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '13px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Monto a Pagar */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>
              Monto a Pagar ($) *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
              <Clock size={13} />
              <span>Fecha y hora: Ahora (automático)</span>
            </div>
          </div>
          <input
            type="number"
            step="0.01"
            max={saldoMaximo}
            required
            autoFocus
            placeholder={`0.00 (Máximo: $${saldoMaximo.toLocaleString()})`}
            value={monto}
            onChange={e => handleMontoChange(e.target.value)}
            onWheel={e => e.currentTarget.blur()}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '10px',
              border: isExcedido ? '2px solid #ef4444' : '2px solid #e2e8f0',
              backgroundColor: isExcedido ? '#fef2f2' : '#fcfdfd',
              fontSize: '20px',
              fontWeight: 800,
              color: isExcedido ? '#b91c1c' : '#0f172a',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'all 0.15s ease'
            }}
          />
        </div>

        {/* Referencia y Comentario */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Nº de Operación / Cheque (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. TRF-90214 o Chq. 8839"
              value={referencia}
              onChange={e => setReferencia(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 13px',
                borderRadius: '8px',
                border: '1.5px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Comentario / Nota (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Cuota 1 de 2"
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 13px',
                borderRadius: '8px',
                border: '1.5px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '11px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#4b5563',
              backgroundColor: '#f3f4f6',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            style={{
              padding: '11px 26px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              color: '#ffffff',
              backgroundColor: isSubmitDisabled ? '#8ea396' : '#16a34a',
              border: 'none',
              cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
              boxShadow: isSubmitDisabled ? 'none' : '0 2px 4px rgba(22, 163, 74, 0.25)',
              opacity: isSubmitDisabled ? 0.75 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            {loading ? 'Registrando...' : 'Confirmar Pago'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};
