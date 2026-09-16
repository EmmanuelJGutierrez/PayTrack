import React, { useState, useEffect } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { fetchBackupInfo, getBackupDownloadUrl, restoreBackup } from '../../services/api';
import type { BackupInfo, RestoreResponse } from '../../types';
import {
  HardDrive,
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Database,
  RefreshCw
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BackupModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [info, setInfo] = useState<BackupInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<RestoreResponse | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const loadInfo = () => {
    setLoading(true);
    fetchBackupInfo()
      .then(setInfo)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadInfo();
      setSelectedFile(null);
      setRestoreSuccess(null);
      setRestoreError(null);
    }
  }, [isOpen]);

  const handleDownload = () => {
    const downloadUrl = getBackupDownloadUrl();
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setRestoreError(null);
      setRestoreSuccess(null);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) return;

    const confirmMsg =
      `¿Confirmás que deseás restaurar la copia "${selectedFile.name}"?\n\n` +
      `⚠️ ATENCIÓN: Todos los datos actuales serán reemplazados por los de esta copia de seguridad.`;

    if (!window.confirm(confirmMsg)) return;

    setRestoring(true);
    setRestoreError(null);
    setRestoreSuccess(null);

    try {
      const res = await restoreBackup(selectedFile);
      setRestoreSuccess(res);
      setSelectedFile(null);
      loadInfo();
      onSuccess();
    } catch (err: any) {
      setRestoreError(err.message || 'Error al restaurar la base de datos');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Copia de Seguridad y Respaldo de Datos" maxWidth="640px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Banner de Éxito al Restaurar */}
        {restoreSuccess && (
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <CheckCircle2 size={24} color="#16a34a" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#166534' }}>
                ¡Base de datos restaurada con éxito!
              </div>
              <div style={{ fontSize: '13px', color: '#15803d', marginTop: '2px' }}>
                Se cargaron {restoreSuccess.totalProveedores} empresas, {restoreSuccess.totalDeudas} deudas y {restoreSuccess.totalPagos} pagos.
              </div>
            </div>
          </div>
        )}

        {/* Banner de Error al Restaurar */}
        {restoreError && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              border: '1.5px solid #fca5a5',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#991b1b' }}>
                No se pudo restaurar la copia
              </div>
              <div style={{ fontSize: '13px', color: '#b91c1c', marginTop: '2px' }}>
                {restoreError}
              </div>
            </div>
          </div>
        )}

        {/* Tarjeta 1: Estado del Sistema */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px 18px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="#2563eb" />
              <span style={{ fontWeight: 800, fontSize: '14px', color: '#1f2937' }}>
                Estado Actual de tus Datos
              </span>
            </div>
            {info && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}
              >
                {info.tamanoFormateado}
              </span>
            )}
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', fontSize: '13px' }}>Consultando información...</p>
          ) : info ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>EMPRESAS</span>
                <strong style={{ fontSize: '18px', color: '#0f172a' }}>{info.totalProveedores}</strong>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>COMPROBANTES</span>
                <strong style={{ fontSize: '18px', color: '#0f172a' }}>{info.totalDeudas}</strong>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>PAGOS</span>
                <strong style={{ fontSize: '18px', color: '#0f172a' }}>{info.totalPagos}</strong>
              </div>
            </div>
          ) : (
            <p style={{ color: '#6b7280', fontSize: '13px' }}>No se pudo obtener información.</p>
          )}
        </div>

        {/* Tarjeta 2: Crear Copia de Seguridad */}
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '2px solid #bbf7d0',
            borderRadius: '12px',
            padding: '18px 20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <ShieldCheck size={22} color="#15803d" />
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#166534', margin: 0 }}>
              1. Guardar Copia de Seguridad
            </h4>
          </div>

          <p style={{ fontSize: '13px', color: '#166534', opacity: 0.9, lineHeight: 1.4, marginBottom: '14px' }}>
            Descarga un archivo seguro (<strong>.db</strong>) con todos tus proveedores, deudas y pagos. Podés guardarlo en un pendrive, Google Drive, OneDrive o enviártelo a tu correo personal.
          </p>

          <button
            onClick={handleDownload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#15803d',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#166534')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#15803d')}
          >
            <Download size={18} />
            Descargar Copia de Seguridad (.db)
          </button>
        </div>

        {/* Tarjeta 3: Restaurar Copia de Seguridad */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #e5e7eb',
            borderRadius: '12px',
            padding: '18px 20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Upload size={20} color="#374151" />
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1f2937', margin: 0 }}>
              2. Restaurar desde un Archivo de Copia
            </h4>
          </div>

          <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.4, marginBottom: '12px' }}>
            Si cambiaste de computadora o querés volver a un punto anterior, seleccioná el archivo <strong>.db</strong> que habías descargado previamente.
          </p>

          {/* Aviso preventivo en ámbar */}
          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12px',
              color: '#92400e',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '14px'
            }}
          >
            <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Atención:</strong> Al restaurar, se reemplazarán los datos actuales por los del archivo seleccionado. El sistema creará un respaldo de seguridad automático antes de proceder.
            </span>
          </div>

          {/* Selector de Archivo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="file"
              accept=".db,.sqlite,.bak"
              onChange={handleFileChange}
              style={{
                fontSize: '13px',
                color: '#374151'
              }}
            />

            <button
              onClick={handleRestore}
              disabled={!selectedFile || restoring}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: selectedFile ? '#dc2626' : '#9ca3af',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: selectedFile ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.15s ease'
              }}
            >
              {restoring ? <RefreshCw size={15} className="animate-spin" /> : <HardDrive size={15} />}
              {restoring ? 'Restaurando...' : 'Restaurar Base de Datos'}
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};


