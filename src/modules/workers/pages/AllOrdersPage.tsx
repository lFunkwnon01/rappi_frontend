import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/shared/stores/appStore";
import { STATUS_COLOR, STATUS_LABEL, WORKFLOW_SEQUENCE, STEP_LABEL } from "@/shared/types";
import { formatPEN, timeAgo } from "@/shared/utils/format";
import { Eye, ChevronRight, Filter } from "lucide-react";

export function AllOrdersPage() {
  const allOrders = useAppStore((s) => s.orders);
  const tasks = useAppStore((s) => s.tasks);
  const [filter, setFilter] = useState<string>("ALL");

  const orders = useMemo(
    () => [...allOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allOrders],
  );
  const filtered = useMemo(
    () => (filter === "ALL" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  const stepFor = (status: string) =>
    WORKFLOW_SEQUENCE.find((s) => STEP_LABEL[s] === STATUS_LABEL[status as keyof typeof STATUS_LABEL]) ??
    null;
  const pendingFor = (orderId: string) =>
    tasks.find((t) => t.orderId === orderId && t.status === "PENDING");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-display text-3xl">Todos los pedidos</h1>
          <p className="text-sm text-popeyes-gray">
            Vista global de los pedidos en el sistema.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Filter className="h-4 w-4 text-popeyes-gray" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="ALL">Todos los estados</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-popeyes-cream/50 text-left text-xs uppercase tracking-widest text-popeyes-gray">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Etapa actual</th>
              <th className="px-4 py-3">Hace</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {filtered.map((o) => {
              const pending = pendingFor(o.orderId);
              return (
                <tr key={o.orderId} className="hover:bg-popeyes-cream/30">
                  <td className="px-4 py-3 font-semibold">
                    #{o.orderId.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-3">{o.customerName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`chip border ${
                        o.origin === "RAPPI"
                          ? "border-orange-300 bg-orange-50 text-orange-700"
                          : "border-blue-300 bg-blue-50 text-blue-700"
                      }`}
                    >
                      {o.origin}
                    </span>
                  </td>
                  <td className="px-4 py-3">{o.items.length}</td>
                  <td className="px-4 py-3 font-bold text-popeyes-red">
                    {formatPEN(o.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip ${STATUS_COLOR[o.status]} border`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-popeyes-gray">
                    {pending ? STEP_LABEL[pending.stepName] : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-popeyes-gray">
                    {timeAgo(o.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/orders/${o.orderId}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-popeyes-red hover:underline"
                    >
                      <Eye className="h-3 w-3" /> Ver <ChevronRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-sm text-popeyes-gray"
                >
                  No hay pedidos que coincidan con el filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
