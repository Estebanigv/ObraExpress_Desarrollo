"use client";

import React, { useState } from 'react';

interface AlveolarProfileInfoProps {
  className?: string;
  showInModal?: boolean;
}

export const AlveolarProfileInfo: React.FC<AlveolarProfileInfoProps> = ({
  className = "",
  showInModal = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const ProfileContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center border-b border-gray-200 pb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          🔧 Funcionamiento de los Perfiles en Policarbonato Alveolar
        </h3>
        <p className="text-sm text-gray-600">
          Información esencial para una instalación profesional
        </p>
      </div>

      {/* Perfil Clip Plano */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-blue-900 mb-2">🔹 Perfil Clip Plano</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Función:</strong> Unir planchas de policarbonato alveolar en el largo</li>
              <li>• <strong>Compatibilidad:</strong> Todos los espesores (4, 6, 8, 10 mm) y colores</li>
              <li>• <strong>Largos disponibles:</strong> El largo del perfil debe coincidir con el largo de la plancha:</li>
              <div className="ml-4 mt-2 space-y-1 text-xs">
                <li>→ Planchas 2,90 m → perfil clip 2,90 m</li>
                <li>→ Planchas 5,80 m → perfil clip 5,80 m</li>
                <li>→ Planchas 8,70 m → perfil clip 8,70 m</li>
                <li>→ Planchas 11,60 m → perfil clip 11,60 m</li>
              </div>
              <li className="mt-2">• <strong>Color:</strong> Solo Clear (sirve para todos los colores de plancha)</li>
            </ul>
            <div className="mt-3 p-3 bg-blue-100 rounded-lg">
              <p className="text-sm font-semibold text-blue-800">
                👉 <strong>Recomendación de compra:</strong> Una unidad menos de perfil clip respecto a la cantidad de planchas
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Ejemplo: 5 planchas → 4 perfiles clip
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Perfil U */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-green-900 mb-2">🔹 Perfil U</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Función:</strong> Cerrar las celdas en los bordes de las planchas</li>
              <li>• <strong>Previene:</strong> Ingreso de polvo, agua e insectos + mejora terminación</li>
              <li>• <strong>Ubicación:</strong> Se instala en bordes superior e inferior de cada plancha</li>
              <li>• <strong>Especificaciones por espesor:</strong></li>
              <div className="ml-4 mt-2 space-y-1 text-xs">
                <li>→ <strong>Perfil U 4-6 mm:</strong> Para planchas de 4mm y 6mm</li>
                <li>→ <strong>Perfil U 8-10 mm:</strong> Para planchas de 8mm y 10mm</li>
              </div>
              <li>• <strong>Largos disponibles:</strong> 1,05 m y 2,10 m (coinciden con ancho de plancha)</li>
              <li>• <strong>Color:</strong> Solo Clear (sirve para todos los colores de plancha)</li>
            </ul>
            <div className="mt-3 p-3 bg-green-100 rounded-lg">
              <p className="text-sm font-semibold text-green-800">
                👉 <strong>Recomendación de compra:</strong> 2 perfiles U por cada plancha de policarbonato alveolar
              </p>
              <p className="text-xs text-green-600 mt-1">
                Para proteger borde superior e inferior
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="text-center">
          <h4 className="font-bold text-amber-900 mb-3">📌 Resumen Rápido</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3 border border-amber-200">
              <div className="font-semibold text-amber-800 mb-1">Perfil Clip Plano</div>
              <div className="text-gray-600">Une planchas en el largo</div>
              <div className="text-xs text-amber-600">(1 menos que cantidad de planchas)</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-amber-200">
              <div className="font-semibold text-amber-800 mb-1">Perfil U</div>
              <div className="text-gray-600">Sella bordes superior e inferior</div>
              <div className="text-xs text-amber-600">(2 por plancha)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (showInModal) {
    return (
      <>
        {/* Trigger button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors ${className}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Info Perfiles</span>
        </button>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-lg font-bold text-gray-900">Información de Perfiles</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <ProfileContent />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      <ProfileContent />
    </div>
  );
};

export default AlveolarProfileInfo;