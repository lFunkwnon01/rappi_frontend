import { useAppStore } from "@/shared/stores/appStore";
import {
  STEP_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  type OrderStatus,
  type WorkflowStep,
} from "@/shared/types";
import { formatDateTime, formatPEN, timeAgo } from "@/shared/utils/format";
import { ChefHat, ClipboardCheck, Package, Truck, Hand } from "lucide-react";

const STEP_ICON: Record<WorkflowStep, typeof ChefHat> = {
  RECEIVE_ORDER: ClipboardCheck,
  COOK_ORDER: ChefHat,
  PACK_ORDER: Package,
  DELIVER_ORDER: Truck,
  CONFIRM_RECEPTION: Hand,
};

interface Props {
  step: WorkflowStep;
  emptyMessage?: string;
}

export function QueuePage({ step, emptyMessage }: Props) {
  const orders = useAppStore((s) => s.orders);
  const tasks = useAppStore((s) => s.tasks);
  const events = useAppStore((s) => s.events);
  const currentUser = useAppStore((s) => s.currentUser);
  const advanceOrder = useAppStore((s) => s.advanceOrder);

  const matchingTasks = tasks.filter(
    (t) => t.stepName === step && t.status === "PENDING",
  );
  const matchingOrderIds = new Set(matchingTasks.map((t) => t.orderId));
  const queue = orders
    .filter((o) => matchingOrderIds.has(o.orderId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const Icon = STEP_ICON[step];

  const handleAdvance = (orderId: string) => {
    if (!currentUser) return;
    advanceOrder(orderId, step, currentUser.userId);
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-popeyes-red/10 text-popeyes-red">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl">{STEP_LABEL[step]}</h1>
          <p className="text-sm text-popeyes-gray">
            {queue.length === 0
              ? emptyMessage ?? "No hay pedidos en esta etapa."
              : `${queue.length} pedido${queue.length !== 1 ? "s" : ""} en cola`}
          </p>
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="card p-8 text-center text-popeyes-gray">
          <Icon className="mx-auto h-10 w-10 opacity-30" />
          <p className="mt-2">Todo al día. ☕</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {queue.map((o) => {
            const lastEvent = events
              .filter((e) => e.orderId === o.orderId)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
            return (
              <article key={o.orderId} className="card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display text-2xl">
                      #{o.orderId.slice(-6).toUpperCase()}
                    </div>
                    <div className="text-xs text-popeyes-gray">
                      {o.customerName} · {timeAgo(o.createdAt)}
                    </div>
                  </div>
                  <span className={`chip ${STATUS_COLOR[o.status as OrderStatus]} border`}>
                    {STATUS_LABEL[o.status as OrderStatus]}
                  </span>
                </div>

                <ul className="mt-3 space-y-1 text-sm">
                  {o.items.map((i) => (
                    <li key={i.productId} className="flex justify-between">
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
                  <span className="text-popeyes-gray">
                    {o.deliveryAddress}
                  </span>
                  <span className="font-bold text-popeyes-red">
                    {formatPEN(o.total)}
                  </span>
                </div>

                {lastEvent && (
                  <div className="mt-2 text-xs text-popeyes-gray">
                    Última actualización: {STATUS_LABEL[lastEvent.status]} ·{" "}
                    {formatDateTime(lastEvent.createdAt)}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleAdvance(o.orderId)}
                  className="btn-primary mt-4 w-full"
                >
                  {step === "RECEIVE_ORDER" && "Recibir pedido"}
                  {step === "COOK_ORDER" && "Marcar como cocinado"}
                  {step === "PACK_ORDER" && "Marcar como empacado"}
                  {step === "DELIVER_ORDER" && "Marcar como entregado"}
                  {step === "CONFIRM_RECEPTION" && "Confirmar recepción"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
