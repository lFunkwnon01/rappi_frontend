import { Link, useNavigate } from "react-router-dom";
import { LogOut, ShoppingBag, User as UserIcon, LogIn } from "lucide-react";
import { useAppStore } from "@/shared/stores/appStore";
import { tokenStore } from "@/shared/api/client";
import { ROLE_LABEL } from "@/shared/types";

export function ClientNavBar() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const cart = useAppStore((s) => s.cart);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const setCurrentStoreId = useAppStore((s) => s.setCurrentStoreId);

  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const logout = () => {
    tokenStore.clear();
    tokenStore.clearUser();
    setCurrentUser(null);
    setCurrentStoreId(null);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-popeyes-red font-display text-2xl text-popeyes-gold">
            P
          </div>
          <div className="leading-tight">
            <div className="font-display text-2xl tracking-wide text-popeyes-red">POPEYES</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-popeyes-gray">
              LOUISIANA KITCHEN
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
          <Link to="/" className="text-popeyes-gray hover:text-popeyes-red">
            Sedes
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <span className="hidden text-xs font-medium text-popeyes-gray sm:inline">
                Hola, <strong>{currentUser.name.split(" ")[0]}</strong>
                {currentUser.role !== "CLIENT" && ` · ${ROLE_LABEL[currentUser.role]}`}
              </span>
              <button
                type="button"
                onClick={logout}
                className="btn-ghost"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-ghost">
              <LogIn className="h-4 w-4" /> Ingresar
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
