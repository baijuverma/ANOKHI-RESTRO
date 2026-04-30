export type Role = 'admin' | 'staff';

export interface User {
    id: string;
    email?: string;
    restaurant_id: string | null;
    role: Role;
    created_at: string;
}

export interface Restaurant {
    id: string;
    name: string;
    gst_number?: string;
    address?: string;
    phone?: string;
    logo_url?: string;
    gst_enabled: boolean;
    gst_percentage: number;
    printer_size: '58mm' | '80mm' | 'A4';
    invoice_template?: 'classic' | 'modern' | 'minimal' | 'elegant' | 'professional';
    owner_id: string;
    created_at: string;
}

export interface Item {
    id: string;
    restaurant_id: string;
    name: string;
    category: string;
    price: number;
    is_active: boolean;
    created_at: string;
    image_url?: string;
}

export interface Order {
    id: string;
    restaurant_id: string;
    bill_number: number;
    customer_name?: string;
    customer_phone?: string;
    gst_enabled: boolean;
    subtotal: number;
    gst_amount: number;
    discount_amount?: number;
    total: number;
    payment_method: 'cash' | 'card' | 'upi' | 'credit' | 'other';
    amount_paid?: number;
    status: 'completed' | 'cancelled' | 'pending';
    created_at: string;
    items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    item_id: string;
    item_name: string;
    quantity: number;
    price: number;
    total_price: number;
}

export interface Expense {
    id: string;
    restaurant_id: string;
    category: string;
    amount: number;
    description?: string;
    expense_date: string;
    created_at: string;
}
