import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Package, Clock } from "lucide-react";
import { useAppStore } from "@/shared/stores/appStore";
import { STATUS_COLOR, STATUS_LABEL } from "@/shared/types";
import { formatPEN, timeAgo } from "@/shared/utils/format";

export function MyOrdersPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const allOrders = useAppStore((s) => s.orders);

  const orders = useMemo(
    () =>
      [...allOrders]
        .filter((o) =>
          currentUser?.role === "CLIENT"
            ? o.customerId === currentUser.userId
            : true,
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allOrders, currentUser?.userId, currentUser?.role],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-4xl">Mis pedidos</h1>
      <p className="text-sm text-popeyes-gray">
        Toca un pedido para ver su seguimiento en vivo.
      </p>

      {orders.length === 0 ? (
        <div className="card mt-8 p-8 text-center">
          <Package className="mx-auto h-10 w-10 text-popeyes-gray" />
          <p className="mt-2 text-popeyes-gray">Aún no tienes pedidos.</p>
          <Link to="/menu" className="btn-primary mt-4">
            Hacer mi primer pedido
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
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
                  <span
                    className={`chip ${STATUS_COLOR[o.status]} border`}
                  >
                    {STATUS_LABEL[o.status]}
                  </span>
                  {o.origin === "RAPPI" && (
                    <span className="chip border-orange-300 bg-orange-50 text-orange-700">
                      RAPPI
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-popeyes-gray">
                  {o.items.length} producto{o.items.length !== 1 ? "s" : ""} ·{" "}
                  {o.deliveryAddress}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-popeyes-red">
                  {formatPEN(o.total)}
                </div>
                <div className="flex items-center justify-end gap-1 text-xs text-popeyes-gray">
                  <Clock className="h-3 w-3" /> {timeAgo(o.createdAt)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
