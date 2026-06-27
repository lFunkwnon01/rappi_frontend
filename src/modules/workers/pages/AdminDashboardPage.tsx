import { useMemo } from "react";
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
import { useAppStore } from "@/shared/stores/appStore";
import { STATUS_LABEL, type OrderStatus } from "@/shared/types";
import { formatPEN, timeAgo } from "@/shared/utils/format";
import { Activity, CheckCircle2, Clock, DollarSign } from "lucide-react";

const STATUS_COLORS_HEX: Record<OrderStatus, string> = {
  ORDER_CREATED: "#94A3B8",
  ORDER_RECEIVED: "#F59E0B",
  COOKED: "#F97316",
  PACKED: "#EAB308",
  DELIVERED: "#3B82F6",
  COMPLETED: "#10B981",
};

const ALL_STATUSES: OrderStatus[] = [
  "ORDER_CREATED",
  "ORDER_RECEIVED",
  "COOKED",
  "PACKED",
  "DELIVERED",
  "COMPLETED",
];

export function AdminDashboardPage() {
  const orders = useAppStore((s) => s.orders);
  const events = useAppStore((s) => s.events);

  const metrics = useMemo(() => {
    const active = orders.filter((o) => o.status !== "COMPLETED");
    const completed = orders.filter((o) => o.status === "COMPLETED");
    const totalRevenue = completed.reduce((acc, o) => acc + o.total, 0);
    const avgTime =
      completed.length === 0
        ? 0
        : completed.reduce((acc, o) => {
            const start = new Date(o.createdAt).getTime();
            const end = new Date(o.completedAt ?? o.updatedAt).getTime();
            return acc + (end - start) / 1000;
          }, 0) / completed.length;
    return {
      active: active.length,
      completed: completed.length,
      totalRevenue,
      avgTimeMin: Math.round(avgTime / 60),
    };
  }, [orders]);

  const byStatus = useMemo(() => {
    return ALL_STATUSES.map((s) => ({
      name: STATUS_LABEL[s],
      value: orders.filter((o) => o.status === s).length,
      color: STATUS_COLORS_HEX[s],
    })).filter((x) => x.value > 0);
  }, [orders]);

  const byOrigin = useMemo(() => {
    const web = orders.filter((o) => o.origin === "WEB").length;
    const rappi = orders.filter((o) => o.origin === "RAPPI").length;
    return [
      { name: "Web", value: web, color: "#E4002B" },
      { name: "Rappi", value: rappi, color: "#FF6B00" },
    ].filter((x) => x.value > 0);
  }, [orders]);

  const hourly = useMemo(() => {
    const buckets: Record<string, number> = {};
    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      const hour = `${d.getHours()}:00`;
      buckets[hour] = (buckets[hour] ?? 0) + 1;
    });
    return Object.entries(buckets)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [orders]);

  const recentEvents = events.slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Dashboard</h1>
        <p className="text-sm text-popeyes-gray">
          Métricas y eventos en vivo del sistema.
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
          label="Tiempo prom. (min)"
          value={metrics.avgTimeMin}
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
        <h3 className="font-display text-2xl">Pedidos por hora</h3>
        <div className="mt-3 h-64">
          {hourly.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#E4002B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="Sin pedidos aún" />
          )}
        </div>
      </section>

      <section className="card p-5">
        <h3 className="font-display text-2xl">Feed de eventos</h3>
        {recentEvents.length === 0 ? (
          <p className="mt-2 text-sm text-popeyes-gray">Sin eventos aún.</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/5">
            {recentEvents.map((e) => (
              <li key={e.eventId} className="flex items-center gap-3 py-2 text-sm">
                <span className="font-semibold">#{e.orderId.slice(-6).toUpperCase()}</span>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: STATUS_COLORS_HEX[e.status] }}
                />
                <span>{STATUS_LABEL[e.status]}</span>
                <span className="ml-auto text-xs text-popeyes-gray">
                  {timeAgo(e.createdAt)} ·{" "}
                  {(e.metadata?.completedBy as string) ?? "Sistema"}
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
