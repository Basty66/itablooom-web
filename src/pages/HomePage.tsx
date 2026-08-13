import { Link } from 'react-router-dom';
import { Calendar, CreditCard, MessageCircle, Sparkles, Clock, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Tu Recepcionista Digital
              <span className="block text-purple-300">24/7</span>
            </h1>
            <p className="text-xl text-gray-200 mb-8">
              Agenda tus tratamientos de estética en segundos. Pago seguro, confirmación inmediata y recordatorios automáticos por WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/agendar"
                className="bg-white text-purple-900 px-8 py-4 rounded-lg font-semibold hover:bg-purple-100 transition-colors inline-flex items-center justify-center space-x-2"
              >
                <Calendar size={20} />
                <span>Agendar Cita</span>
              </Link>
              <Link
                to="/servicios"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors inline-flex items-center justify-center space-x-2"
              >
                <Sparkles size={20} />
                <span>Ver Servicios</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Cómo Funciona?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Un proceso simple y automático para que tú solo te preocupes de lucir hermosa
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="text-purple-700" size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Elige tu Servicio</h3>
              <p className="text-gray-600">
                Revisa nuestro catálogo de tratamientos y selecciona el servicio que necesitas con su fecha y hora disponible.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <CreditCard className="text-purple-700" size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Paga tu Seña</h3>
              <p className="text-gray-600">
                Confirma tu cita con un depósito seguro a través de Mercado Pago. Acepta tarjetas de débito, crédito y Webpay.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <MessageCircle className="text-purple-700" size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Recibe Confirmación</h3>
              <p className="text-gray-600">
                Recibe un comprobante por correo y un recordatorio automático por WhatsApp 24 horas antes de tu cita.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                ¿Por Qué Elegirnos?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Ahorra Tiempo</h4>
                    <p className="text-gray-600">Sin esperas ni mensajes directos. Agenda en segundos desde tu celular.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Pago Seguro</h4>
                    <p className="text-gray-600">Transacciones protegidas por Mercado Pago. Tus datos están seguros.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Recordatorios Automáticos</h4>
                    <p className="text-gray-600">Te recordamos tu cita por WhatsApp para que nunca la olvides.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl p-8 md:p-12">
              <div className="text-center">
                <div className="text-6xl font-bold text-purple-700 mb-2">24/7</div>
                <p className="text-xl text-gray-700 mb-6">Disponible siempre</p>
                <p className="text-gray-600">
                  Agenda tu cita a cualquier hora del día, todos los días. Sin restricciones de horario.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-purple-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Lista para Agendar?
          </h2>
          <p className="text-xl text-purple-200 mb-8">
            No pierdas más tiempo en chats. Agenda tu tratamiento ahora mismo.
          </p>
          <Link
            to="/agendar"
            className="bg-white text-purple-900 px-10 py-4 rounded-lg font-semibold hover:bg-purple-100 transition-colors inline-flex items-center space-x-2"
          >
            <Calendar size={20} />
            <span>Agendar Mi Cita</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
