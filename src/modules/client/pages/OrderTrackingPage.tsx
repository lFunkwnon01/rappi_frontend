import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  ChevronLeft,
  Hand,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  orders as ordersApi,
  tasks as tasksApi,
  tokenStore,
  ApiError,
  type Order,
  type OrderStatus,
  type OrderEvent,
  type WorkflowTask,
} from "@/shared/api/client";
import { useAppStore } from "@/shared/stores/appStore";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  STEP_LABEL,
  WORKFLOW_SEQUENCE,
  type WorkflowStep,
} from "@/shared/types";
import { formatDateTime, timeAgo } from "@/shared/utils/format";

const STATUS_TO_STEP_INDEX: Record<OrderStatus, number> = {
  PAYMENT_PENDING: -2,
  PAYMENT_CONFIRMED: -1,
  PAYMENT_FAILED: -2,
  ORDER_CREATED: -1,
  ORDER_RECEIVED: 0,
  COOKED: 1,
  PACKED: 2,
  DELIVERED: 3,
  COMPLETED: 4,
  CANCELLED: -3,
};

export function OrderTrackingPage() {
  const { orderId = "" } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  const currentUser = useAppStore((s) => s.currentUser);
  const token = tokenStore.get() ?? "";

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const o = await ordersApi.get(orderId, token);
        if (cancelled) return;
        setOrder(o);
        // Cargar también las tareas (para historial)
        try {
          const t = await tasksApi.list(token, { orderId });
          if (!cancelled) setTasks(t);
        } catch {
          // ignore
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Error al cargar");
        setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [orderId, token]);

  // Polling cada 5 segundos
  useEffect(() => {
    if (!orderId || !token) return;
    const interval = setInterval(async () => {
      try {
        const o = await ordersApi.get(orderId, token);
        setOrder(o);
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [orderId, token]);

  // Reconstruir events desde las tareas
  const eventsFromTasks = (): OrderEvent[] =>
    tasks
      .filter((t) => t.completedAt)
      .map((t) => ({
        tenantId: t.tenantId,
        eventId: `evt-${t.taskId}`,
        orderId: t.orderId,
        storeId: t.storeId,
        eventType: t.stepName,
        status: STATUS_TO_STEP_FROM_STEP(t.stepName),
        createdAt: t.completedAt ?? t.startedAt ?? new Date().toISOString(),
        metadata: { completedBy: t.completedBy },
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const handleConfirmReception = async () => {
    if (!currentUser) return;
    // Buscar la tarea de CONFIRM_RECEPTION para este order
    const myTask = tasks.find(
      (t) => t.stepName === "CONFIRM_RECEPTION" && t.status === "PENDING",
    );
    if (!myTask) {
      setError("No hay tarea de confirmación pendiente");
      return;
    }
    setActionInProgress(true);
    try {
      await tasksApi.complete(myTask.taskId, token);
      // Refetch
      const o = await ordersApi.get(orderId, token);
      setOrder(o);
      const t = await tasksApi.list(token, { orderId });
      setTasks(t);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al confirmar");
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-popeyes-red" />
        <p className="mt-2 text-popeyes-gray">Cargando pedido…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <p className="mt-2 text-red-600">{error || "Pedido no encontrado"}</p>
        <Link to="/" className="btn-primary mt-4">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_TO_STEP_INDEX[order.status];
  const isFinal = order.status === "COMPLETED";
  const isCancelled = order.status === "CANCELLED" || order.status === "PAYMENT_FAILED";
  const isClient =
    currentUser?.role === "CLIENT" && order.customerId === currentUser.userId;
  const canConfirm = isClient && order.status === "DELIVERED";

  // Eventos: priorizar el status actual como "evento" principal, complementado con tasks
  const allEvents = events.length > 0 ? events : eventsFromTasks();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm font-semibold text-popeyes-gray hover:text-popeyes-red"
      >
        <ChevronLeft className="h-4 w-4" /> Volver
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
        <span className="flex items-center gap-1">
          💳 {order.paymentMethod}
        </span>
      </div>

      {isCancelled ? (
        <section className="card mt-6 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
            <div>
              <h3 className="font-display text-2xl text-red-600">
                {order.status === "PAYMENT_FAILED" ? "Pago rechazado" : "Pedido cancelado"}
              </h3>
              <p className="text-sm text-popeyes-gray">
                {order.status === "PAYMENT_FAILED"
                  ? "Tu pago no fue procesado. Si fue un error, intenta crear el pedido de nuevo."
                  : "Este pedido fue cancelado (por timeout o por el usuario)."}
              </p>
            </div>
          </div>
        </section>
      ) : (
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
                    {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{STEP_LABEL[step]}</div>
                    <div className="text-xs text-popeyes-gray">
                      {done ? "Completado" : current ? "En curso…" : "Pendiente"}
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
                onClick={handleConfirmReception}
                disabled={actionInProgress}
                className="btn-primary mt-3"
              >
                {actionInProgress ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Confirmando…
                  </>
                ) : (
                  "Confirmar recepción"
                )}
              </button>
            </div>
          )}
        </section>
      )}

      <section className="card mt-6 p-6">
        <h3 className="font-display text-2xl">Tu pedido</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between">
              <span>
                {i.quantity}× {i.name}
              </span>
              <span className="font-semibold">S/. {(i.price * i.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-black/5 pt-3 text-base font-bold">
          <span>Total</span>
          <span className="text-popeyes-red">S/. {order.total.toFixed(2)}</span>
        </div>
      </section>

      {allEvents.length > 0 && (
        <section className="card mt-6 p-6">
          <h3 className="font-display text-2xl">Historial de eventos</h3>
          <ol className="relative mt-4 space-y-4 border-l-2 border-black/10 pl-4">
            {allEvents.map((e) => (
              <li key={e.eventId} className="relative">
                <span className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-popeyes-red" />
                <div className="font-semibold">{STATUS_LABEL[e.status]}</div>
                <div className="text-xs text-popeyes-gray">
                  {formatDateTime(e.createdAt)} ·{" "}
                  {(e.metadata?.completedBy as string) ?? "Sistema"}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function STATUS_TO_STEP_FROM_STEP(step: WorkflowStep): OrderStatus {
  switch (step) {
    case "RECEIVE_ORDER":
      return "ORDER_RECEIVED";
    case "COOK_ORDER":
      return "COOKED";
    case "PACK_ORDER":
      return "PACKED";
    case "DELIVER_ORDER":
      return "DELIVERED";
    case "CONFIRM_RECEPTION":
      return "COMPLETED";
  }
}
