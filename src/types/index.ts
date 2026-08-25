export interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  /**
   * Minutos del trabajo más elaborado. Es lo que se bloquea en la agenda,
   * aunque a la clienta se le muestre el rango completo.
   */
  duration_max_minutes?: number | null;
  price: number;
  /**
   * Techo del rango, cuando el valor depende del largo y del diseño. Si viene,
   * `price` es el piso y el valor exacto se define en el estudio.
   */
  price_max?: number | null;
  /**
   * Se suma a otro servicio y no se reserva como hora propia: el visajismo es
   * diseño de cejas que acompaña, nunca la visita completa. Aparece en el
   * catálogo con su valor, pero fuera de la lista de lo agendable.
   */
  es_complemento?: boolean;
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
  /** no_show: la clienta no llegó; el depósito queda como ingreso. */
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  deposit_paid: boolean;
  deposit_amount: number;
  total_amount: number;
  payment_id?: string;
  calendar_event_id?: string;
  deposit_paid_at?: string;
  remaining_paid?: boolean;
  remaining_paid_at?: string;
  remaining_paid_method?: 'mp' | 'cash' | 'transfer';
  no_show_at?: string;
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
