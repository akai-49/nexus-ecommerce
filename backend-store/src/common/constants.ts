// Inlined from shared/constants to support standalone Railway deployment
// (monorepo root is not available during Railway build)

export enum Roles {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PRODUCT_MANAGER = 'PRODUCT_MANAGER',
  ORDER_MANAGER = 'ORDER_MANAGER',
  CUSTOMER = 'CUSTOMER',
}

export enum Permissions {
  MANAGE_PRODUCTS = 'product:manage',
  MANAGE_ORDERS = 'order:manage',
  MANAGE_USERS = 'user:manage',
  MANAGE_SETTINGS = 'settings:manage',
  VIEW_ANALYTICS = 'analytics:view',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  STRIPE = 'STRIPE',
  RAZORPAY = 'RAZORPAY',
  PAYPAL = 'PAYPAL',
  COD = 'COD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}
