import React, { useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { createDeuda } from '../../services/api';

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
        fechaDeuda: new Date(fechaDeuda).toISOString()
      });
      setMonto('');
      setConcepto('');
      setNumeroComprobante('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar deuda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Cargar Deuda — ${proveedorNombre}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {error}
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
                padding: '14px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '16px',
                backgroundColor: tipoComprobante === 'Remito' ? '#1a1a1a' : '#f3f4f6',
                color: tipoComprobante === 'Remito' ? '#ffffff' : '#374151',
                border: tipoComprobante === 'Remito' ? '2px solid #1a1a1a' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>📦</span> Remito
            </button>

            <button
              type="button"
              onClick={() => setTipoComprobante('Factura')}
              style={{
                padding: '14px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '16px',
                backgroundColor: tipoComprobante === 'Factura' ? '#ffffff' : '#f3f4f6',
                color: '#1a1a1a',
                border: tipoComprobante === 'Factura' ? '2.5px solid #1a1a1a' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>📄</span> Factura
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
              padding: '12px 14px',
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
                padding: '12px 14px',
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
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1.5px solid #d1d5db',
                fontSize: '15px'
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Fecha del Comprobante
          </label>
          <input
            type="date"
            value={fechaDeuda}
            onChange={e => setFechaDeuda(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1.5px solid #d1d5db',
              fontSize: '15px'
            }}
          />
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
            disabled={loading || !monto || !concepto.trim()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 700,
              color: '#ffffff',
              backgroundColor: '#111827'
            }}
          >
            {loading ? 'Guardando...' : 'Cargar Deuda'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};
