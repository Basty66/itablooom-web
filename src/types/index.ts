export interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  deposit_amount: number;
  category: 'facial' | 'laser' | 'course';
  image_url?: string;
  active: boolean;
}

export interface Booking {
  id: string;
  service_id: string;
  service_name?: string;
  service_description?: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_rut?: string;
  booking_date: string | Date;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  deposit_paid: boolean;
  deposit_amount: number;
  total_amount: number;
  payment_id?: string;
  calendar_event_id?: string;
  notes?: string;
  created_at: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
}

export interface PaymentPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface WebhookPayload {
  type: string;
  data: {
    id: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'staff';
}
