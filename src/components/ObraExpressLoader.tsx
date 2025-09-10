"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface ObraExpressLoaderProps {
  message?: string;
  showPercentage?: boolean;
  duration?: number; // Duración en segundos para completar el porcentaje
}

export default function ObraExpressLoader({ 
  message = "Cargando productos...", 
  showPercentage = true,
  duration = 3 
}: ObraExpressLoaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!showPercentage) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Incremento más rápido al inicio, más lento al final (efecto realista)
        const increment = prev < 30 ? 3 : prev < 60 ? 2 : prev < 90 ? 1 : 0.5;
        return Math.min(prev + increment, 100);
      });
    }, duration * 10); // Convertir duración a ms y dividir por incrementos

    return () => clearInterval(interval);
  }, [showPercentage, duration]);

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
}

// Componente más simple para casos donde no necesitas porcentaje
export function SimpleObraExpressLoader({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 relative">
          <Image
            src="/assets/images/Logotipo/Gemini_Generated_Image_pl5okapl5okapl5o.webp"
            alt="ObraExpress Logo"
            width={48}
            height={48}
            className="w-full h-full object-contain animate-spin"
            style={{ animationDuration: '2s' }}
          />
        </div>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
}