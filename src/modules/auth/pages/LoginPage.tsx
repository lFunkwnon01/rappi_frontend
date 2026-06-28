import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChefHat, LogIn, Loader2 } from "lucide-react";
import { auth as authApi, ApiError, tokenStore } from "@/shared/api/client";
import { useAppStore } from "@/shared/stores/appStore";
import { roleHomePath } from "@/shared/utils/format";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const [email, setEmail] = useState("cliente@popeyes.pe");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authApi.login(email.trim().toLowerCase(), password);
      tokenStore.set(result.token);
      tokenStore.setUser(result.user);
      setCurrentUser(result.user);
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      navigate(
        from && from !== "/login" ? from : roleHomePath(result.user.role),
        { replace: true },
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Error de red");
      }
    } finally {
      setLoading(false);
    }
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
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
            <p className="mb-2 font-semibold text-popeyes-gold">Usuarios demo (password: <code>password123</code>)</p>
            <ul className="space-y-1">
              <li>• <strong>cliente@popeyes.pe</strong> — Cliente global (puede pedir en cualquier sede)</li>
              <li>• <strong>admin.miraflores@popeyes.pe</strong> — Admin de Miraflores</li>
              <li>• <strong>admin.surco@popeyes.pe</strong> — Admin de Surco</li>
              <li>• <strong>cook.miraflores@popeyes.pe</strong> — Cocinero de Miraflores</li>
              <li>• <strong>dispatcher.surco@popeyes.pe</strong> — Despachador de Surco</li>
            </ul>
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
                Autenticación real contra el backend (JWT).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-popeyes-gray">Email</label>
              <input
                type="email"
                className="input mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-popeyes-gray">Contraseña</label>
              <input
                type="password"
                className="input mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary mt-6 w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Conectando…
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" /> Entrar
              </>
            )}
          </button>

          <p className="mt-3 text-center text-xs text-popeyes-gray">
            ¿No tienes cuenta?{" "}
            <button
              type="button"
              onClick={async () => {
                const email = prompt("Email:");
                if (!email) return;
                const name = prompt("Nombre:") || email.split("@")[0];
                const password = prompt("Contraseña (mín 6 chars):") || "demo1234";
                try {
                  const result = await authApi.register({
                    email,
                    password,
                    name,
                    role: "CLIENT",
                  });
                  tokenStore.set(result.token);
                  tokenStore.setUser(result.user);
                  setCurrentUser(result.user);
                  navigate("/", { replace: true });
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Error");
                }
              }}
              className="text-popeyes-red hover:underline"
            >
              Regístrate
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
