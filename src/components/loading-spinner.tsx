"use client";

import React from 'react';
import Image from 'next/image';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large' | 'full';
  text?: string;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  text = 'Cargando...',
  overlay = false 
}) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
    full: 'w-40 h-40'
  };

  const spinnerSizeClasses = {
    small: 'w-20 h-20',
    medium: 'w-32 h-32',
    large: 'w-40 h-40',
    full: 'w-48 h-48'
  };

  const content = (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        {/* Logo centrado */}
        <div className={`relative ${sizeClasses[size]} z-10`}>
          <Image
            src="/assets/images/Logotipo/Untitled Project.png"
            alt="ObraExpress"
            width={160}
            height={160}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        
        {/* Círculo giratorio alrededor del logo */}
        <div className={`absolute inset-0 flex items-center justify-center ${spinnerSizeClasses[size]}`}>
          <div className="absolute inset-0 -m-4">
            <svg
              className="animate-spin"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="url(#gradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="200 50"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
                  <stop offset="50%" stopColor="#d97706" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Puntos animados opcionales */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${spinnerSizeClasses[size]} relative`}>
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-500 rounded-full animate-pulse animation-delay-200" />
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full animate-pulse animation-delay-400" />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full animate-pulse animation-delay-600" />
          </div>
        </div>
      </div>
      
      {/* Texto de carga */}
      {text && (
        <div className="mt-6">
          <p className="text-gray-700 font-medium text-sm animate-pulse">
            {text}
          </p>
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export const PageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden pointer-events-auto">
      {/* Fondo simple con blur - con z-index alto */}
      <div className="absolute inset-0 bg-white/98 backdrop-blur-md z-[99998]" />
      
      {/* Contenedor centrado - Solo logo y círculo */}
      <div className="relative h-full flex items-center justify-center z-[99999]">
        <div className="relative">
          {/* Logo con fondo circular */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-white shadow-xl z-10">
            <Image
              src="/assets/images/Logotipo/Untitled Project.png"
              alt="ObraExpress"
              width={128}
              height={128}
              className="w-full h-full object-contain p-4"
              priority
            />
          </div>
          
          {/* Círculo de carga alrededor del logo */}
          <div className="absolute inset-0 -m-3">
            <svg
              className="w-38 h-38 animate-spin-slow"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Círculo de fondo gris muy sutil */}
              <circle
                cx="50"
                cy="50"
                r="48"
                stroke="#f3f4f6"
                strokeWidth="1"
                fill="none"
                opacity="0.5"
              />
              {/* Círculo de progreso amarillo fino */}
              <circle
                cx="50"
                cy="50"
                r="48"
                stroke="url(#gradient-loader-pro)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="301.59"
                className="animate-loader-draw"
                style={{
                  transformOrigin: 'center',
                  transform: 'rotate(-90deg)',
                }}
              />
              <defs>
                <linearGradient id="gradient-loader-pro" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;