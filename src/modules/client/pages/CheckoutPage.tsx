import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CreditCard, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/shared/stores/appStore";
import { formatPEN } from "@/shared/utils/format";

type PaymentMethod = "YAPE" | "PLIN" | "EFECTIVO" | "TARJETA";

const PAYMENTS: { key: PaymentMethod; label: string; hint: string }[] = [
  { key: "YAPE", label: "Yape", hint: "Pago inmediato con QR" },
  { key: "PLIN", label: "Plin", hint: "Transferencia bancaria" },
  { key: "TARJETA", label: "Tarjeta", hint: "Visa / Mastercard" },
  { key: "EFECTIVO", label: "Efectivo", hint: "Paga al recibir" },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useAppStore((s) => s.cart);
  const currentUser = useAppStore((s) => s.currentUser);
  const placeOrder = useAppStore((s) => s.placeOrder);

  const [address, setAddress] = useState(
    currentUser?.role === "CLIENT" ? "Av. Larco 345, Miraflores" : "",
  );
  const [payment, setPayment] = useState<PaymentMethod>("YAPE");
  const [submitting, setSubmitting] = useState(false);

  const subtotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const delivery = 5.0;
  const total = subtotal + delivery;

  if (cart.length === 0) {
    navigate("/cart", { replace: true });
    return null;
  }

  const customerId = currentUser?.userId ?? "guest";
  const customerName =
    currentUser?.name ?? "Invitado " + customerId.slice(-4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setSubmitting(true);
    const order = placeOrder({
      customerId,
      customerName,
      deliveryAddress: address,
      paymentMethod: payment,
      origin: "WEB",
    });
    setTimeout(() => navigate(`/orders/${order.orderId}`), 400);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-4xl">Finalizar pedido</h1>
      <p className="text-sm text-popeyes-gray">
        Confirma la dirección y el método de pago.
      </p>

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
            {PAYMENTS.map((p) => (
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
                  onChange={() => setPayment(p.key)}
                />
                <div className="flex-1">
                  <div className="font-semibold">{p.label}</div>
                  <div className="text-xs text-popeyes-gray">{p.hint}</div>
                </div>
                {payment === p.key && (
                  <CheckCircle2 className="h-5 w-5 text-popeyes-red" />
                )}
              </label>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h3 className="font-display text-2xl">Resumen</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {cart.map((i) => (
              <li key={i.productId} className="flex justify-between">
                <span>
                  {i.quantity}× {i.name}
                </span>
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
              <span>Total</span>
              <span className="text-popeyes-red">{formatPEN(total)}</span>
            </div>
          </div>
        </section>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={submitting || !address.trim()}
        >
          {submitting ? "Enviando pedido..." : `Confirmar pedido · ${formatPEN(total)}`}
        </button>
        <p className="text-center text-xs text-popeyes-gray">
          Al confirmar, tu pedido entrará al workflow de cocina como
          <strong> ORDER_CREATED </strong>y verás el avance en tiempo real.
        </p>
      </form>
    </div>
  );
}
