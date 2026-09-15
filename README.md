# PayTrack — Sistema de Gestión de Proveedores y Pagos

Aplicación de escritorio offline para el seguimiento visual de deudas, remitos, facturas y pagos a proveedores.

Diseñado específicamente para reemplazar el uso de planillas Excel dispersas y evitar cálculos manuales a fin de mes, con accesibilidad directa, botones grandes y validación estricta para evitar pagos excedentes.

---

## 🏛️ Arquitectura

- **Frontend:** React + TypeScript + Vite (inspirado en Material Design / Figma con paleta cálida neutra y tipografía accesible).
- **Backend:** .NET 10 Minimal API (diseñado para compilarse como sidecar self-contained single-file).
- **Persistencia:** SQLite local vía Entity Framework Core con auto-creación y migraciones en `%APPDATA%/PayTrack/paytrack.db`.
- **Desktop Shell:** Tauri para empaquetar todo en un ejecutable único sin dependencias externas para el usuario final.

---

## 📁 Estructura del Proyecto

```
PayTrack/
├── backend/
│   ├── PayTrack.Api/
│   │   ├── Data/             # PayTrackDbContext (SQLite + EF Core)
│   │   ├── Models/           # Proveedor, Deuda (Remito/Factura), Pago
│   │   ├── Services/         # ProveedorEstadoService (semáforos y cálculos server-side)
│   │   ├── Program.cs        # Endpoints REST y seed data inicial (Gamma Corp, Alfa, etc.)
│   │   └── PayTrack.Api.csproj
│   └── PayTrack.slnx
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── badges/       # ComprobanteBadge (Remito negro / Factura blanco)
│   │   │   ├── debts/        # DebtTable (tarjeta idéntica al diseño de Figma)
│   │   │   ├── layout/       # Header con selector mensual y acciones
│   │   │   ├── modals/       # AddProvider, AddDebt, AddPayment, History, MonthlySummary
│   │   │   └── providers/    # ProviderSidebar con buscador y badges de saldo
│   │   ├── services/         # api.ts (cliente HTTP tipado)
│   │   ├── types/            # TypeScript interfaces
│   │   ├── App.tsx           # Vista principal Master-Detail
│   │   └── index.css         # Tokens de diseño y estilos globales
│   ├── package.json
│   └── vite.config.ts
├── src-tauri/                # Configuración de empaquetado de escritorio
│   └── tauri.conf.json
└── README.md
```

---

## 🚀 Cómo ejecutar en desarrollo

### 1. Iniciar Backend (.NET)
En una terminal:
```bash
cd backend/PayTrack.Api
dotnet run --urls=http://localhost:5177
```
La base SQLite se crea automáticamente en `%APPDATA%/PayTrack/paytrack.db` y carga los datos de prueba (idénticos a los del mock de Figma).

### 2. Iniciar Frontend (Vite)
En otra terminal:
```bash
cd frontend
npm install
npm run dev
```
Abre en tu navegador en: [http://localhost:5173](http://localhost:5173).

---

## ✨ Características Principales

1. **Pantalla única (Master-Detail):** Directorio de empresas a la izquierda y deudas del proveedor seleccionado a la derecha.
2. **Cálculo automático de porcentajes y semáforo:**
   - 🟢 Verde: 100% saldado.
   - 🟡 Amarillo: 50% - 99% saldado.
   - 🔴 Rojo: < 50% saldado.
3. **Validación estricta anti-excedente:** No permite cargar pagos mayores a la deuda pendiente (`PAGO_EXCEDE_SALDO`), con botón de 1-clic para *"Pagar Total"*.
4. **Diferenciación Remito / Factura:** Chips visuales de alto contraste (Remito negro, Factura blanca con borde negro).
5. **Resumen de Pagos del Mes:** Reemplaza la calculadora del Excel sumando automáticamente el total del mes desglosado por Efectivo, Transferencia, Débito y Cheque.
