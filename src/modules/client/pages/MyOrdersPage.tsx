import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Package, Loader2, MapPin } from "lucide-react";
import { orders as ordersApi, tokenStore, ApiError, type Order } from "@/shared/api/client";
import { useAppStore } from "@/shared/stores/appStore";
import { STATUS_COLOR, STATUS_LABEL } from "@/shared/types";
import { formatPEN, timeAgo } from "@/shared/utils/format";

const STORE_NAMES: Record<string, string> = {
  "store-001": "Popeyes Miraflores",
  "store-002": "Popeyes Surco",
  "store-003": "Popeyes Barranco",
};

export function MyOrdersPage() {
  const { storeId = "" } = useParams();
  const currentUser = useAppStore((s) => s.currentUser);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await ordersApi.list(tokenStore.get(), { storeId });
        if (cancelled) return;
        setOrders(list);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Error al cargar pedidos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [storeId, currentUser?.userId]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-popeyes-gray">
            <MapPin className="h-4 w-4" />
            <span>{STORE_NAMES[storeId] || storeId}</span>
          </div>
          <h1 className="font-display text-4xl">Mis pedidos</h1>
          <p className="text-sm text-popeyes-gray">
            Toca un pedido para ver su seguimiento en vivo.
          </p>
        </div>
        <Link to="/" className="text-sm font-semibold text-popeyes-red hover:underline">
          Cambiar sede
        </Link>
      </div>

      {error ? (
        <div className="card p-6 text-center text-red-600">{error}</div>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 p-12 text-popeyes-gray">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando pedidos…
        </div>
      ) : orders.length === 0 ? (
        <div className="card mt-8 p-8 text-center">
          <Package className="mx-auto h-10 w-10 text-popeyes-gray" />
          <p className="mt-2 text-popeyes-gray">Aún no tienes pedidos en esta sede.</p>
          <Link to={`/store/${storeId}/menu`} className="btn-primary mt-4">
            Ver la carta
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.orderId}
              to={`/orders/${o.orderId}`}
              className="card flex items-center gap-4 p-4 transition hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-popeyes-red/10 text-popeyes-red">
                <Package className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">#{o.orderId.slice(-6).toUpperCase()}</span>
                  <span className={`chip ${STATUS_COLOR[o.status]} border`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                  {o.origin === "RAPPI" && (
                    <span className="chip border-orange-300 bg-orange-50 text-orange-700">
                      RAPPI
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-popeyes-gray">
                  {o.customerName} · {timeAgo(o.createdAt)} · tienda: {o.storeId}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-popeyes-red">{formatPEN(o.total)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
