"use client";

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function usePageLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Solo mostrar loader en la carga inicial de la aplicación
    if (isFirstMount.current) {
      isFirstMount.current = false;
      setIsLoading(true);
      document.body.classList.add('loading');
      
      // Ocultar después de un tiempo corto
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setIsInitialLoad(false);
        document.body.classList.remove('loading');
      }, 1000);
      
      return () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      };
    }
    
    // Para navegación posterior, NO mostrar loader
    // Las páginas ya están en caché y cargan instantáneamente
    return () => {
      document.body.classList.remove('loading');
    };
  }, [pathname, searchParams]);

  // Solo retornar true si es la carga inicial
  return isLoading && isInitialLoad;
}