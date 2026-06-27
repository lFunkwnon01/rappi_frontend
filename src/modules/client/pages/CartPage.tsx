import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useAppStore } from "@/shared/stores/appStore";
import { formatPEN } from "@/shared/utils/format";

export function CartPage() {
  const cart = useAppStore((s) => s.cart);
  const updateCartItem = useAppStore((s) => s.updateCartItem);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const clearCart = useAppStore((s) => s.clearCart);

  const subtotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const delivery = cart.length ? 5.0 : 0;
  const total = subtotal + delivery;

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-popeyes-cream">
          <ShoppingBag className="h-10 w-10 text-popeyes-gray" />
        </div>
        <h1 className="mt-4 font-display text-4xl">Tu carrito está vacío</h1>
        <p className="mt-1 text-popeyes-gray">Agrega algo rico de la carta para continuar.</p>
        <Link to="/menu" className="btn-primary mt-6">
          Ir a la carta
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-4xl">Tu pedido</h1>
      <p className="text-sm text-popeyes-gray">
        Revisa los productos antes de continuar al pago.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="card divide-y md:col-span-2">
          {cart.map((i) => (
            <div key={i.productId} className="flex items-center gap-3 p-4">
              <div className="flex-1">
                <div className="font-semibold">{i.name}</div>
                <div className="text-xs text-popeyes-gray">
                  {formatPEN(i.price)} c/u
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-black/10 px-1 py-1">
                <button
                  type="button"
                  onClick={() => updateCartItem(i.productId, i.quantity - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center text-sm font-bold">
                  {i.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateCartItem(i.productId, i.quantity + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-popeyes-red text-white hover:bg-red-700"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <div className="w-20 text-right font-semibold">
                {formatPEN(i.price * i.quantity)}
              </div>
              <button
                type="button"
                onClick={() => removeFromCart(i.productId)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-popeyes-gray hover:bg-red-50 hover:text-popeyes-red"
                title="Quitar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex justify-end p-3">
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-semibold text-popeyes-gray underline-offset-2 hover:text-popeyes-red hover:underline"
            >
              Vaciar carrito
            </button>
          </div>
        </div>

        <aside className="card h-fit p-5">
          <h3 className="font-display text-2xl">Resumen</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatPEN(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{formatPEN(delivery)}</dd>
            </div>
            <div className="flex justify-between border-t border-black/5 pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd className="text-popeyes-red">{formatPEN(total)}</dd>
            </div>
          </dl>
          <Link to="/checkout" className="btn-primary mt-4 w-full">
            Continuar al pago
          </Link>
        </aside>
      </div>
    </div>
  );
}
