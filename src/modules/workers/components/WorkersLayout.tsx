import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LogOut,
  LayoutDashboard,
  ListChecks,
  ChefHat,
  Package,
  Truck,
  ClipboardCheck,
  Activity,
  RotateCcw,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import clsx from "clsx";
import { useAppStore } from "@/shared/stores/appStore";
import { tokenStore } from "@/shared/api/client";
import { ROLE_LABEL } from "@/shared/types";

const NAV_ITEMS = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", roles: ["ADMIN"] },
  { to: "/admin/queue", icon: ListChecks, label: "Cola de pedidos", roles: ["ADMIN"] },
  { to: "/admin/all", icon: Activity, label: "Todos los pedidos", roles: ["ADMIN"] },
];

export function WorkersLayout() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const setCurrentStoreId = useAppStore((s) => s.setCurrentStoreId);

  if (!currentUser) return null;

  const rolePage: Record<string, { to: string; icon: typeof ChefHat; label: string }> = {
    RESTAURANT_WORKER: { to: "/admin/queue", icon: ClipboardCheck, label: "Recibir pedidos" },
    COOK: { to: "/admin/kitchen", icon: ChefHat, label: "Cocina" },
    DISPATCHER: { to: "/admin/pack", icon: Package, label: "Empaque" },
    DELIVERY_DRIVER: { to: "/admin/deliver", icon: Truck, label: "Reparto" },
    CLIENT: { to: "/admin/receive", icon: ClipboardCheck, label: "Confirmar" },
  };

  const isAdmin = currentUser.role === "ADMIN";
  const page = rolePage[currentUser.role];

  const logout = () => {
    tokenStore.clear();
    tokenStore.clearUser();
    setCurrentUser(null);
    setCurrentStoreId(null);
    navigate("/");
  };

  return (
    <div className="flex min-h-[calc(100vh-0px)] bg-popeyes-cream">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-black/5 bg-popeyes-dark text-white md:flex">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-popeyes-red font-display text-2xl text-popeyes-gold">
              P
            </div>
            <div>
              <div className="font-display text-xl tracking-wide">POPEYES</div>
              <div className="text-[10px] uppercase tracking-widest text-white/60">Panel interno</div>
            </div>
          </div>
        </div>

        <div className="p-3">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-[10px] uppercase tracking-widest text-white/50">Sesión activa</div>
            <div className="mt-1 font-semibold">{currentUser.name}</div>
            <div className="text-xs text-white/70">{currentUser.email}</div>
            <div className="mt-1 text-xs text-white/60">Tienda: {currentUser.storeId || "—"}</div>
            <span className="chip mt-2 border-popeyes-gold bg-popeyes-gold/20 text-popeyes-gold">
              {ROLE_LABEL[currentUser.role]}
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2">
          {!isAdmin && page && (
            <NavLink
              to={page.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-popeyes-red text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                )
              }
            >
              <page.icon className="h-4 w-4" /> {page.label}
            </NavLink>
          )}
          {isAdmin &&
            NAV_ITEMS.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === "/admin"}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                    isActive
                      ? "bg-popeyes-red text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white",
                  )
                }
              >
                <it.icon className="h-4 w-4" /> {it.label}
              </NavLink>
            ))}
        </nav>

        <div className="space-y-1 border-t border-white/10 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-white/70 transition hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-black/5 bg-white/95 px-6 py-3 backdrop-blur">
          <div>
            <div className="text-xs uppercase tracking-widest text-popeyes-gray">
              {ROLE_LABEL[currentUser.role]} · tienda {currentUser.storeId}
            </div>
            <h2 className="font-display text-2xl">
              Hola, {currentUser.name.split(" ")[0]} 👋
            </h2>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
