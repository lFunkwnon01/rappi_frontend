import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";
import { dashboard as dashboardApi, tokenStore, ApiError, type DashboardSummary, type OrderStatus, type OrderOrigin } from "@/shared/api/client";
import { STATUS_COLOR, STATUS_LABEL } from "@/shared/types";
import { formatPEN } from "@/shared/utils/format";
import { Activity, CheckCircle2, Clock, DollarSign } from "lucide-react";

const STATUS_COLORS_HEX: Record<OrderStatus, string> = {
  PAYMENT_PENDING: "#F59E0B",
  PAYMENT_CONFIRMED: "#0EA5E9",
  PAYMENT_FAILED: "#EF4444",
  ORDER_CREATED: "#94A3B8",
  ORDER_RECEIVED: "#F59E0B",
  COOKED: "#F97316",
  PACKED: "#EAB308",
  DELIVERED: "#3B82F6",
  COMPLETED: "#10B981",
  CANCELLED: "#9CA3AF",
};

const ALL_STATUSES: OrderStatus[] = [
  "PAYMENT_PENDING",
  "PAYMENT_CONFIRMED",
  "PAYMENT_FAILED",
  "ORDER_CREATED",
  "ORDER_RECEIVED",
  "COOKED",
  "PACKED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
];

export function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const s = await dashboardApi.get(tokenStore.get()!);
        if (cancelled) return;
        setSummary(s);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Error al cargar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    if (!summary) return null;
    const completed = summary.ordersByStatus["COMPLETED"] ?? 0;
    const totalRevenue = (summary.recentOrders ?? [])
      .filter((o) => o.status === "COMPLETED")
      .reduce((acc, o) => acc + o.total, 0);
    const total = summary.totalOrders;
    return {
      total,
      completed,
      totalRevenue,
      active: total - completed - (summary.ordersByStatus["CANCELLED"] ?? 0),
    };
  }, [summary]);

  const byStatus = useMemo(() => {
    if (!summary) return [];
    return ALL_STATUSES.map((s) => ({
      name: STATUS_LABEL[s],
      value: summary.ordersByStatus[s] ?? 0,
      color: STATUS_COLORS_HEX[s],
    })).filter((x) => x.value > 0);
  }, [summary]);

  const byOrigin = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "Web", value: summary.ordersByOrigin["WEB_POPEYES"] ?? 0, color: "#E4002B" },
      { name: "Rappi", value: summary.ordersByOrigin["RAPPI"] ?? 0, color: "#FF6B00" },
    ].filter((x) => x.value > 0);
  }, [summary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-popeyes-gray">
        <Loader2 className="h-5 w-5 animate-spin" /> Cargando dashboard…
      </div>
    );
  }

  if (error || !summary || !metrics) {
    return (
      <div className="card p-6 text-center text-red-600">
        {error || "No se pudo cargar el dashboard"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Dashboard</h1>
        <p className="text-sm text-popeyes-gray">
          Métricas y eventos en vivo de tu tienda.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Activity}
          label="Pedidos activos"
          value={metrics.active}
          color="text-popeyes-red"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Completados"
          value={metrics.completed}
          color="text-emerald-600"
        />
        <MetricCard
          icon={DollarSign}
          label="Ingresos (completados)"
          value={formatPEN(metrics.totalRevenue)}
          color="text-popeyes-orange"
        />
        <MetricCard
          icon={Clock}
          label="Total"
          value={metrics.total}
          color="text-popeyes-dark"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-display text-2xl">Pedidos por estado</h3>
          <div className="mt-3 h-64">
            {byStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {byStatus.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart text="Aún no hay pedidos" />
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display text-2xl">Origen de pedidos</h3>
          <div className="mt-3 h-64">
            {byOrigin.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byOrigin}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {byOrigin.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart text="Sin datos" />
            )}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="font-display text-2xl">Pedidos recientes</h3>
        {summary.recentOrders.length === 0 ? (
          <p className="mt-2 text-sm text-popeyes-gray">Sin pedidos aún.</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/5">
            {summary.recentOrders.slice(0, 5).map((o) => (
              <li key={o.orderId} className="flex items-center gap-3 py-2 text-sm">
                <span className="font-semibold">#{o.orderId.slice(-6).toUpperCase()}</span>
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS_HEX[o.status] }} />
                <span>{STATUS_LABEL[o.status]}</span>
                <span className="ml-auto text-xs text-popeyes-gray">
                  {new Date(o.createdAt).toLocaleString("es-PE")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-popeyes-gray">
          {label}
        </span>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className={`mt-2 font-display text-3xl ${color}`}>{value}</div>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-popeyes-gray">
      {text}
    </div>
  );
}
