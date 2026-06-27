import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChefHat, LogIn } from "lucide-react";
import { useAppStore } from "@/shared/stores/appStore";
import { ROLE_LABEL } from "@/shared/types";
import { roleHomePath } from "@/shared/utils/format";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const users = useAppStore((s) => s.users);
  const login = useAppStore((s) => s.login);
  const [selectedId, setSelectedId] = useState(users[0]?.userId ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = login(selectedId);
    if (!user) {
      setError("Usuario no encontrado");
      return;
    }
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
    navigate(from && from !== "/login" ? from : roleHomePath(user.role), { replace: true });
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-2">
        <div className="hidden flex-col justify-between rounded-3xl bg-popeyes-dark p-10 text-white lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-popeyes-red font-display text-3xl text-popeyes-gold">
                P
              </div>
              <div>
                <div className="font-display text-3xl tracking-wider">POPEYES</div>
                <div className="text-xs uppercase tracking-widest text-white/60">
                  Sistema de Gestión de Pedidos
                </div>
              </div>
            </div>
            <h1 className="mt-10 font-display text-5xl leading-none">
              El sabor de Louisiana, ahora con un workflow serverless.
            </h1>
            <p className="mt-4 text-white/70">
              Cliente hace pedido → Recepcionista recibe → Cocinero cocina → Despachador empaca → Repartidor entrega → Cliente confirma.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(ROLE_LABEL).map(([k, v]) => (
              <div
                key={k}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="text-popeyes-gold">●</div>
                <div className="font-semibold">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card animate-slide-up p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-popeyes-red/10 text-popeyes-red">
              <ChefHat className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-3xl">Ingresar al sistema</h2>
              <p className="text-sm text-popeyes-gray">
                Selecciona un usuario demo según el rol que quieras probar.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {users.map((u) => (
              <label
                key={u.userId}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                  selectedId === u.userId
                    ? "border-popeyes-red bg-red-50"
                    : "border-black/5 hover:border-black/20"
                }`}
              >
                <input
                  type="radio"
                  name="user"
                  value={u.userId}
                  checked={selectedId === u.userId}
                  onChange={() => setSelectedId(u.userId)}
                  className="sr-only"
                />
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-popeyes-orange/15 font-bold text-popeyes-orange">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-popeyes-gray">{u.email}</div>
                </div>
                <span className="chip border-popeyes-red/30 bg-popeyes-red/10 text-popeyes-red">
                  {ROLE_LABEL[u.role]}
                </span>
              </label>
            ))}
          </div>

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary mt-6 w-full">
            <LogIn className="h-4 w-4" /> Entrar
          </button>

          <p className="mt-3 text-center text-xs text-popeyes-gray">
            Demo: no requiere contraseña. La autenticación real (JWT) la maneja el backend (ver PDF).
          </p>
        </form>
      </div>
    </div>
  );
}
