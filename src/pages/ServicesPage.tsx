import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, DollarSign, ArrowRight } from 'lucide-react';
import type { Service } from '../types';
import { getServices } from '../lib/api';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const data = await getServices();
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
      // Fallback data
      setServices([
        {
          id: '1',
          name: 'Limpieza Profunda',
          description: 'Limpieza facial profunda con extracción de impurezas, mascarilla hidratante y masaje relajante.',
          duration_minutes: 60,
          price: 27500,
          deposit_amount: 10000,
          category: 'facial',
          active: true,
        },
        {
          id: '2',
          name: 'Microneedling',
          description: 'Tratamiento de microneedling para renovación celular, cicatrices de acné y rejuvenecimiento.',
          duration_minutes: 90,
          price: 45000,
          deposit_amount: 15000,
          category: 'facial',
          active: true,
        },
        {
          id: '3',
          name: 'Depilación Láser',
          description: 'Depilación láser definitiva. Zonas: axilas, bigote, cejas, piernas, brazos.',
          duration_minutes: 30,
          price: 15000,
          deposit_amount: 5000,
          category: 'laser',
          active: true,
        },
        {
          id: '4',
          name: 'Curso Esmaltado Permanente',
          description: 'Curso presencial de esmaltado permanente. Incluye materiales y certificado.',
          duration_minutes: 240,
          price: 85000,
          deposit_amount: 30000,
          category: 'course',
          active: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'facial', label: 'Facial' },
    { id: 'laser', label: 'Láser' },
    { id: 'course', label: 'Cursos' },
  ];

  const filteredServices = activeCategory === 'all' 
    ? services 
    : services.filter(s => s.category === activeCategory);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Nuestros Servicios</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Tratamientos faciales, depilación láser y cursos de esmaltado permanente
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-purple-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-purple-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden"
            >
              <div className="h-48 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <span className="text-6xl">
                  {service.category === 'facial' ? '✨' : service.category === 'laser' ? '💫' : '💅'}
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full capitalize">
                    {service.category === 'facial' ? 'Facial' : service.category === 'laser' ? 'Láser' : 'Curso'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{service.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign size={16} />
                    <span>Seña: {formatPrice(service.deposit_amount)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Precio</p>
                    <p className="text-2xl font-bold text-purple-700">{formatPrice(service.price)}</p>
                  </div>
                  <Link
                    to={`/agendar?service=${service.id}`}
                    className="bg-purple-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-800 transition-colors inline-flex items-center gap-2"
                  >
                    Agendar
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay servicios disponibles en esta categoría.
          </div>
        )}
      </div>
    </div>
  );
}
