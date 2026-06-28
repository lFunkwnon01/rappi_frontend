import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Minus, MapPin } from "lucide-react";
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

const STORE_NAMES: Record<string, string> = {
  "store-001": "Popeyes Miraflores",
  "store-002": "Popeyes Surco",
  "store-003": "Popeyes Barranco",
};

export function MenuPage() {
  const { storeId = "" } = useParams();
  const products = useAppStore((s) => s.products);
  const addToCart = useAppStore((s) => s.addToCart);
  const cart = useAppStore((s) => s.cart);
  const updateCartItem = useAppStore((s) => s.updateCartItem);
  const setCurrentStoreId = useAppStore((s) => s.setCurrentStoreId);
  const [filter, setFilter] = useState<ProductCategory | "ALL">("ALL");

  // Cuando se carga esta página, fijar la tienda actual en el store
  useEffect(() => {
    if (storeId) setCurrentStoreId(storeId);
  }, [storeId, setCurrentStoreId]);

  // Productos de ESTA tienda
  const storeProducts = useMemo(
    () => products.filter((p) => p.storeId === storeId && p.active),
    [products, storeId],
  );

  const filtered = useMemo(
    () =>
      storeProducts.filter(
        (p) => filter === "ALL" || p.category === filter,
      ),
    [storeProducts, filter],
  );

  const cartQty = (productId: string) =>
    cart.find((i) => i.productId === productId)?.quantity ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-popeyes-gray">
            <MapPin className="h-4 w-4" />
            <span>{STORE_NAMES[storeId] || storeId}</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl">Nuestra carta</h1>
          <p className="text-sm text-popeyes-gray">
            {filtered.length} producto{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""} en esta sede.
          </p>
        </div>
        <Link to="/" className="btn-secondary text-sm">
          ← Cambiar sede
        </Link>
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

      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-popeyes-gray">
            Esta sede aún no tiene productos en el demo. Intenta con otra sede.
          </p>
          <Link to="/" className="btn-primary mt-4">
            Ver otras sedes
          </Link>
        </div>
      ) : (
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
      )}
    </div>
  );
}
