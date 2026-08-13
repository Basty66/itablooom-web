import { Instagram, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-purple-400 mb-4">Itablooom Studio</h3>
            <p className="text-gray-400 text-sm">
              Estética facial profesional. Microneedling, depilación láser, limpiezas profundas y cursos de esmaltado permanente.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <div className="space-y-2 text-gray-400 text-sm">
              <a href="https://wa.me/56900000000" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 hover:text-purple-400">
                <Phone size={16} />
                <span>+56 9 0000 0000</span>
              </a>
              <a href="mailto:hola@itablooom.cl" className="flex items-center space-x-2 hover:text-purple-400">
                <Mail size={16} />
                <span>hola@itablooom.cl</span>
              </a>
              <a href="https://instagram.com/itablooom.studio" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 hover:text-purple-400">
                <Instagram size={16} />
                <span>@itablooom.studio</span>
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Horario</h4>
            <div className="text-gray-400 text-sm space-y-1">
              <p>Lunes a Viernes: 9:00 - 19:00</p>
              <p>Sábados: 9:00 - 14:00</p>
              <p>Domingos: Cerrado</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; 2026 Itablooom Studio. Todos los derechos reservados.</p>
          <p className="mt-1">Diseñado y Desarrollado por opencode</p>
        </div>
      </div>
    </footer>
  );
}
