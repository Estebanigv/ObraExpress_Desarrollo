"use client";

import { Suspense, useEffect, useState } from 'react';
import { usePageLoader } from '@/hooks/usePageLoader';
import { PageLoader } from '@/components/loading-spinner';

function NavigationLoaderContent() {
  const isLoading = usePageLoader();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    if (isLoading) {
      setShouldRender(true);
      // Pequeño delay para permitir que el DOM se actualice antes de la animación
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else if (isVisible) {
      setIsVisible(false);
      // Mantener el componente renderizado durante la animación de salida
      setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }
  }, [isLoading, isVisible]);
  
  if (!shouldRender) return null;
  
  return (
    <div 
      className={`transition-opacity duration-300 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <PageLoader />
    </div>
  );
}

export function NavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderContent />
    </Suspense>
  );
}