import React from 'react';
import { ModalWrapper } from './ModalWrapper';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Guía Rápida de PayTrack" maxWidth="560px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '15px', color: '#374151' }}>
        <div>
          <h4 style={{ fontWeight: 700, color: '#111827', marginBottom: '4px' }}> Empresas y Proveedores</h4>
          <p>
            En la barra izquierda ves a todos tus proveedores con el saldo que les debés. Hacé clic en cualquiera para ver sus facturas y remitos detallados.
          </p>
        </div>

        <div>
          <h4 style={{ fontWeight: 700, color: '#111827', marginBottom: '4px' }}> Remito vs Factura</h4>
          <p>
            Al cargar una deuda podés elegir si fue con <strong>Remito</strong> (etiqueta negra) o con <strong>Factura</strong> (etiqueta blanca), para saber exactamente con qué comprobante entró la mercadería.
          </p>
        </div>

        <div>
          <h4 style={{ fontWeight: 700, color: '#111827', marginBottom: '4px' }}> Registro de Pagos sin excedente</h4>
          <p>
            Hacé clic en el botón <strong>(+)</strong> de cualquier deuda para registrar un pago (transferencia, efectivo, débito o cheque). El sistema no te permitirá pagar más de lo que debés, cuidándote de errores al tipear.
          </p>
        </div>

        <div>
          <h4 style={{ fontWeight: 700, color: '#111827', marginBottom: '4px' }}> Filtro por Mes</h4>
          <p>
            Arriba podés navegar mes a mes para saber cuánto pagaste en cada período y ver el desglose en el botón <strong>Resumen de Pagos del Mes</strong>.
          </p>
        </div>

        <div style={{ textAlign: 'right', marginTop: '8px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px'
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};
