import { Navigate, Route, Routes } from "react-router-dom";
import { useAppStore } from "@/shared/stores/appStore";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { ClientNavBar, ClientFooter } from "@/modules/client/components/ClientNavBar";
import { StoresLandingPage } from "@/modules/client/pages/HomePage";
import { MenuPage } from "@/modules/client/pages/MenuPage";
import { CartPage } from "@/modules/client/pages/CartPage";
import { CheckoutPage } from "@/modules/client/pages/CheckoutPage";
import { MyOrdersPage } from "@/modules/client/pages/MyOrdersPage";
import { OrderTrackingPage } from "@/modules/client/pages/OrderTrackingPage";
import { LoginPage } from "@/modules/auth/pages/LoginPage";
import { WorkersLayout } from "@/modules/workers/components/WorkersLayout";
import { AdminDashboardPage } from "@/modules/workers/pages/AdminDashboardPage";
import { AllOrdersPage } from "@/modules/workers/pages/AllOrdersPage";
import { QueuePage } from "@/modules/workers/pages/QueuePage";

const WORKER_ROLES = [
  "RESTAURANT_WORKER",
  "COOK",
  "DISPATCHER",
  "DELIVERY_DRIVER",
  "CLIENT",
  "ADMIN",
] as const;

const ADMIN_ROLES = ["ADMIN"] as const;

function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-popeyes-cream">
      <ClientNavBar />
      <main className="min-h-[60vh]">{children}</main>
      <ClientFooter />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ClientLayout>
            <StoresLandingPage />
          </ClientLayout>
        }
      />

      {/* Rutas por tienda: /store/:storeId/* */}
      <Route
        path="/store/:storeId/menu"
        element={
          <ClientLayout>
            <MenuPage />
          </ClientLayout>
        }
      />
      <Route
        path="/store/:storeId/cart"
        element={
          <ClientLayout>
            <CartPage />
          </ClientLayout>
        }
      />
      <Route
        path="/store/:storeId/checkout"
        element={
          <ClientLayout>
            <ProtectedRoute allow={["CLIENT", "ADMIN"]}>
              <CheckoutPage />
            </ProtectedRoute>
          </ClientLayout>
        }
      />
      <Route
        path="/store/:storeId/orders"
        element={
          <ClientLayout>
            <MyOrdersPage />
          </ClientLayout>
        }
      />

      {/* Tracking de un pedido específico (no depende de tienda) */}
      <Route
        path="/orders/:orderId"
        element={
          <ClientLayout>
            <OrderTrackingPage />
          </ClientLayout>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allow={[...WORKER_ROLES]}>
            <WorkersLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <ProtectedRoute allow={[...ADMIN_ROLES]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="queue"
          element={
            <ProtectedRoute allow={[...ADMIN_ROLES]}>
              <QueuePage step="RECEIVE_ORDER" emptyMessage="No hay pedidos por recibir." />
            </ProtectedRoute>
          }
        />
        <Route
          path="all"
          element={
            <ProtectedRoute allow={[...ADMIN_ROLES]}>
              <AllOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="kitchen"
          element={
            <ProtectedRoute allow={["COOK", "ADMIN"]}>
              <QueuePage step="COOK_ORDER" emptyMessage="Cocina libre. Nada que cocinar." />
            </ProtectedRoute>
          }
        />
        <Route
          path="pack"
          element={
            <ProtectedRoute allow={["DISPATCHER", "ADMIN"]}>
              <QueuePage step="PACK_ORDER" emptyMessage="Nada para empacar." />
            </ProtectedRoute>
          }
        />
        <Route
          path="deliver"
          element={
            <ProtectedRoute allow={["DELIVERY_DRIVER", "ADMIN"]}>
              <QueuePage step="DELIVER_ORDER" emptyMessage="Sin entregas pendientes." />
            </ProtectedRoute>
          }
        />
        <Route
          path="receive"
          element={
            <ProtectedRoute allow={["CLIENT", "ADMIN"]}>
              <QueuePage
                step="CONFIRM_RECEPTION"
                emptyMessage="Ningún cliente ha confirmado aún."
              />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
