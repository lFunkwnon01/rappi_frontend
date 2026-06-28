/**
 * Tipos compartidos entre el cliente API y el resto de la app.
 * Mantener sincronizados con el backend (rappi/src/shared/types/index.py).
 */

export type Role =
  | "CLIENT"
  | "RESTAURANT_WORKER"
  | "COOK"
  | "DISPATCHER"
  | "DELIVERY_DRIVER"
  | "ADMIN";

export type OrderStatus =
  | "PAYMENT_PENDING"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_FAILED"
  | "ORDER_CREATED"
  | "ORDER_RECEIVED"
  | "COOKED"
  | "PACKED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export type OrderOrigin = "WEB_POPEYES" | "RAPPI";

export type WorkflowStep =
  | "RECEIVE_ORDER"
  | "COOK_ORDER"
  | "PACK_ORDER"
  | "DELIVER_ORDER"
  | "CONFIRM_RECEPTION";

export type PaymentMethod = "YAPE" | "PLIN" | "EFECTIVO" | "TARJETA";

export type ProductCategory =
  | "POLLOS"
  | "BUCKETS"
  | "SANDWICHES"
  | "SIDES"
  | "BEBIDAS"
  | "POSTRES"
  | "COMBOS"
  | string;

export interface User {
  userId: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string;
  storeId: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Store {
  tenantId: string;
  storeId: string;
  name: string;
  address: string;
  active: boolean;
}

export interface Product {
  tenantId: string;
  storeId: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl: string;
  active: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderItemPayload {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CreateOrderInput {
  storeId: string;
  items: OrderItemPayload[];
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  customerName?: string;
}

export interface Order {
  tenantId: string;
  orderId: string;
  storeId: string;
  customerId: string;
  customerName: string;
  origin: OrderOrigin;
  externalOrderId?: string | null;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
}

export interface OrderEvent {
  tenantId: string;
  eventId: string;
  orderId: string;
  storeId: string;
  eventType: string;
  status: OrderStatus;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowTask {
  tenantId: string;
  taskId: string;
  orderId: string;
  storeId: string;
  stepName: WorkflowStep;
  requiredRole: Role;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  startedAt?: string;
  completedAt?: string;
  completedBy?: string;
}

export interface DashboardSummary {
  totalOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByOrigin: Record<OrderOrigin, number>;
  ordersByStore: Record<string, number>;
  averageTimeByStep: Record<WorkflowStep, number>;
  recentOrders: Order[];
}
