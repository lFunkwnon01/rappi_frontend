import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  MapPin,
  CreditCard,
  CheckCircle2,
  Smartphone,
  Banknote,
  Loader2,
  AlertCircle,
  CheckCircle,
  Lock,
} from "lucide-react";
import { useAppStore } from "@/shared/stores/appStore";
import { orders as ordersApi, tokenStore, ApiError, type PaymentMethod } from "@/shared/api/client";
import { formatPEN } from "@/shared/utils/format";

type PaymentStatus = "IDLE" | "PROCESSING" | "SUCCESS" | "FAILED";

const PAYMENTS: { key: PaymentMethod; label: string; hint: string; icon: typeof Smartphone }[] = [
  { key: "YAPE", label: "Yape", hint: "Aprueba desde tu app con código de 6 dígitos", icon: Smartphone },
  { key: "PLIN", label: "Plin", hint: "Aprueba desde tu app con código de 6 dígitos", icon: Smartphone },
  { key: "TARJETA", label: "Tarjeta de crédito/débito", hint: "Visa, Mastercard, AMEX", icon: CreditCard },
  { key: "EFECTIVO", label: "Efectivo", hint: "Pagas al recibir tu pedido (delivery)", icon: Banknote },
];

const STORE_NAMES: Record<string, string> = {
  "store-001": "Popeyes Miraflores",
  "store-002": "Popeyes Surco",
  "store-003": "Popeyes Barranco",
};

/** Mock del procesador de pagos. Devuelve éxito o fallo según los datos. */
function mockPaymentProcessor(
  method: PaymentMethod,
  details: Record<string, string>,
): { success: boolean; error?: string } {
  if (method === "EFECTIVO") {
    // El efectivo siempre "aprueba" - se paga al recibir
    return { success: true };
  }
  if (method === "YAPE" || method === "PLIN") {
    const code = details.code?.trim() || "";
    const phone = details.phone?.trim() || "";
    if (!phone || phone.length < 9) return { success: false, error: "Ingresa un celular válido" };
    if (!code) return { success: false, error: "Ingresa el código de aprobación" };
    if (code === "000000") return { success: false, error: "Saldo insuficiente en tu cuenta Yape/Plin" };
    if (code === "111111") return { success: false, error: "Código rechazado por Yape/Plin" };
    if (code.length !== 6) return { success: false, error: "El código debe tener 6 dígitos" };
    return { success: true };
  }
  if (method === "TARJETA") {
    const card = details.cardNumber?.replace(/\s/g, "") || "";
    const cvv = details.cvv?.trim() || "";
    const expiry = details.expiry?.trim() || "";
    if (card.length < 13) return { success: false, error: "Número de tarjeta inválido" };
    if (cvv.length < 3) return { success: false, error: "CVV inválido" };
    if (!expiry.match(/^\d{2}\/\d{2}$/)) return { success: false, error: "Fecha de expiración inválida (MM/AA)" };
    if (card === "4000000000000002") return { success: false, error: "Tarjeta declinada por el banco" };
    if (card === "5555555555554444") return { success: false, error: "Fondos insuficientes" };
    return { success: true };
  }
  return { success: false, error: "Método de pago no soportado" };
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { storeId = "" } = useParams();
  const cart = useAppStore((s) => s.cart);
  const currentUser = useAppStore((s) => s.currentUser);
  const clearCart = useAppStore((s) => s.clearCart);

  const [address, setAddress] = useState(
    currentUser?.role === "CLIENT" ? "Av. Larco 345, Miraflores" : "",
  );
  const [payment, setPayment] = useState<PaymentMethod>("YAPE");
  const [submitting, setSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("IDLE");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Detalles del pago según el método
  const [yapePlin, setYapePlin] = useState({ phone: "", code: "" });
  const [card, setCard] = useState({ cardNumber: "", expiry: "", cvv: "", name: "" });

  const subtotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const delivery = 5.0;
  const total = subtotal + delivery;

  if (cart.length === 0) {
    navigate(`/store/${storeId}/cart`, { replace: true });
    return null;
  }

  const customerId = currentUser?.userId ?? "guest";
  const customerName =
    currentUser?.name ?? "Invitado " + customerId.slice(-4);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    const token = tokenStore.get();
    if (!token) {
      setPaymentError("Tu sesión expiró. Vuelve a iniciar sesión.");
      return;
    }

    setSubmitting(true);
    setPaymentStatus("PROCESSING");
    setPaymentError(null);

    // 1) Validar el pago (mock local - el backend aún no tiene endpoint /pay)
    const details =
      payment === "TARJETA" ? card : payment === "EFECTIVO" ? {} : yapePlin;
    const payResult = mockPaymentProcessor(payment, details);

    if (!payResult.success) {
      setPaymentStatus("FAILED");
      setPaymentError(payResult.error || "Pago rechazado");
      setSubmitting(false);
      return;
    }

    // 2) Pago OK → crear el pedido en el backend real
    try {
      setPaymentStatus("SUCCESS");
      const order = await ordersApi.create(
        {
          storeId,
          deliveryAddress: address,
          paymentMethod: payment,
          customerName,
          items: cart.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        },
        token,
      );
      // Limpiar carrito
      useAppStore.getState().clearCart();
      setTimeout(() => navigate(`/orders/${order.orderId}`), 500);
    } catch (err) {
      setPaymentStatus("FAILED");
      setPaymentError(
        err instanceof ApiError
          ? `Pago OK pero el backend rechazó el pedido: ${err.message}`
          : "Pago OK pero no se pudo crear el pedido. Intenta de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setPaymentStatus("IDLE");
    setPaymentError(null);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-popeyes-gray">
            <MapPin className="h-4 w-4" />
            <span>{STORE_NAMES[storeId] || storeId}</span>
          </div>
          <h1 className="font-display text-4xl">Finalizar pedido</h1>
          <p className="text-sm text-popeyes-gray">
            Confirma la dirección y completa el pago.
          </p>
        </div>
        <Link to={`/store/${storeId}/cart`} className="text-sm font-semibold text-popeyes-red hover:underline">
          ← Volver al carrito
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <section className="card p-5">
          <h3 className="flex items-center gap-2 font-display text-2xl">
            <MapPin className="h-5 w-5 text-popeyes-red" /> Dirección de entrega
          </h3>
          <input
            type="text"
            className="input mt-3"
            placeholder="Ej. Av. Larco 345, Miraflores, Lima"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </section>

        <section className="card p-5">
          <h3 className="flex items-center gap-2 font-display text-2xl">
            <CreditCard className="h-5 w-5 text-popeyes-red" /> Método de pago
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {PAYMENTS.map((p) => {
              const Icon = p.icon;
              return (
                <label
                  key={p.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                    payment === p.key
                      ? "border-popeyes-red bg-red-50"
                      : "border-black/5 hover:border-black/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="sr-only"
                    checked={payment === p.key}
                    onChange={() => { setPayment(p.key); reset(); }}
                  />
                  <Icon className="h-5 w-5 text-popeyes-red" />
                  <div className="flex-1">
                    <div className="font-semibold">{p.label}</div>
                    <div className="text-xs text-popeyes-gray">{p.hint}</div>
                  </div>
                  {payment === p.key && (
                    <CheckCircle2 className="h-5 w-5 text-popeyes-red" />
                  )}
                </label>
              );
            })}
          </div>

          {/* Form de detalles según método */}
          <div className="mt-4 rounded-xl bg-popeyes-cream/50 p-4">
            {payment === "YAPE" || payment === "PLIN" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-popeyes-gray">
                    Tu número de {payment}
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    className="input mt-1"
                    placeholder="+51 999 888 777"
                    value={yapePlin.phone}
                    onChange={(e) => setYapePlin({ ...yapePlin, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-popeyes-gray">
                    Código de aprobación (6 dígitos)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="input mt-1 font-mono text-center text-2xl tracking-widest"
                    placeholder="000000"
                    value={yapePlin.code}
                    onChange={(e) => setYapePlin({ ...yapePlin, code: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  />
                  <p className="mt-1 text-xs text-popeyes-gray">
                    Tip: <code className="rounded bg-white px-1.5">123456</code> = OK · <code className="rounded bg-white px-1.5">000000</code> = saldo insuficiente · <code className="rounded bg-white px-1.5">111111</code> = rechazado
                  </p>
                </div>
              </div>
            ) : payment === "TARJETA" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-popeyes-gray">Nombre del titular</label>
                  <input
                    type="text"
                    className="input mt-1"
                    placeholder="Como aparece en la tarjeta"
                    value={card.name}
                    onChange={(e) => setCard({ ...card, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-popeyes-gray">Número de tarjeta</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input mt-1 font-mono"
                    placeholder="4111 1111 1111 1111"
                    maxLength={19}
                    value={card.cardNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                      const formatted = v.match(/.{1,4}/g)?.join(" ") || v;
                      setCard({ ...card, cardNumber: formatted });
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-popeyes-gray">Expiración (MM/AA)</label>
                    <input
                      type="text"
                      className="input mt-1 font-mono"
                      placeholder="12/27"
                      maxLength={5}
                      value={card.expiry}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                        setCard({ ...card, expiry: v });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-popeyes-gray">CVV</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="input mt-1 font-mono"
                      placeholder="123"
                      maxLength={4}
                      value={card.cvv}
                      onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    />
                  </div>
                </div>
                <p className="text-xs text-popeyes-gray">
                  Tip: <code className="rounded bg-white px-1.5">4111 1111 1111 1111</code> = OK · <code className="rounded bg-white px-1.5">4000 0000 0000 0002</code> = declinada · <code className="rounded bg-white px-1.5">5555 5555 5555 4444</code> = fondos insuficientes
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-sm text-popeyes-gray">
                <Banknote className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Pagarás en efectivo al momento de la entrega. Tu pedido quedará
                  en estado <strong>PAYMENT_PENDING</strong> hasta que el repartidor
                  confirme el pago.
                </p>
              </div>
            )}
          </div>

          {/* Estado del pago (errores, loading, success) */}
          {paymentStatus === "FAILED" && paymentError && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border-2 border-red-300 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold text-red-700">Pago rechazado</p>
                <p className="text-sm text-red-600">{paymentError}</p>
                <p className="mt-2 text-xs text-red-500">
                  Tu pedido no fue creado. Intenta con otro método o revisa los datos.
                </p>
              </div>
            </div>
          )}

          {paymentStatus === "SUCCESS" && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <p className="font-semibold text-emerald-700">
                ¡Pago confirmado! Creando pedido…
              </p>
            </div>
          )}
        </section>

        <section className="card p-5">
          <h3 className="font-display text-2xl">Resumen</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {cart.map((i) => (
              <li key={i.productId} className="flex justify-between">
                <span>{i.quantity}× {i.name}</span>
                <span>{formatPEN(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-black/5 pt-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPEN(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{formatPEN(delivery)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Total a pagar</span>
              <span className="text-popeyes-red">{formatPEN(total)}</span>
            </div>
          </div>
        </section>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={submitting || !address.trim() || paymentStatus === "SUCCESS"}
        >
          {paymentStatus === "PROCESSING" || paymentStatus === "SUCCESS" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Procesando pago…
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Pagar {formatPEN(total)} y confirmar pedido
            </>
          )}
        </button>

        <p className="text-center text-xs text-popeyes-gray">
          Al pagar, tu pedido se crea con estado <strong>PAYMENT_CONFIRMED</strong>
          {payment === "EFECTIVO" && " (pendiente hasta entrega)"} y entra al workflow
          de la cocina. Si en 20 min no se confirma el pago, se cancela automáticamente.
        </p>
      </form>
    </div>
  );
}
