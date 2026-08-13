import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Clock, User, Mail, Phone, CreditCard, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Service, TimeSlot } from '../types';
import { getServices, getAvailableTimeSlots, createPreference } from '../lib/api';

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rut: '',
    notes: '',
  });

  useEffect(() => {
    loadServices();
    const serviceId = searchParams.get('service');
    if (serviceId) {
      setSelectedService(services.find(s => s.id === serviceId) || null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      loadTimeSlots();
    }
  }, [selectedDate, selectedService]);

  async function loadServices() {
    try {
      const data = await getServices();
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  }

  async function loadTimeSlots() {
    if (!selectedDate || !selectedService) return;
    setLoadingSlots(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const slots = await getAvailableTimeSlots(dateStr, selectedService.id);
      setTimeSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(price);
  }

  function getDaysOfWeek() {
    const days = [];
    for (let i = 0; i < 14; i++) {
      const date = addDays(startOfDay(new Date()), i);
      days.push(date);
    }
    return days;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    setLoadingPayment(true);
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const result = await createPreference({
        serviceId: selectedService.id,
        clientName: formData.name,
        clientEmail: formData.email,
        clientPhone: formData.phone,
        clientRut: formData.rut,
        date: dateStr,
        time: selectedTime,
        notes: formData.notes,
      });
      
      // Redirect to Mercado Pago
      window.location.href = result.init_point;
    } catch (error) {
      console.error('Error creating preference:', error);
      alert('Error al procesar el pago. Por favor, intenta nuevamente.');
    } finally {
      setLoadingPayment(false);
    }
  }

  function isStepComplete() {
    switch (step) {
      case 1:
        return selectedService !== null;
      case 2:
        return selectedDate !== null && selectedTime !== '';
      case 3:
        return formData.name && formData.email && formData.phone;
      default:
        return false;
    }
  }

  const steps = [
    { num: 1, label: 'Servicio' },
    { num: 2, label: 'Fecha y Hora' },
    { num: 3, label: 'Tus Datos' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s.num
                      ? 'bg-purple-700 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s.num ? <Check size={20} /> : s.num}
                </div>
                <span className={`ml-2 text-sm font-medium ${step >= s.num ? 'text-purple-700' : 'text-gray-500'}`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-4 ${step > s.num ? 'bg-purple-700' : 'bg-gray-200'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Select Service */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Selecciona tu Servicio</h2>
              <div className="grid gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedService(service)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedService?.id === service.id
                        ? 'border-purple-700 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> {service.duration_minutes} min
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard size={14} /> Seña: {formatPrice(service.deposit_amount)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-purple-700">{formatPrice(service.price)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Date and Time */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Elige Fecha y Hora</h2>
              
              {/* Calendar */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar size={20} /> Selecciona un día
                </h3>
                <div className="grid grid-cols-7 gap-2">
                  {getDaysOfWeek().map((date) => {
                    const dayName = format(date, 'EEE', { locale: es });
                    const dayNum = format(date, 'd');
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const isSunday = date.getDay() === 0;
                    
                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        disabled={isSunday}
                        onClick={() => setSelectedDate(date)}
                        className={`p-3 rounded-xl text-center transition-all ${
                          isSunday
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-purple-700 text-white'
                            : 'bg-gray-50 hover:bg-purple-100 text-gray-700'
                        }`}
                      >
                        <div className="text-xs capitalize">{dayName}</div>
                        <div className="text-lg font-bold">{dayNum}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock size={20} /> Horarios disponibles
                  </h3>
                  {loadingSlots ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin rounded-full h-8 w-8 text-purple-700" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                            !slot.available
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : selectedTime === slot.time
                              ? 'bg-purple-700 text-white'
                              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Personal Info */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tus Datos</h2>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="María García"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="maria@ejemplo.cl"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RUT (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.rut}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="12.345.678-9"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Alergias, condiciones médicas, etc."
                />
              </div>

              {/* Summary */}
              {selectedService && selectedDate && selectedTime && (
                <div className="bg-purple-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Resumen de tu Cita</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Servicio:</strong> {selectedService.name}</p>
                    <p><strong>Fecha:</strong> {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</p>
                    <p><strong>Hora:</strong> {selectedTime}</p>
                    <p><strong>Seña a pagar:</strong> {formatPrice(selectedService.deposit_amount)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <ChevronLeft size={18} />
                Anterior
              </button>
            )}
            <button
              type="submit"
              disabled={!isStepComplete() || loadingPayment}
              className={`ml-auto flex items-center gap-2 px-8 py-3 rounded-lg font-semibold ${
                isStepComplete() && !loadingPayment
                  ? 'bg-purple-700 text-white hover:bg-purple-800'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loadingPayment ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Procesando...
                </>
              ) : step === 3 ? (
                <>
                  <CreditCard size={18} />
                  Pagar con Mercado Pago
                </>
              ) : (
                <>
                  Siguiente
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
