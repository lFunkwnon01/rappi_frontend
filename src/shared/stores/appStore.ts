import { useMemo } from "react";
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import type {
  Order,
  OrderEvent,
  OrderItem,
  OrderStatus,
  Product,
  Role,
  User,
  WorkflowStep,
  WorkflowTask,
} from "@/shared/types";
import {
  STEP_TO_STATUS,
  WORKFLOW_SEQUENCE,
  STEP_TO_ROLE,
} from "@/shared/types";
import {
  DEMO_EVENTS,
  DEMO_ORDERS,
  DEMO_PRODUCTS,
  DEMO_TASKS,
  DEMO_TENANT,
  DEMO_USERS,
} from "@/shared/mocks/data";

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

interface AppState {
  tenantId: string;
  users: User[];
  products: Product[];
  orders: Order[];
  tasks: WorkflowTask[];
  events: OrderEvent[];

  currentUser: User | null;
  cart: OrderItem[];

  autoAdvance: boolean;
  autoAdvanceTimer: number | null;

  login: (userId: string) => User | null;
  logout: () => void;

  addToCart: (productId: string, quantity?: number) => void;
  updateCartItem: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  placeOrder: (input: {
    customerId: string;
    customerName: string;
    deliveryAddress: string;
    paymentMethod: Order["paymentMethod"];
    origin: Order["origin"];
    externalOrderId?: string;
  }) => Order;

  advanceOrder: (
    orderId: string,
    step: WorkflowStep,
    completedByUserId: string,
  ) => void;

  resetDemo: () => void;
  toggleAutoAdvance: () => void;
  ensureAutoAdvance: () => void;
}

const initialState = {
  tenantId: DEMO_TENANT,
  users: DEMO_USERS,
  products: DEMO_PRODUCTS,
  orders: DEMO_ORDERS,
  tasks: DEMO_TASKS,
  events: DEMO_EVENTS,
  currentUser: null,
  cart: [] as OrderItem[],
  autoAdvance: false,
  autoAdvanceTimer: null,
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,

        login: (userId) => {
          const user = get().users.find((u) => u.userId === userId) ?? null;
          if (user) set({ currentUser: user });
          return user;
        },

        logout: () => set({ currentUser: null }),

        addToCart: (productId, quantity = 1) => {
          const product = get().products.find((p) => p.productId === productId);
          if (!product) return;
          const cart = [...get().cart];
          const idx = cart.findIndex((i) => i.productId === productId);
          if (idx >= 0) {
            cart[idx] = { ...cart[idx], quantity: cart[idx].quantity + quantity };
          } else {
            cart.push({
              productId: product.productId,
              name: product.name,
              price: product.price,
              quantity,
            });
          }
          set({ cart });
        },

        updateCartItem: (productId, quantity) => {
          if (quantity <= 0) {
            get().removeFromCart(productId);
            return;
          }
          set({
            cart: get().cart.map((i) =>
              i.productId === productId ? { ...i, quantity } : i,
            ),
          });
        },

        removeFromCart: (productId) =>
          set({ cart: get().cart.filter((i) => i.productId !== productId) }),

        clearCart: () => set({ cart: [] }),

        placeOrder: ({
          customerId,
          customerName,
          deliveryAddress,
          paymentMethod,
          origin,
          externalOrderId,
        }) => {
          const { cart, tenantId } = get();
          if (cart.length === 0)
            throw new Error("El carrito está vacío");

          const orderId = newId("ord");
          const total = cart.reduce(
            (acc, i) => acc + i.price * i.quantity,
            0,
          );
          const createdAt = new Date().toISOString();

          const order: Order = {
            tenantId,
            orderId,
            storeId: "store-001",
            customerId,
            customerName,
            origin,
            externalOrderId,
            items: [...cart],
            total: Number(total.toFixed(2)),
            status: "ORDER_CREATED",
            createdAt,
            updatedAt: createdAt,
            deliveryAddress,
            paymentMethod,
          };

          const firstStep = WORKFLOW_SEQUENCE[0];
          const task: WorkflowTask = {
            tenantId,
            taskId: newId("task"),
            orderId,
            storeId: order.storeId,
            stepName: firstStep,
            requiredRole: STEP_TO_ROLE[firstStep],
            status: "PENDING",
          };

          const event: OrderEvent = {
            tenantId,
            eventId: newId("evt"),
            orderId,
            storeId: order.storeId,
            eventType: "ORDER_CREATED",
            status: "ORDER_CREATED",
            createdAt,
            metadata: { origin, total: order.total },
          };

          set({
            orders: [order, ...get().orders],
            tasks: [task, ...get().tasks],
            events: [event, ...get().events],
            cart: [],
          });

          get().ensureAutoAdvance();
          return order;
        },

        advanceOrder: (orderId, step, completedByUserId) => {
          const { orders, tasks, events, users, tenantId } = get();
          const order = orders.find((o) => o.orderId === orderId);
          if (!order) return;

          const completedBy = users.find((u) => u.userId === completedByUserId);
          if (!completedBy) return;

          const newStatus = STEP_TO_STATUS[step];
          const now = new Date().toISOString();

          const updatedTasks = tasks.map((t) =>
            t.orderId === orderId && t.stepName === step
              ? {
                  ...t,
                  status: "COMPLETED" as const,
                  completedAt: now,
                  completedBy: completedBy.name,
                }
              : t,
          );

          const stepIndex = WORKFLOW_SEQUENCE.indexOf(step);
          const isLastStep = stepIndex === WORKFLOW_SEQUENCE.length - 1;
          if (!isLastStep) {
            const nextStep = WORKFLOW_SEQUENCE[stepIndex + 1];
            updatedTasks.push({
              tenantId,
              taskId: newId("task"),
              orderId,
              storeId: order.storeId,
              stepName: nextStep,
              requiredRole: STEP_TO_ROLE[nextStep],
              status: "PENDING",
            });
          }

          const updatedOrders = orders.map((o) =>
            o.orderId === orderId
              ? {
                  ...o,
                  status: newStatus,
                  updatedAt: now,
                  completedAt: isLastStep ? now : o.completedAt,
                }
              : o,
          );

          const newEvent: OrderEvent = {
            tenantId,
            eventId: newId("evt"),
            orderId,
            storeId: order.storeId,
            eventType: newStatus,
            status: newStatus,
            createdAt: now,
            metadata: { step, completedBy: completedBy.name },
          };

          set({
            orders: updatedOrders,
            tasks: updatedTasks,
            events: [newEvent, ...events],
          });
        },

        resetDemo: () => {
          const t = get().autoAdvanceTimer;
          if (t != null) clearInterval(t);
          set({ ...initialState, autoAdvanceTimer: null, products: DEMO_PRODUCTS });
        },

        toggleAutoAdvance: () => {
          const next = !get().autoAdvance;
          const t = get().autoAdvanceTimer;
          if (!next && t != null) {
            clearInterval(t);
            set({ autoAdvance: false, autoAdvanceTimer: null });
            return;
          }
          set({ autoAdvance: true });
          get().ensureAutoAdvance();
        },

        ensureAutoAdvance: () => {
          const { autoAdvance, autoAdvanceTimer, orders, tasks, users } = get();
          if (!autoAdvance) return;
          if (autoAdvanceTimer) return;

          const userByRole = (role: Role) =>
            users.find((u) => u.role === role)?.userId;

          const timer = window.setInterval(() => {
            const state = useAppStore.getState();
            if (!state.autoAdvance) {
              if (state.autoAdvanceTimer != null)
                clearInterval(state.autoAdvanceTimer);
              set({ autoAdvanceTimer: null });
              return;
            }

            const pending = state.tasks.find((t) => t.status === "PENDING");
            if (!pending) return;

            const worker = state.users.find(
              (u) => u.role === pending.requiredRole,
            );
            if (!worker) return;

            state.advanceOrder(pending.orderId, pending.stepName, worker.userId);
          }, 5000);

          set({ autoAdvanceTimer: timer });
        },
      }),
      {
        name: "popeyes-frontend-store",
        partialize: (state) => ({
          tenantId: state.tenantId,
          users: state.users,
          products: state.products,
          orders: state.orders,
          tasks: state.tasks,
          events: state.events,
          currentUser: state.currentUser,
          cart: state.cart,
        }),
      },
    ),
  ),
);

export const useOrderStatus = (orderId: string): OrderStatus | null => {
  return useAppStore((s) => s.orders.find((o) => o.orderId === orderId)?.status ?? null);
};

export const useOrderEvents = (orderId: string): OrderEvent[] => {
  const allEvents = useAppStore((s) => s.events);
  return useMemo(
    () =>
      allEvents
        .filter((e) => e.orderId === orderId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [allEvents, orderId],
  );
};
