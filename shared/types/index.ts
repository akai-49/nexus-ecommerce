export interface IUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isEmailVerified: boolean;
  googleId?: string;
  isActive: boolean;
  roles?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IAddress {
  id: string;
  userId: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  children?: ICategory[];
}

export interface IProductImage {
  id: string;
  variantId: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface IInventory {
  id: string;
  variantId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
}

export interface IProductVariant {
  id: string;
  productId: string;
  sku: string;
  price?: number | string; // variant price override
  compareAtPrice?: number | string;
  costPrice?: number | string;
  color?: string;
  size?: string;
  weight?: number;
  dimensions?: string;
  isActive: boolean;
  images?: IProductImage[];
  inventory?: IInventory[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  summary?: string;
  categoryId: string;
  brandId: string;
  basePrice: number | string;
  status: string;
  ratingAverage: number;
  reviewCount: number;
  tags: string[];
  metadata?: Record<string, any>;
  category?: ICategory;
  brand?: IBrand;
  variants?: IProductVariant[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ICartItem {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  variant?: IProductVariant & { product?: IProduct };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ICart {
  id: string;
  userId?: string;
  items: ICartItem[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IWishlistItem {
  id: string;
  wishlistId: string;
  variantId: string;
  variant?: IProductVariant & { product?: IProduct };
  createdAt: Date | string;
}

export interface IWishlist {
  id: string;
  userId: string;
  items: IWishlistItem[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ICoupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number | string;
  minOrderValue?: number | string;
  maxDiscountAmount?: number | string;
  startDate: Date | string;
  endDate: Date | string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
}

export interface IOrderItem {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  price: number | string;
  discount: number | string;
  total: number | string;
  variant?: IProductVariant & { product?: IProduct };
}

export interface IOrder {
  id: string;
  orderNumber: string;
  userId?: string;
  status: string;
  subtotal: number | string;
  discount: number | string;
  shippingFee: number | string;
  tax: number | string;
  total: number | string;
  couponCode?: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddressJson: any;
  billingAddressJson: any;
  shippingProvider?: string;
  shippingTrackingId?: string;
  estimatedDelivery?: Date | string;
  notes?: string;
  items: IOrderItem[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IPayment {
  id: string;
  orderId: string;
  amount: number | string;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IReview {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
  isApproved: boolean;
  replies?: any;
  user?: IUser;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  sentAt?: Date | string;
  createdAt: Date | string;
}

export interface IAuditLog {
  id: string;
  userId?: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  createdAt: Date | string;
}

export interface ISetting {
  id: string;
  key: string;
  value: string;
  group: string;
}
