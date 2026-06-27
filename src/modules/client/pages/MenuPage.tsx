import { useMemo, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useAppStore } from "@/shared/stores/appStore";
import type { ProductCategory } from "@/shared/types";
import { formatPEN } from "@/shared/utils/format";

const CATEGORIES: { key: ProductCategory | "ALL"; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "COMBOS", label: "Combos" },
  { key: "BUCKETS", label: "Buckets" },
  { key: "SANDWICHES", label: "Sandwiches" },
  { key: "POLLOS", label: "Pollos" },
  { key: "SIDES", label: "Acompañamientos" },
  { key: "BEBIDAS", label: "Bebidas" },
  { key: "POSTRES", label: "Postres" },
];

export function MenuPage() {
  const products = useAppStore((s) => s.products);
  const addToCart = useAppStore((s) => s.addToCart);
  const cart = useAppStore((s) => s.cart);
  const updateCartItem = useAppStore((s) => s.updateCartItem);
  const [filter, setFilter] = useState<ProductCategory | "ALL">("ALL");

  const filtered = useMemo(
    () =>
      products.filter(
        (p) => p.active && (filter === "ALL" || p.category === filter),
      ),
    [products, filter],
  );

  const cartQty = (productId: string) =>
    cart.find((i) => i.productId === productId)?.quantity ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-4xl md:text-5xl">Nuestra carta</h1>
        <p className="text-sm text-popeyes-gray">
          Elige tus favoritos. El pedido se registrará como <strong>WEB</strong> y entrará al workflow de cocina.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilter(c.key)}
            className={`chip border-black/10 bg-white px-3 py-1.5 text-sm transition ${
              filter === c.key
                ? "!border-popeyes-red !bg-popeyes-red !text-white"
                : "hover:border-popeyes-red"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const qty = cartQty(p.productId);
          return (
            <article key={p.productId} className="card overflow-hidden">
              <div className="aspect-video w-full overflow-hidden bg-popeyes-cream">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23FFE0B2'/><text x='50%25' y='50%25' font-size='40' text-anchor='middle' fill='%23E4002B' font-family='Arial Black' dy='.3em'>POPEYES</text></svg>";
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-display text-xl">{p.name}</h3>
                <p className="line-clamp-2 text-sm text-popeyes-gray">
                  {p.description}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-popeyes-red">
                    {formatPEN(p.price)}
                  </span>
                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => addToCart(p.productId)}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      <Plus className="h-4 w-4" /> Agregar
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-full bg-popeyes-dark px-1 py-1 text-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItem(p.productId, qty - 1)
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => addToCart(p.productId)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-popeyes-gold text-popeyes-dark hover:bg-yellow-400"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
