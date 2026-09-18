import React, { useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { createDeuda } from '../../services/api';
import { AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  proveedorId: number;
  proveedorNombre: string;
}

export const AddDebtModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  proveedorId,
  proveedorNombre
}) => {
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [tipoComprobante, setTipoComprobante] = useState<'Remito' | 'Factura'>('Factura');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [fechaDeuda, setFechaDeuda] = useState(new Date().toISOString().split('T')[0]);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numMonto = parseFloat(monto);
    if (isNaN(numMonto) || numMonto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    if (!concepto.trim()) {
      setError('El concepto es obligatorio');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createDeuda(proveedorId, {
        monto: numMonto,
        concepto: concepto.trim(),
        tipoComprobante,
        numeroComprobante: numeroComprobante.trim() || undefined,
        fechaDeuda: new Date(fechaDeuda).toISOString(),
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento).toISOString() : undefined
      });
      setMonto('');
      setConcepto('');
      setNumeroComprobante('');
      setFechaVencimiento('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar deuda');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDiasVencimiento = (dias: number) => {
    const base = fechaDeuda ? new Date(fechaDeuda) : new Date();
    base.setDate(base.getDate() + dias);
    setFechaVencimiento(base.toISOString().split('T')[0]);
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Cargar Deuda — ${proveedorNombre}`} maxWidth="560px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Selector de Comprobante: Remito / Factura */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            Tipo de Comprobante *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setTipoComprobante('Remito')}
              style={{
                padding: '12px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '15px',
                backgroundColor: tipoComprobante === 'Remito' ? '#1a1a1a' : '#f3f4f6',
                color: tipoComprobante === 'Remito' ? '#ffffff' : '#374151',
                border: tipoComprobante === 'Remito' ? '2px solid #1a1a1a' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Remito
            </button>

            <button
              type="button"
              onClick={() => setTipoComprobante('Factura')}
              style={{
                padding: '12px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '15px',
                backgroundColor: tipoComprobante === 'Factura' ? '#ffffff' : '#f3f4f6',
                color: '#1a1a1a',
                border: tipoComprobante === 'Factura' ? '2.5px solid #1a1a1a' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Factura
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Concepto / Detalle de la Deuda *
          </label>
          <input
            type="text"
            required
            placeholder="Ej. Mantenimiento Anual, Mercadería semanal, etc."
            value={concepto}
            onChange={e => setConcepto(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: '8px',
              border: '1.5px solid #d1d5db',
              fontSize: '15px'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Monto ($) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '8px',
                border: '1.5px solid #d1d5db',
                fontSize: '16px',
                fontWeight: 700
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Nº de Comprobante
            </label>
            <input
              type="text"
              placeholder="Ej. 0001-000492"
              value={numeroComprobante}
              onChange={e => setNumeroComprobante(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '8px',
                border: '1.5px solid #d1d5db',
                fontSize: '15px'
              }}
            />
          </div>
        </div>

        {/* Fechas de Emisión y Vencimiento */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Fecha de Emisión
            </label>
            <input
              type="date"
              value={fechaDeuda}
              onChange={e => setFechaDeuda(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid #d1d5db',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Fecha de Vencimiento (opcional)
            </label>
            <input
              type="date"
              value={fechaVencimiento}
              onChange={e => setFechaVencimiento(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid #d1d5db',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Atajos rápidos de vencimiento */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Atajo:</span>
          <button
            type="button"
            onClick={() => handleSetDiasVencimiento(15)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            +15 días
          </button>
          <button
            type="button"
            onClick={() => handleSetDiasVencimiento(30)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            +30 días
          </button>
          {fechaVencimiento && (
            <button
              type="button"
              onClick={() => setFechaVencimiento('')}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                color: '#b91c1c',
                cursor: 'pointer'
              }}
            >
              Quitar vencimiento
            </button>
          )}
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
            disabled={loading || !monto || !concepto.trim()}
            style={{
              padding: '11px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              color: '#ffffff',
              backgroundColor: '#111827',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Guardando...' : 'Cargar Deuda'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};
