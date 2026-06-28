import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  ChevronLeft,
  Hand,
} from "lucide-react";
import {
  useAppStore,
  useOrderEvents,
  useOrderStatus,
} from "@/shared/stores/appStore";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  STEP_LABEL,
  WORKFLOW_SEQUENCE,
  type OrderStatus,
} from "@/shared/types";
import { formatDateTime, formatPEN, timeAgo } from "@/shared/utils/format";

const STATUS_TO_STEP_INDEX: Record<OrderStatus, number> = {
  PAYMENT_PENDING: -2,        // antes del workflow
  PAYMENT_CONFIRMED: -1,      // pago OK, workflow por iniciar
  PAYMENT_FAILED: -2,         // falló el pago
  ORDER_CREATED: -1,          // paso inicial del workflow
  ORDER_RECEIVED: 0,
  COOKED: 1,
  PACKED: 2,
  DELIVERED: 3,
  COMPLETED: 4,
  CANCELLED: -3,              // cancelado (no avanza)
};

export function OrderTrackingPage() {
  const { orderId = "" } = useParams();
  const order = useAppStore((s) =>
    s.orders.find((o) => o.orderId === orderId),
  );
  const status = useOrderStatus(orderId);
  const events = useOrderEvents(orderId);
  const currentUser = useAppStore((s) => s.currentUser);
  const advanceOrder = useAppStore((s) => s.advanceOrder);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [orderId]);

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-popeyes-gray">Pedido no encontrado.</p>
        <Link to="/orders" className="btn-primary mt-4">
          Volver a mis pedidos
        </Link>
      </div>
    );
  }

  const currentStepIndex = status
    ? STATUS_TO_STEP_INDEX[status]
    : -1;
  const isFinal = status === "COMPLETED";
  const isClient = currentUser?.role === "CLIENT";
  const canConfirm = isClient && status === "DELIVERED" && order.customerId === currentUser?.userId;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1 text-sm font-semibold text-popeyes-gray hover:text-popeyes-red"
      >
        <ChevronLeft className="h-4 w-4" /> Mis pedidos
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl">
          Pedido #{order.orderId.slice(-6).toUpperCase()}
        </h1>
        <span className={`chip ${STATUS_COLOR[order.status]} border`}>
          {STATUS_LABEL[order.status]}
        </span>
        {order.origin === "RAPPI" && (
          <span className="chip border-orange-300 bg-orange-50 text-orange-700">
            Origen: RAPPI
          </span>
        )}
      </div>

      <div className="mt-1 flex flex-wrap gap-3 text-sm text-popeyes-gray">
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" /> {timeAgo(order.createdAt)}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" /> {order.deliveryAddress}
        </span>
      </div>

      <section className="card mt-6 p-6">
        <h3 className="font-display text-2xl">Estado del pedido</h3>
        <ol className="mt-4 space-y-3">
          {WORKFLOW_SEQUENCE.map((step, i) => {
            const done = i <= currentStepIndex;
            const current = i === currentStepIndex + 1 && !isFinal;
            return (
              <li
                key={step}
                className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                  done
                    ? "border-emerald-200 bg-emerald-50/50"
                    : current
                      ? "border-popeyes-red bg-red-50 animate-pulse-slow"
                      : "border-black/5"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    done
                      ? "bg-emerald-500 text-white"
                      : current
                        ? "bg-popeyes-red text-white"
                        : "bg-black/5 text-popeyes-gray"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{STEP_LABEL[step]}</div>
                  <div className="text-xs text-popeyes-gray">
                    {done
                      ? "Completado"
                      : current
                        ? "En curso…"
                        : "Pendiente"}
                  </div>
                </div>
                {current && (
                  <span className="chip border-popeyes-red bg-popeyes-red text-white">
                    AHORA
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {canConfirm && (
          <div className="mt-4 rounded-xl border-2 border-popeyes-red bg-red-50 p-4">
            <p className="text-sm">
              <Hand className="mr-1 inline h-4 w-4 text-popeyes-red" />
              Tu pedido fue entregado. Confirma la recepción para cerrar el flujo.
            </p>
            <button
              type="button"
              onClick={() =>
                advanceOrder(order.orderId, "CONFIRM_RECEPTION", currentUser!.userId)
              }
              className="btn-primary mt-3"
            >
              Confirmar recepción
            </button>
          </div>
        )}
      </section>

      <section className="card mt-6 p-6">
        <h3 className="font-display text-2xl">Tu pedido</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {order.items.map((i) => (
            <li key={i.productId} className="flex justify-between">
              <span>
                {i.quantity}× {i.name}
              </span>
              <span className="font-semibold">
                {formatPEN(i.price * i.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-black/5 pt-3 text-base font-bold">
          <span>Total</span>
          <span className="text-popeyes-red">{formatPEN(order.total)}</span>
        </div>
      </section>

      <section className="card mt-6 p-6">
        <h3 className="font-display text-2xl">Historial de eventos</h3>
        <ol className="relative mt-4 space-y-4 border-l-2 border-black/10 pl-4">
          {events.map((e) => (
            <li key={e.eventId} className="relative">
              <span className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-popeyes-red" />
              <div className="font-semibold">{STATUS_LABEL[e.status]}</div>
              <div className="text-xs text-popeyes-gray">
                {formatDateTime(e.createdAt)} ·{" "}
                {e.metadata?.completedBy as string ?? "Sistema"}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
