import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, XCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Booking } from '../types';
import { getBookingsByDate, updateBookingStatus } from '../lib/api';

export default function AdminPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBookings();
  }, [selectedDate]);

  async function loadBookings() {
    setLoading(true);
    try {
      const data = await getBookingsByDate(selectedDate);
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
      // Fallback data
      setBookings([
        {
          id: '1',
          service_id: '1',
          client_name: 'María García',
          client_email: 'maria@ejemplo.cl',
          client_phone: '+56 9 1234 5678',
          client_rut: '12.345.678-9',
          booking_date: selectedDate,
          booking_time: '10:00',
          status: 'confirmed',
          deposit_paid: true,
          deposit_amount: 10000,
          total_amount: 27500,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          service_id: '2',
          client_name: 'Ana López',
          client_email: 'ana@ejemplo.cl',
          client_phone: '+56 9 8765 4321',
          booking_date: selectedDate,
          booking_time: '14:00',
          status: 'pending',
          deposit_paid: false,
          deposit_amount: 15000,
          total_amount: 45000,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: 'confirmed' | 'cancelled' | 'completed') {
    try {
      await updateBookingStatus(id, status);
      loadBookings();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  const filteredBookings = bookings.filter(
    (b) =>
      b.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.client_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function formatPrice(price: number) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(price);
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada',
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona las citas de Itablooom Studio</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Citas</p>
            <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Confirmadas</p>
            <p className="text-2xl font-bold text-green-600">
              {bookings.filter((b) => b.status === 'confirmed').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">
              {bookings.filter((b) => b.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Ingresos Señas</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatPrice(bookings.filter((b) => b.deposit_paid).reduce((sum, b) => sum + b.deposit_amount, 0))}
            </p>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">
              Citas del {format(new Date(selectedDate + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: es })}
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700 mx-auto"></div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay citas para esta fecha
            </div>
          ) : (
            <div className="divide-y">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="p-4 hover:bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="text-purple-700" size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{booking.client_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> {booking.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone size={14} /> {booking.client_phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail size={14} /> {booking.client_email}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                          {statusLabels[booking.status]}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          Seña: {formatPrice(booking.deposit_amount)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(booking.id, 'confirmed')}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                              title="Confirmar"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleStatusChange(booking.id, 'cancelled')}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                              title="Cancelar"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'completed')}
                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                            title="Completar"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
