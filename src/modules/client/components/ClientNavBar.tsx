import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, ShoppingBag, User as UserIcon } from "lucide-react";
import { useAppStore } from "@/shared/stores/appStore";
import { ROLE_LABEL } from "@/shared/types";

export function ClientNavBar() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const cart = useAppStore((s) => s.cart);
  const logout = useAppStore((s) => s.logout);
  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-popeyes-red font-display text-2xl text-popeyes-gold">
            P
          </div>
          <div className="leading-tight">
            <div className="font-display text-2xl tracking-wide text-popeyes-red">
              POPEYES
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-popeyes-gray">
              LOUISIANA KITCHEN
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "text-popeyes-red" : "hover:text-popeyes-red"
            }
          >
            Inicio
          </NavLink>
          <NavLink
            to="/menu"
            className={({ isActive }) =>
              isActive ? "text-popeyes-red" : "hover:text-popeyes-red"
            }
          >
            Carta
          </NavLink>
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              isActive ? "text-popeyes-red" : "hover:text-popeyes-red"
            }
          >
            Mis pedidos
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <span className="hidden text-xs font-medium text-popeyes-gray sm:inline">
                Hola, <strong>{currentUser.name.split(" ")[0]}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="btn-ghost"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-ghost">
              <UserIcon className="h-4 w-4" /> Ingresar
            </Link>
          )}
          <Link
            to="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-popeyes-orange text-white transition hover:bg-orange-600"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-popeyes-red text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function ClientFooter() {
  return (
    <footer className="mt-16 bg-popeyes-dark py-8 text-white/70">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm">
        <div className="font-display text-xl text-popeyes-gold">POPEYES</div>
        <p className="mt-1">© {new Date().getFullYear()} · Sistema de Gestión de Pedidos — Demo Cloud Computing</p>
        <p className="mt-1 text-xs">
          {ROLE_LABEL.CLIENT} · {ROLE_LABEL.RESTAURANT_WORKER} · {ROLE_LABEL.COOK} · {ROLE_LABEL.DISPATCHER} · {ROLE_LABEL.DELIVERY_DRIVER} · {ROLE_LABEL.ADMIN}
        </p>
      </div>
    </footer>
  );
}
