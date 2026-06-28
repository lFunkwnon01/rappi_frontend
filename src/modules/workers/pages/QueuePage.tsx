import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { tasks as tasksApi, orders as ordersApi, tokenStore, ApiError, type WorkflowTask, type Order } from "@/shared/api/client";
import { useAppStore } from "@/shared/stores/appStore";
import { formatPEN, timeAgo } from "@/shared/utils/format";
import { STATUS_COLOR, STATUS_LABEL, type WorkflowStep } from "@/shared/types";

const STEP_LABEL: Record<WorkflowStep, string> = {
  RECEIVE_ORDER: "Recibir pedido",
  COOK_ORDER: "Cocinar",
  PACK_ORDER: "Empacar",
  DELIVER_ORDER: "Entregar",
  CONFIRM_RECEPTION: "Confirmar recepción",
};

interface Props {
  step: WorkflowStep;
  emptyMessage?: string;
}

export function QueuePage({ step, emptyMessage }: Props) {
  const currentUser = useAppStore((s) => s.currentUser);
  const token = tokenStore.get() ?? "";
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [orders, setOrders] = useState<Record<string, Order>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await tasksApi.list(token, { status: "PENDING" });
        if (cancelled) return;
        setTasks(list);
        // Cargar las órdenes correspondientes
        const orderMap: Record<string, Order> = {};
        for (const t of list) {
          try {
            const o = await ordersApi.get(t.orderId, token);
            if (cancelled) return;
            orderMap[o.orderId] = o;
          } catch {
            // ignore
          }
        }
        if (!cancelled) setOrders(orderMap);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Error al cargar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  // Polling de orders (status cambia)
  useEffect(() => {
    if (!token || tasks.length === 0) return;
    const orderIds = tasks.map((t) => t.orderId);
    const interval = setInterval(async () => {
      const updates: Record<string, Order> = {};
      for (const id of orderIds) {
        try {
          const o = await ordersApi.get(id, token);
          updates[id] = o;
        } catch {
          // ignore
        }
      }
      if (Object.keys(updates).length > 0) {
        setOrders((prev) => ({ ...prev, ...updates }));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [token, tasks]);

  const matchingTasks = useMemo(
    () => tasks.filter((t) => t.stepName === step),
    [tasks, step],
  );

  const handleAdvance = async (task: WorkflowTask) => {
    if (!token || actionInProgress) return;
    // Validación de rol en frontend (el backend ya valida)
    if (currentUser && currentUser.role !== "ADMIN" && currentUser.role !== task.requiredRole) {
      setError(`Tu rol (${currentUser.role}) no puede completar esta tarea (requiere ${task.requiredRole})`);
      return;
    }
    setActionInProgress(task.taskId);
    try {
      await tasksApi.complete(task.taskId, token);
      // Refetch
      const list = await tasksApi.list(token, { status: "PENDING" });
      setTasks(list);
      // Refetch del order
      try {
        const o = await ordersApi.get(task.orderId, token);
        setOrders((prev) => ({ ...prev, [o.orderId]: o }));
      } catch {
        // ignore
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al completar");
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-popeyes-gray">
        <Loader2 className="h-5 w-5 animate-spin" /> Cargando cola…
      </div>
    );
  }

  if (error) {
    return <div className="card p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-popeyes-red/10 text-popeyes-red">
          <span className="font-display">⚡</span>
        </div>
        <div>
          <h1 className="font-display text-3xl">{STEP_LABEL[step]}</h1>
          <p className="text-sm text-popeyes-gray">
            {matchingTasks.length === 0
              ? emptyMessage ?? "No hay pedidos en esta etapa."
              : `${matchingTasks.length} pedido${matchingTasks.length !== 1 ? "s" : ""} en cola`}
          </p>
        </div>
      </div>

      {matchingTasks.length === 0 ? (
        <div className="card p-8 text-center text-popeyes-gray">
          Todo al día. ☕
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {matchingTasks.map((t) => {
            const o = orders[t.orderId];
            if (!o) return null;
            return (
              <article key={t.taskId} className="card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display text-2xl">
                      #{o.orderId.slice(-6).toUpperCase()}
                    </div>
                    <div className="text-xs text-popeyes-gray">
                      {o.customerName} · {timeAgo(o.createdAt)}
                    </div>
                  </div>
                  <span className={`chip ${STATUS_COLOR[o.status]} border`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                </div>

                <ul className="mt-3 space-y-1 text-sm">
                  {o.items.map((i, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>
                        {i.quantity}× {i.name}
                      </span>
                      <span className="text-popeyes-gray">
                        {formatPEN(i.price * i.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3 text-sm">
                  <span className="text-popeyes-gray">{o.deliveryAddress}</span>
                  <span className="font-bold text-popeyes-red">
                    {formatPEN(o.total)}
                  </span>
                </div>

                <div className="mt-2 text-xs text-popeyes-gray">
                  Pago: <strong>{o.paymentMethod}</strong>
                  {o.origin === "RAPPI" && " · Origen: RAPPI"}
                </div>

                <button
                  type="button"
                  onClick={() => handleAdvance(t)}
                  disabled={actionInProgress === t.taskId}
                  className="btn-primary mt-4 w-full"
                >
                  {actionInProgress === t.taskId ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Procesando…
                    </>
                  ) : step === "RECEIVE_ORDER" ? (
                    "Recibir pedido"
                  ) : step === "COOK_ORDER" ? (
                    "Marcar como cocinado"
                  ) : step === "PACK_ORDER" ? (
                    "Marcar como empacado"
                  ) : step === "DELIVER_ORDER" ? (
                    "Marcar como entregado"
                  ) : (
                    "Confirmar recepción"
                  )}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
