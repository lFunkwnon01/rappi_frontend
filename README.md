# Popeyes · Sistema de Gestión de Pedidos — Frontend

Frontend del proyecto final de **Cloud Computing (CS2032)** — Popeyes (Grupo 4).
Construido como SPA única con **Vite + React + TypeScript + TailwindCSS + Zustand**.

Pensado para deployar en **AWS Amplify** (cumple el requisito del enunciado).

## ✨ Lo que está incluido

- **Vista Cliente** (ruta `/`): home estilo Popeyes, carta, carrito, checkout, "Mis pedidos" con seguimiento en vivo del workflow.
- **Vista Trabajadores** (ruta `/admin`): panel interno con sidebar, dashboard con métricas (Recharts), cola de pedidos filtrada por rol/etapa, y acción de avanzar el flujo.
- **Auth simulada**: pantalla de login con selector visual de los 6 roles (no requiere contraseña — la autenticación real JWT la hace el backend en AWS).
- **Workflow completo** (5 etapas con patrón "Wait for Callback"):
  1. `RECEIVE_ORDER` (RESTAURANT_WORKER) → ORDER_RECEIVED
  2. `COOK_ORDER` (COOK) → COOKED
  3. `PACK_ORDER` (DISPATCHER) → PACKED
  4. `DELIVER_ORDER` (DELIVERY_DRIVER) → DELIVERED
  5. `CONFIRM_RECEPTION` (CLIENT) → COMPLETED
- **Simulación de avance automático**: botón en el sidebar que avanza el workflow cada 5s sin intervención humana (útil para demos).
- **Mocks realistas**: catálogo tipo Popeyes, 2 órdenes iniciales (WEB y RAPPI), 6 usuarios demo.
- **Multi-tenant**: el store ya respeta `tenantId` y `storeId` en el modelo (preparado para conectar al backend).
- **Persistencia local**: el estado se guarda en `localStorage`, así puedes recargar y mantener carrito/orden.

## 🚀 Cómo correrlo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera /dist para Amplify
npm run preview  # sirve /dist
```

## 👥 Usuarios demo (login → sin contraseña)

| Rol | Nombre | Email | Qué hace |
|-----|--------|-------|----------|
| `CLIENT` | María López | maria@cliente.pe | Pide comida y confirma recepción |
| `RESTAURANT_WORKER` | Carlos Recepción | carlos@popeyes.pe | Recibe pedidos |
| `COOK` | Juan Cocina | juan@popeyes.pe | Cocina |
| `DISPATCHER` | Ana Despacho | ana@popeyes.pe | Empaca |
| `DELIVERY_DRIVER` | Luis Reparto | luis@popeyes.pe | Entrega |
| `ADMIN` | Sofía Admin | admin@popeyes.pe | Ve todo + dashboard |

## 🧭 Rutas principales

| Ruta | Para quién | Qué hace |
|------|------------|----------|
| `/` | público | Home Popeyes |
| `/menu` | público | Carta con 12 productos |
| `/cart` | público | Carrito |
| `/checkout` | CLIENT | Confirmar pedido |
| `/orders` | CLIENT | Lista de mis pedidos |
| `/orders/:id` | público | Tracking en vivo |
| `/login` | público | Selector de rol |
| `/admin` | ADMIN | Dashboard con métricas |
| `/admin/all` | ADMIN | Tabla global de pedidos |
| `/admin/kitchen` | COOK | Cola de cocina |
| `/admin/pack` | DISPATCHER | Cola de empaque |
| `/admin/deliver` | DELIVERY_DRIVER | Cola de reparto |
| `/admin/receive` | CLIENT | Confirmar recepción |

## 🔄 Demo del flujo end-to-end (5 minutos)

1. Login como **María (CLIENT)** → `/menu` → agrega 2-3 productos → checkout.
2. En otra pestaña (o la misma), login como **Sofía (ADMIN)** → `/admin` activa el toggle **"Simular avance auto"** en el sidebar.
3. Mira cómo el pedido va pasando por: ORDER_RECEIVED → COOKED → PACKED → DELIVERED.
4. Vuelve a la pestaña del CLIENT → abre "Mis pedidos" → verás el timeline animado + el botón **"Confirmar recepción"** cuando esté en DELIVERED.
5. Click → estado COMPLETED. Aparece en el dashboard del ADMIN.

## 🧱 Arquitectura

```
src/
├── shared/
│   ├── components/         ProtectedRoute
│   ├── mocks/              data.ts (catálogo, usuarios, órdenes)
│   ├── stores/             appStore.ts (Zustand + persist)
│   ├── types/              index.ts (modelo según PDF)
│   └── utils/              format.ts
├── modules/
│   ├── auth/               LoginPage
│   ├── client/             Home, Menu, Cart, Checkout, Orders, Tracking
│   └── workers/            Layout, Dashboard, Queue (por rol), AllOrders
├── App.tsx                 Router principal
└── main.tsx
```

## 🔌 Conexión con el backend (próximo paso)

El `appStore.ts` está pensado para que reemplazar los mocks por llamadas reales sea directo. Las funciones a sustituir son:

| Mock | Endpoint real (backend AWS) |
|------|------------------------------|
| `placeOrder` | `POST /orders` (vía API Gateway + Lambda) |
| `advanceOrder` | `POST /tasks/{id}/complete` (Step Functions Task Token) |
| `addToCart` / cart | solo frontend, no toca backend |
| login | `POST /auth/login` con JWT (Lambda Authorizer) |

Los tipos en `src/shared/types/index.ts` ya reflejan el modelo de datos del backend (User, Store, Product, Order, OrderItem, WorkflowTask, OrderEvent).

## 📦 Deploy en AWS Amplify

```bash
# Opción 1: conectar repo de GitHub en consola Amplify
# Opción 2: amplify cli
npm i -g @aws-amplify/cli
amplify init
amplify add hosting
amplify publish
```

`build` ya está configurado como `npm run build` y `dist/` como artefact dir.
