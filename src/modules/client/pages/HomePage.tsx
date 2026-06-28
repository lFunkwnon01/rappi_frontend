import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, ArrowRight, LogIn, Store as StoreIcon, LogOut, RefreshCw, Loader2 } from "lucide-react";
import { useAppStore } from "@/shared/stores/appStore";
import { stores as storesApi, orders as ordersApi, tokenStore, ApiError, type Store, type Order } from "@/shared/api/client";
import { formatPEN, timeAgo } from "@/shared/utils/format";
import { STATUS_COLOR, STATUS_LABEL } from "@/shared/types";

// Fallback cuando el backend no está accesible (lab expirado, sin red, etc.)
const FALLBACK_STORES: Store[] = [
  { tenantId: "popeyes", storeId: "store-001", name: "Popeyes Miraflores", address: "Av. Larco 345, Miraflores, Lima", active: true },
  { tenantId: "popeyes", storeId: "store-002", name: "Popeyes Surco", address: "Av. Caminos del Inca 1234, Surco, Lima", active: true },
  { tenantId: "popeyes", storeId: "store-003", name: "Popeyes Barranco", address: "Jr. Bolognesi 567, Barranco, Lima", active: true },
];

export function StoresLandingPage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentStoreId = useAppStore((s) => s.currentStoreId);
  const setCurrentStoreId = useAppStore((s) => s.setCurrentStoreId);
  const currentUser = useAppStore((s) => s.currentUser);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const token = tokenStore.get();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await storesApi.list(token);
        if (cancelled) return;
        setStores(list);
        if (token && currentUser?.role === "CLIENT") {
          try {
            const o = await ordersApi.list(token);
            if (cancelled) return;
            setRecentOrders(
              o
                .filter((x) => x.customerId === currentUser.userId)
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .slice(0, 5),
            );
          } catch {
            // ignore
          }
        }
      } catch (err) {
        if (cancelled) return;
        // Fallback: si el backend no está accesible (lab expirado, sin auth, etc.),
        // mostrar las 3 tiendas hardcoded para que la UI funcione
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setStores(FALLBACK_STORES);
        } else {
          setError(err instanceof ApiError ? err.message : "Error al cargar");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token, currentUser?.userId, currentUser?.role]);

  const selectStore = (storeId: string) => {
    setCurrentStoreId(storeId);
    navigate(`/store/${storeId}/menu`);
  };

  const clearStore = () => {
    setCurrentStoreId(null);
  };

  return (
    <>
      <section className="relative overflow-hidden bg-popeyes-dark text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-popeyes-red via-red-700 to-popeyes-dark" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-popeyes-gold/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 md:py-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-popeyes-red font-display text-2xl text-popeyes-gold">
                P
              </div>
              <div>
                <div className="font-display text-xl tracking-wider">POPEYES</div>
                <div className="text-[10px] uppercase tracking-widest text-white/60">Sistema de Pedidos</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentUser && (
                <span className="chip animate-pulse-slow border-emerald-300 bg-emerald-500/20 text-emerald-200">
                  ● Sincronizando
                </span>
              )}
              {currentUser ? (
                <>
                  <span className="hidden text-xs text-white/80 sm:inline">
                    Hola, <strong>{currentUser.name.split(" ")[0]}</strong>
                    {currentUser.role === "CLIENT" ? "" : ` · ${currentUser.role}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      tokenStore.clear();
                      tokenStore.clearUser();
                      setCurrentUser(null);
                      setCurrentStoreId(null);
                      navigate("/");
                    }}
                    className="btn-ghost text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    <LogOut className="h-4 w-4" /> Salir
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn-ghost text-white/80 hover:bg-white/10 hover:text-white">
                  <LogIn className="h-4 w-4" /> Iniciar sesión
                </Link>
              )}
            </div>
          </div>

          <div className="mt-10 grid items-center gap-10 md:grid-cols-2">
            <div>
              <h1 className="font-display text-4xl leading-none md:text-6xl">
                PIDE TU POLLO,
                <br />
                <span className="text-popeyes-gold">ELIGE TU SEDE</span>
              </h1>
              <p className="mt-4 max-w-md text-white/80">
                {currentUser?.role === "CLIENT" || !currentUser
                  ? "Selecciona la sede Popeyes más cercana y haz tu pedido. Te lo llevamos a tu puerta."
                  : `Hola ${currentUser.name.split(" ")[0]}, tu tienda asignada es ${currentUser.storeId || "—"}.`}
              </p>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="absolute h-60 w-60 rounded-full bg-popeyes-gold/40 blur-2xl" />
              <div className="relative grid h-60 w-60 place-items-center rounded-full bg-gradient-to-br from-popeyes-gold to-popeyes-orange shadow-2xl">
                <div className="text-center">
                  <StoreIcon className="mx-auto h-16 w-16 text-popeyes-dark" strokeWidth={1.5} />
                  <div className="mt-1 font-display text-sm tracking-widest text-popeyes-dark/80">3 SEDES</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl">Nuestras sedes</h2>
            <p className="text-sm text-popeyes-gray">
              Cada sede tiene su propio catálogo con productos exclusivos.
            </p>
          </div>
          {currentStoreId && (
            <button type="button" onClick={clearStore} className="btn-secondary text-sm">
              <RefreshCw className="h-4 w-4" /> Cambiar sede
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card h-56 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="card p-6 text-center text-red-600">{error}</div>
        ) : stores.length === 0 ? (
          <div className="card p-6 text-center text-popeyes-gray">
            No hay sedes disponibles. Ejecuta <code className="rounded bg-popeyes-cream px-1.5">POST /admin/seed</code> en el backend.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {stores.map((s) => {
              const isCurrent = s.storeId === currentStoreId;
              const isWorkerHere =
                currentUser?.role &&
                currentUser.role !== "CLIENT" &&
                currentUser.storeId === s.storeId;
              return (
                <article
                  key={s.storeId}
                  className={`card group relative overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-xl ${
                    isCurrent ? "ring-2 ring-popeyes-orange" : ""
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute right-3 top-3 chip border-popeyes-orange bg-popeyes-orange text-white">
                      Tu sede actual
                    </span>
                  )}
                  {isWorkerHere && !isCurrent && (
                    <span className="absolute right-3 top-3 chip border-emerald-300 bg-emerald-50 text-emerald-700">
                      Tu tienda
                    </span>
                  )}
                  <div className="relative h-32 overflow-hidden bg-gradient-to-br from-popeyes-red to-popeyes-dark">
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <StoreIcon className="h-24 w-24 text-white" strokeWidth={1.2} />
                    </div>
                    <div className="absolute bottom-3 left-4 font-display text-3xl text-white">
                      {s.name.replace("Popeyes ", "")}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start gap-2 text-sm text-popeyes-gray">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{s.address}</span>
                    </div>
                    <div className="mt-2 text-xs text-popeyes-gray">
                      ID: <code className="rounded bg-popeyes-cream px-1.5 py-0.5">{s.storeId}</code>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectStore(s.storeId)}
                      disabled={isWorkerHere}
                      className="btn-primary mt-4 w-full disabled:opacity-50"
                    >
                      {isCurrent ? "Ver carta" : isWorkerHere ? "Tu tienda asignada" : (
                        <>
                          Entrar <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {currentUser?.role === "CLIENT" && recentOrders.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 pb-16">
          <h2 className="mb-3 font-display text-2xl">Tus pedidos recientes</h2>
          <div className="space-y-2">
            {recentOrders.map((o) => (
              <Link
                key={o.orderId}
                to={`/orders/${o.orderId}`}
                className="card flex items-center gap-4 p-4 transition hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-popeyes-red/10 text-popeyes-red">
                  <StoreIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">#{o.orderId.slice(-6).toUpperCase()}</span>
                    <span className={`chip ${STATUS_COLOR[o.status]} border`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-popeyes-gray">
                    {o.customerName} · {timeAgo(o.createdAt)} · tienda: {o.storeId}
                  </div>
                </div>
                <div className="text-right font-bold text-popeyes-red">
                  {formatPEN(o.total)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
