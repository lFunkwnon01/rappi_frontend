import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Minus, MapPin, Loader2 } from "lucide-react";
import { useAppStore } from "@/shared/stores/appStore";
import { products as productsApi, tokenStore, ApiError, type Product, type ProductCategory } from "@/shared/api/client";
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

// Fallback si la API no está disponible (lab expirado, sin red, etc.)
const FALLBACK_PRODUCTS: Record<string, Product[]> = {
  "store-001": [
    { tenantId: "popeyes", storeId: "store-001", productId: "p-bucket-8", name: "Bucket 8 Piezas", description: "8 piezas de pollo crispy", price: 64.9, category: "BUCKETS", imageUrl: "", active: true },
    { tenantId: "popeyes", storeId: "store-001", productId: "p-bucket-12", name: "Bucket 12 Piezas", description: "12 piezas para compartir", price: 89.9, category: "BUCKETS", imageUrl: "", active: true },
    { tenantId: "popeyes", storeId: "store-001", productId: "p-sandwich-classic", name: "Classic Chicken Sandwich", description: "Pollo crispy, pepinillo y salsa mayo", price: 19.9, category: "SANDWICHES", imageUrl: "", active: true },
    { tenantId: "popeyes", storeId: "store-001", productId: "p-fries-large", name: "Papas Cajún", description: "Papas fritas sazonadas", price: 12.9, category: "SIDES", imageUrl: "", active: true },
    { tenantId: "popeyes", storeId: "store-001", productId: "p-cola-500", name: "Coca-Cola 500ml", description: "Gaseosa bien fría", price: 7.5, category: "BEBIDAS", imageUrl: "", active: true },
  ],
  "store-002": [
    { tenantId: "popeyes", storeId: "store-002", productId: "p-bucket-8", name: "Bucket 8 Piezas", description: "8 piezas de pollo crispy", price: 64.9, category: "BUCKETS", imageUrl: "", active: true },
    { tenantId: "popeyes", storeId: "store-002", productId: "p-combo-pareja", name: "Combo Pareja Surco", description: "Combo especial de Surco", price: 39.9, category: "COMBOS", imageUrl: "", active: true },
    { tenantId: "popeyes", storeId: "store-002", productId: "p-sandwich-spicy", name: "Spicy Chicken Sandwich", description: "Sandwich picante", price: 21.9, category: "SANDWICHES", imageUrl: "", active: true },
    { tenantId: "popeyes", storeId: "store-002", productId: "p-biscuit", name: "Biscuit", description: "Pan de buttermilk", price: 5.9, category: "SIDES", imageUrl: "", active: true },
    { tenantId: "popeyes", storeId: "store-002", productId: "p-cola-500", name: "Coca-Cola 500ml", description: "Gaseosa bien fría", price: 7.5, category: "BEBIDAS", imageUrl: "", active: true },
  ],
  "store-003": [
    { tenantId: "popeyes", storeId: "store-003", productId: "p-bucket-8", name: "Bucket 8 Piezas", description: "8 piezas de pollo crispy", price: 64.9, category: "BUCKETS", imageUrl: "", active: true },
    { tenantId: "popeyes", storeId: "store-003", productId: "p-tenders-6", name: "Chicken Tenders", description: "Tiras de pollo empanizado", price: 29.9, category: "POLLOS", imageUrl: "", active: true },
    { tenantId: "popeyes", storeId: "store-003", productId: "p-pollo-aji", name: "Pollo con Ají Barranco", description: "Pollo crispy con ají exclusivo", price: 28.0, category: "POLLOS", imageUrl: "", active: true },
    { tenantId: "popeyes", storeId: "store-003", productId: "p-pie", name: "Apple Pie", description: "Pie de manzana crujiente", price: 8.9, category: "POSTRES", imageUrl: "", active: true },
    { tenantId: "popeyes", storeId: "store-003", productId: "p-cafe", name: "Café Popeyes", description: "Café pasado exclusivo", price: 8.0, category: "BEBIDAS", imageUrl: "", active: true },
  ],
};

export function MenuPage() {
  const { storeId = "" } = useParams();
  const cart = useAppStore((s) => s.cart);
  const addToCart = useAppStore((s) => s.addToCart);
  const updateCartItem = useAppStore((s) => s.updateCartItem);
  const setCurrentStoreId = useAppStore((s) => s.setCurrentStoreId);

  const [storeName, setStoreName] = useState<string>(STORE_NAMES[storeId] || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProductCategory | "ALL">("ALL");

  // Persistir tienda en store
  useEffect(() => {
    if (storeId) {
      setCurrentStoreId(storeId);
      setStoreName(STORE_NAMES[storeId] || `Sede ${storeId}`);
    }
  }, [storeId, setCurrentStoreId]);

  // Cargar productos del backend
  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await productsApi.list(storeId, tokenStore.get());
        if (cancelled) return;
        setProducts(list);
      } catch (err) {
        if (cancelled) return;
        // Fallback si la API no está disponible
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setProducts(FALLBACK_PRODUCTS[storeId] ?? []);
        } else {
          setError(err instanceof ApiError ? err.message : "Error al cargar productos");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const filtered = useMemo(
    () => (filter === "ALL" ? products : products.filter((p) => p.category === filter)),
    [products, filter],
  );

  const cartQty = (productId: string) =>
    cart.find((i) => i.productId === productId)?.quantity ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-popeyes-gray">
            <MapPin className="h-4 w-4" />
            <span>{storeName || storeId}</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl">Nuestra carta</h1>
          <p className="text-sm text-popeyes-gray">
            {loading
              ? "Cargando productos…"
              : `${filtered.length} producto${filtered.length !== 1 ? "s" : ""} disponible${filtered.length !== 1 ? "s" : ""} en esta sede.`}
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

      {error ? (
        <div className="card p-8 text-center text-red-600">{error}</div>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 p-12 text-popeyes-gray">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando carta…
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-popeyes-gray">
            Esta sede aún no tiene productos. Ejecuta <code className="rounded bg-popeyes-cream px-1.5">/admin/seed</code> en el backend o pide al admin de la tienda que agregue.
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
                  <p className="line-clamp-2 text-sm text-popeyes-gray">{p.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-popeyes-red">
                      {formatPEN(p.price)}
                    </span>
                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          addToCart({
                            productId: p.productId,
                            name: p.name,
                            price: p.price,
                            quantity: 1,
                          })
                        }
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        <Plus className="h-4 w-4" /> Agregar
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-full bg-popeyes-dark px-1 py-1 text-white">
                        <button
                          type="button"
                          onClick={() => updateCartItem(p.productId, qty - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{qty}</span>
                        <button
                          type="button"
                          onClick={() =>
                            addToCart({
                              productId: p.productId,
                              name: p.name,
                              price: p.price,
                              quantity: 1,
                            })
                          }
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
