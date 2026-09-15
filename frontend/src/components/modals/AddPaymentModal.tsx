import React, { useState, useEffect } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { createPago } from '../../services/api';

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
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().slice(0, 16));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMonto('');
      setReferencia('');
      setComentario('');
      setError(null);
      setFechaPago(new Date().toISOString().slice(0, 16));
    }
  }, [isOpen]);

  const handlePagarTotal = () => {
    setMonto(saldoMaximo.toString());
    setError(null);
  };

  const handleMontoChange = (val: string) => {
    setMonto(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > saldoMaximo) {
      setError(`El monto no puede superar el saldo adeudado ($${saldoMaximo.toLocaleString()}). No se permiten pagos excedentes.`);
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numMonto = parseFloat(monto);

    if (isNaN(numMonto) || numMonto <= 0) {
      setError('Ingrese un monto válido mayor a 0');
      return;
    }

    if (numMonto > saldoMaximo) {
      setError(`El monto ($${numMonto.toLocaleString()}) no puede superar el saldo pendiente ($${saldoMaximo.toLocaleString()}).`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createPago(proveedorId, {
        monto: numMonto,
        medioPago,
        referencia: referencia.trim() || undefined,
        comentario: comentario.trim() || undefined,
        fechaPago: new Date(fechaPago).toISOString(),
        deudaId
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar pago');
    } finally {
      setLoading(false);
    }
  };

  const medios: Array<{ key: typeof medioPago; label: string; icon: string }> = [
    { key: 'Transferencia', label: 'Transferencia', icon: '🏦' },
    { key: 'Efectivo', label: 'Efectivo', icon: '💵' },
    { key: 'Debito', label: 'Tarjeta Débito', icon: '💳' },
    { key: 'Cheque', label: 'Cheque', icon: '📄' },
    { key: 'Otro', label: 'Otro', icon: '🔄' }
  ];

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Registrar Pago">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Banner informativo de imputación y saldo */}
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '14px 16px',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <p style={{ fontSize: '13px', color: '#1e40af', fontWeight: 600 }}>
              {deudaConcepto ? `Imputado a deuda: ${deudaConcepto}` : `Proveedor: ${proveedorNombre}`}
            </p>
            <p style={{ fontSize: '16px', fontWeight: 800, color: '#1e3a8a', marginTop: '2px' }}>
              Saldo Pendiente: ${saldoMaximo.toLocaleString()}
            </p>
          </div>

          <button
            type="button"
            onClick={handlePagarTotal}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            Pagar Total
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Selector de Medios de Pago */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            Medio de Pago *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            {medios.map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMedioPago(m.key)}
                style={{
                  padding: '12px 10px',
                  borderRadius: '10px',
                  border: medioPago === m.key ? '2px solid #2563eb' : '1.5px solid #e5e7eb',
                  backgroundColor: medioPago === m.key ? '#f0fdf4' : '#ffffff',
                  color: medioPago === m.key ? '#166534' : '#374151',
                  fontWeight: medioPago === m.key ? 700 : 500,
                  fontSize: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '20px' }}>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Monto a Pagar ($) *
            </label>
            <input
              type="number"
              step="0.01"
              max={saldoMaximo}
              required
              placeholder={`Máx: ${saldoMaximo}`}
              value={monto}
              onChange={e => handleMontoChange(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1.5px solid #d1d5db',
                fontSize: '18px',
                fontWeight: 700,
                color: '#111827'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Fecha y Hora del Pago
            </label>
            <input
              type="datetime-local"
              value={fechaPago}
              onChange={e => setFechaPago(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1.5px solid #d1d5db',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Nº de Operación / Cheque
            </label>
            <input
              type="text"
              placeholder="Ej. TRF-90214 o Chq. 8839"
              value={referencia}
              onChange={e => setReferencia(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1.5px solid #d1d5db',
                fontSize: '15px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Comentario / Nota
            </label>
            <input
              type="text"
              placeholder="Ej. Cuota 1 de 2"
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1.5px solid #d1d5db',
                fontSize: '15px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#4b5563',
              backgroundColor: '#f3f4f6'
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !monto || parseFloat(monto) <= 0 || parseFloat(monto) > saldoMaximo}
            style={{
              padding: '12px 26px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 700,
              color: '#ffffff',
              backgroundColor: '#16a34a',
              boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)'
            }}
          >
            {loading ? 'Procesando...' : 'Confirmar Pago'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};
