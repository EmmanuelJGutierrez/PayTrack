import React, { useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { createProveedor } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddProviderModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await createProveedor({
        nombre: nombre.trim(),
        contacto: contacto.trim() || undefined,
        notas: notas.trim() || undefined
      });
      setNombre('');
      setContacto('');
      setNotas('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar proveedor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Nuevo Proveedor / Empresa">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Nombre del Proveedor / Razón Social *
          </label>
          <input
            type="text"
            required
            placeholder="Ej. Distribuidora Central S.R.L."
            value={nombre}
            onChange={e => setNombre(e.target.value)}
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
            Contacto (Teléfono, WhatsApp, Email)
          </label>
          <input
            type="text"
            placeholder="Ej. +54 11 4455-6677 / pedidos@central.com"
            value={contacto}
            onChange={e => setContacto(e.target.value)}
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
            Libreta de Notas (Anotador)
          </label>
          <textarea
            rows={3}
            placeholder="Ej. Pasa a cobrar los martes. Pagar por transferencia. CBU: 00000031000..."
            value={notas}
            onChange={e => setNotas(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1.5px solid #d1d5db',
              fontSize: '15px',
              resize: 'vertical'
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
            disabled={loading || !nombre.trim()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 700,
              color: '#ffffff',
              backgroundColor: '#2563eb',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
          >
            {loading ? 'Guardando...' : 'Guardar Proveedor'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};
