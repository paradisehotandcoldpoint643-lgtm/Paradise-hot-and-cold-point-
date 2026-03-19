export type Category = 
  | 'Birthday' 
  | 'Engagement' 
  | 'Wedding' 
  | 'Anniversary' 
  | 'Custom Cakes' 
  | 'Kids Cakes' 
  | 'Cupcakes' 
  | 'Pastries';

export interface CartItem extends Product {
  quantity: number;
  weight?: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'out-for-delivery' 
  | 'delivered' 
  | 'cancelled';

export interface Product {
  id: string;
  name: string;
  price: number; // Default price (usually for 1kg)
  weightPrices?: Record<string, number>; // Mapping like {"500g": 400, "1kg": 800}
  description: string;
  image: string;
  category: string; // Changed from Category to string for more flexibility
  available: boolean;
  createdAt: number;
  rating?: number;
  reviews?: number;
  prepTime?: string;
  ingredients?: string[];
  weight?: string;
}

export type OrderType = 'delivery' | 'pickup';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  orderType: OrderType;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  deliveryDistance?: number;
  deliveryFee?: number;
  paymentMethod: 'UPI' | 'COD';
  paymentScreenshot?: string;
  paymentVerified: boolean;
  paymentStatus: 'pending' | 'verified' | 'failed';
  createdAt: number;
  customerName?: string; // Added for compatibility
  customerPhone?: string; // Added for compatibility
  customerAddress?: string; // Added for compatibility
}

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  role: 'customer' | 'admin' | 'delivery';
  totalOrders: number;
  totalReviews: number;
  createdAt: number;
}

export interface ShopSettings {
  isOpen: boolean;
  isDeliveryAvailable: boolean;
  deliveryRadiusKm: number;
  deliveryRatePerKm: number;
  defaultAddress: string;
  ownerPhone: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: number;
}
