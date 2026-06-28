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

export interface User {
  userId: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string;
  storeId: string;
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

export type ProductCategory =
  | "POLLOS"
  | "BUCKETS"
  | "SANDWICHES"
  | "SIDES"
  | "BEBIDAS"
  | "POSTRES"
  | "COMBOS";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  tenantId: string;
  orderId: string;
  storeId: string;
  customerId: string;
  customerName: string;
  origin: OrderOrigin;
  externalOrderId?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deliveryAddress: string;
  paymentMethod: "YAPE" | "PLIN" | "EFECTIVO" | "TARJETA";
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

export type WorkflowStep =
  | "RECEIVE_ORDER"
  | "COOK_ORDER"
  | "PACK_ORDER"
  | "DELIVER_ORDER"
  | "CONFIRM_RECEPTION";

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

export const WORKFLOW_SEQUENCE: WorkflowStep[] = [
  "RECEIVE_ORDER",
  "COOK_ORDER",
  "PACK_ORDER",
  "DELIVER_ORDER",
  "CONFIRM_RECEPTION",
];

export const STEP_TO_STATUS: Record<WorkflowStep, OrderStatus> = {
  RECEIVE_ORDER: "ORDER_RECEIVED",
  COOK_ORDER: "COOKED",
  PACK_ORDER: "PACKED",
  DELIVER_ORDER: "DELIVERED",
  CONFIRM_RECEPTION: "COMPLETED",
};

export const STEP_TO_ROLE: Record<WorkflowStep, Role> = {
  RECEIVE_ORDER: "RESTAURANT_WORKER",
  COOK_ORDER: "COOK",
  PACK_ORDER: "DISPATCHER",
  DELIVER_ORDER: "DELIVERY_DRIVER",
  CONFIRM_RECEPTION: "CLIENT",
};

export const STEP_LABEL: Record<WorkflowStep, string> = {
  RECEIVE_ORDER: "Recibir pedido",
  COOK_ORDER: "Cocinar",
  PACK_ORDER: "Empacar",
  DELIVER_ORDER: "Entregar",
  CONFIRM_RECEPTION: "Confirmar recepción",
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PAYMENT_PENDING: "Esperando pago",
  PAYMENT_CONFIRMED: "Pago confirmado",
  PAYMENT_FAILED: "Pago rechazado",
  ORDER_CREATED: "Pedido creado",
  ORDER_RECEIVED: "Pedido recibido",
  COOKED: "Cocinado",
  PACKED: "Empacado",
  DELIVERED: "Entregado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  PAYMENT_PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  PAYMENT_CONFIRMED: "bg-sky-100 text-sky-800 border-sky-300",
  PAYMENT_FAILED: "bg-red-100 text-red-800 border-red-300",
  ORDER_CREATED: "bg-slate-100 text-slate-700 border-slate-300",
  ORDER_RECEIVED: "bg-amber-100 text-amber-800 border-amber-300",
  COOKED: "bg-orange-100 text-orange-800 border-orange-300",
  PACKED: "bg-yellow-100 text-yellow-800 border-yellow-300",
  DELIVERED: "bg-blue-100 text-blue-800 border-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  CANCELLED: "bg-gray-200 text-gray-700 border-gray-400",
};

export const ROLE_LABEL: Record<Role, string> = {
  CLIENT: "Cliente",
  RESTAURANT_WORKER: "Recepcionista",
  COOK: "Cocinero",
  DISPATCHER: "Despachador",
  DELIVERY_DRIVER: "Repartidor",
  ADMIN: "Administrador",
};
