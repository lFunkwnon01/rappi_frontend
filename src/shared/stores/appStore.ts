import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

export interface CurrentUser {
  userId: string;
  email: string;
  name: string;
  role:
    | "CLIENT"
    | "RESTAURANT_WORKER"
    | "COOK"
    | "DISPATCHER"
    | "DELIVERY_DRIVER"
    | "ADMIN";
  tenantId: string;
  storeId: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface AppState {
  currentUser: CurrentUser | null;
  cart: CartItem[];
  currentStoreId: string | null;

  setCurrentUser: (user: CurrentUser | null) => void;
  setCurrentStoreId: (storeId: string | null) => void;
  addToCart: (item: CartItem) => void;
  updateCartItem: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        currentUser: null,
        cart: [],
        currentStoreId: null,

        setCurrentUser: (user) => set({ currentUser: user }),
        setCurrentStoreId: (storeId) => set({ currentStoreId: storeId }),

        addToCart: (item) => {
          set((state) => {
            const idx = state.cart.findIndex((c) => c.productId === item.productId);
            if (idx >= 0) {
              const newCart = [...state.cart];
              newCart[idx] = {
                ...newCart[idx],
                quantity: newCart[idx].quantity + item.quantity,
              };
              return { cart: newCart };
            }
            return { cart: [...state.cart, item] };
          });
        },

        updateCartItem: (productId, quantity) => {
          set((state) => ({
            cart:
              quantity <= 0
                ? state.cart.filter((c) => c.productId !== productId)
                : state.cart.map((c) =>
                    c.productId === productId ? { ...c, quantity } : c,
                  ),
          }));
        },

        removeFromCart: (productId) => {
          set((state) => ({
            cart: state.cart.filter((c) => c.productId !== productId),
          }));
        },

        clearCart: () => set({ cart: [] }),
      }),
      {
        name: "popeyes-frontend-store",
        partialize: (state) => ({
          currentUser: state.currentUser,
          cart: state.cart,
          currentStoreId: state.currentStoreId,
        }),
      },
    ),
  ),
);
