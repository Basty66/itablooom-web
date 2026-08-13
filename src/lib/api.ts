import sql from './database';
import type { Service, Booking, TimeSlot } from '../types';

const API_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3001';

export async function getServices(): Promise<Service[]> {
  try {
    const result = await sql`
      SELECT * FROM services WHERE active = true ORDER BY category, name
    `;
    return result as unknown as Service[];
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
}

export async function getServiceById(id: string): Promise<Service | null> {
  try {
    const result = await sql`
      SELECT * FROM services WHERE id = ${id} AND active = true
    `;
    return (result[0] as unknown as Service) || null;
  } catch (error) {
    console.error('Error fetching service:', error);
    throw error;
  }
}

export async function getAvailableTimeSlots(date: string, serviceId: string): Promise<TimeSlot[]> {
  try {
    const response = await fetch(`${API_URL}/api/time-slots?date=${date}&serviceId=${serviceId}`);
    if (!response.ok) throw new Error('Failed to fetch time slots');
    return await response.json();
  } catch (error) {
    console.error('Error fetching time slots:', error);
    // Fallback to generate slots locally
    const service = await getServiceById(serviceId);
    if (!service) return [];
    
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 19;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        slots.push({
          time,
          available: true,
        });
      }
    }
    
    return slots;
  }
}

export async function createPreference(data: {
  serviceId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientRut?: string;
  date: string;
  time: string;
  notes?: string;
}): Promise<{ id: string; init_point: string; sandbox_init_point: string; bookingId: string }> {
  const response = await fetch(`${API_URL}/api/create-preference`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create preference');
  }
  
  return await response.json();
}

export async function getBookingById(id: string): Promise<Booking | null> {
  try {
    const result = await sql`
      SELECT b.*, s.name as service_name, s.description as service_description
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.id = ${id}
    `;
    return (result[0] as unknown as Booking) || null;
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
}

export async function getBookingsByDate(date: string): Promise<Booking[]> {
  try {
    const result = await sql`
      SELECT b.*, s.name as service_name 
      FROM bookings b 
      JOIN services s ON b.service_id = s.id 
      WHERE b.booking_date = ${date} 
      ORDER BY b.booking_time
    `;
    return result as unknown as Booking[];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
}

export async function updateBookingStatus(id: string, status: Booking['status']): Promise<void> {
  try {
    await sql`
      UPDATE bookings SET status = ${status} WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
}
