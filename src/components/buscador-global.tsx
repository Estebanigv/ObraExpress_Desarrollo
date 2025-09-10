"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  espesor: string;
  color: string;
  precio: number;
  groupId: string;
  imagen?: string;
}

interface BuscadorGlobalProps {
  className?: string;
  placeholder?: string;
}

export const BuscadorGlobal: React.FC<BuscadorGlobalProps> = ({ 
  className = "",
  placeholder = "Buscar..."
}) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchIndex, setSearchIndex] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [isScrolling, setIsScrolling] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar productos - usando datos de muestra mientras se configura Supabase
  useEffect(() => {
    console.log('🔍 BuscadorGlobal: cargando datos de muestra');
    
    // Datos de muestra para desarrollo
    const sampleProducts: SearchResult[] = [
      {
        id: 'PC-ALV-4MM-CRIS',
        codigo: 'PC-ALV-4MM-CRIS',
        nombre: 'Policarbonato Alveolar 4mm Cristal',
        categoria: 'Policarbonato Alveolar',
        espesor: '4mm',
        color: 'Cristal',
        precio: 8900,
        groupId: 'policarbonato-alveolar',
        imagen: '/assets/images/Productos/Policarbonato Alveolar/Alveolar_Clear.webp'
      },
      {
        id: 'PC-ALV-6MM-CRIS',
        codigo: 'PC-ALV-6MM-CRIS',
        nombre: 'Policarbonato Alveolar 6mm Cristal',
        categoria: 'Policarbonato Alveolar',
        espesor: '6mm',
        color: 'Cristal',
        precio: 12500,
        groupId: 'policarbonato-alveolar',
        imagen: '/assets/images/Productos/Policarbonato Alveolar/Alveolar_Clear.webp'
      },
      {
        id: 'PC-ALV-10MM-CRIS',
        codigo: 'PC-ALV-10MM-CRIS',
        nombre: 'Policarbonato Alveolar 10mm Cristal',
        categoria: 'Policarbonato Alveolar',
        espesor: '10mm',
        color: 'Cristal',
        precio: 18900,
        groupId: 'policarbonato-alveolar',
        imagen: '/assets/images/Productos/Policarbonato Alveolar/Alveolar_Clear.webp'
      },
      {
        id: 'PC-ALV-4MM-BRONCE',
        codigo: 'PC-ALV-4MM-BRONCE',
        nombre: 'Policarbonato Alveolar 4mm Bronce',
        categoria: 'Policarbonato Alveolar',
        espesor: '4mm',
        color: 'Bronce',
        precio: 9200,
        groupId: 'policarbonato-alveolar',
        imagen: '/assets/images/Productos/Policarbonato Alveolar/Alveolar_bronce.webp'
      },
      {
        id: 'PC-ALV-6MM-BRONCE',
        codigo: 'PC-ALV-6MM-BRONCE',
        nombre: 'Policarbonato Alveolar 6mm Bronce',
        categoria: 'Policarbonato Alveolar',
        espesor: '6mm',
        color: 'Bronce',
        precio: 12800,
        groupId: 'policarbonato-alveolar',
        imagen: '/assets/images/Productos/Policarbonato Alveolar/Alveolar_bronce.webp'
      },
      {
        id: 'PC-COMP-3MM-CRIS',
        codigo: 'PC-COMP-3MM-CRIS',
        nombre: 'Policarbonato Compacto 3mm Cristal',
        categoria: 'Policarbonato Compacto',
        espesor: '3mm',
        color: 'Cristal',
        precio: 15500,
        groupId: 'policarbonato-compacto',
        imagen: '/assets/images/Productos/Policarbonato Compacto/policarbonato_compacto.webp'
      },
      {
        id: 'PC-COMP-5MM-CRIS',
        codigo: 'PC-COMP-5MM-CRIS',
        nombre: 'Policarbonato Compacto 5mm Cristal',
        categoria: 'Policarbonato Compacto',
        espesor: '5mm',
        color: 'Cristal',
        precio: 24900,
        groupId: 'policarbonato-compacto',
        imagen: '/assets/images/Productos/Policarbonato Compacto/policarbonato_compacto.webp'
      },
      {
        id: 'PERF-U-ALU',
        codigo: 'PERF-U-ALU',
        nombre: 'Perfil en U Aluminio',
        categoria: 'Perfiles Alveolar',
        espesor: 'Variable',
        color: 'Aluminio',
        precio: 3500,
        groupId: 'perfiles-alveolar',
        imagen: '/assets/images/Productos/Perfiles/Perfil_U.webp'
      },
      {
        id: 'PERF-H-ALU',
        codigo: 'PERF-H-ALU',
        nombre: 'Perfil en H Aluminio',
        categoria: 'Perfiles Alveolar',
        espesor: 'Variable',
        color: 'Aluminio',
        precio: 4200,
        groupId: 'perfiles-alveolar',
        imagen: '/assets/images/Productos/Perfiles/Perfil_U.webp'
      }
    ];
    
    // Comentado para usar API real
    // setSearchIndex(sampleProducts);
    // console.log(`✅ Productos de muestra cargados: ${sampleProducts.length} productos`);
    // return;
    
    // CÓDIGO ACTIVADO PARA USAR API REAL
    let retryCount = 0;
    const maxRetries = 3;
    let timeoutId: NodeJS.Timeout;
    
    const loadProducts = async () => {
      try {
        console.log(`🔍 Intentando cargar productos (intento ${retryCount + 1}/${maxRetries + 1})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch('/api/productos-publico', {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          const index: SearchResult[] = [];
          
          // Convertir solo los productos habilitados al formato del buscador
          if (data.productos && Array.isArray(data.productos)) {
            data.productos.forEach((producto: any) => {
              // Solo agregar productos que están realmente habilitados
              if (producto.disponible !== false && producto.stock > 0) {
                index.push({
                  id: producto.codigo,
                  codigo: producto.codigo,
                  nombre: producto.nombre,
                  categoria: producto.categoria || producto.tipo,
                  espesor: producto.espesor || 'N/A',
                  color: producto.color || 'N/A',
                  precio: producto.precio_con_iva || producto.precio || 0,
                  groupId: producto.codigo.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                  imagen: producto.ruta_imagen || '/assets/images/Productos/default.webp'
                });
              }
            });
          }
          
          setSearchIndex(index);
          console.log(`✅ Productos habilitados cargados: ${index.length} productos`);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`❌ Error cargando productos (intento ${retryCount + 1}):`, error);
        
        // Solo reintentar si no es un error de abort y no hemos alcanzado el máximo de reintentos
        if (error instanceof Error && error.name !== 'AbortError' && retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, máximo 10s
          console.log(`🔄 Reintentando en ${delay}ms...`);
          timeoutId = setTimeout(() => {
            loadProducts();
          }, delay);
        } else {
          console.warn('🚫 Máximo de reintentos alcanzado o operación cancelada. El buscador funcionará sin productos cargados.');
        }
      }
    };

    loadProducts();
    
    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Función para resaltar texto
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const terms = query.toLowerCase().split(' ').filter(Boolean);
    let highlightedText = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });
    
    return highlightedText;
  };

  // Función de búsqueda mejorada
  const performSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const terms = query.split(' ').filter(Boolean);
    
    const filtered = searchIndex.filter(item => {
      const searchableText = `${item.nombre} ${item.categoria} ${item.espesor} ${item.color} ${item.codigo}`.toLowerCase();
      
      // Búsqueda más flexible
      return terms.some(term => {
        // Coincidencia directa
        if (searchableText.includes(term)) return true;
        
        // Búsquedas específicas para términos comunes
        if (term === 'ondulado' || term === 'ondulados') {
          return searchableText.includes('ondulado');
        }
        if (term === 'perfil' || term === 'perfiles') {
          return searchableText.includes('perfil');
        }
        if (term === 'alveolar') {
          return searchableText.includes('alveolar');
        }
        if (term === 'compacto') {
          return searchableText.includes('compacto');
        }
        
        return false;
      });
    });
    
    setResults(filtered.slice(0, 6)); // Máximo 6 resultados para mejor visualización
  };

  // Efecto de búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, searchIndex]);

  // Actualizar posición del dropdown
  const updateDropdownPosition = () => {
    if (searchRef.current && !isScrolling) {
      const rect = searchRef.current.getBoundingClientRect();
      const dropdownWidth = 580; // Ancho del dropdown aumentado
      const viewportWidth = window.innerWidth;
      
      // Calcular posición left para evitar completamente el carrito flotante
      let leftPosition = rect.left;
      
      // Si el dropdown se saldría por la derecha o tocaría el carrito, moverlo más a la izquierda
      if (leftPosition + dropdownWidth > viewportWidth - 150) {
        leftPosition = viewportWidth - dropdownWidth - 150; // Mucho más espacio para el carrito
      }
      
      // Si aún se sale por la izquierda, fijarlo a 15px del borde
      if (leftPosition < 15) {
        leftPosition = 15;
      }
      
      setDropdownPosition({
        top: rect.bottom + 12,
        left: leftPosition
      });
    }
  };

  // Cleanup del scroll cuando se cierra el buscador
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }, [isOpen]);

  // Cerrar al hacer clic fuera y actualizar posición
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node) && 
          (!dropdownRef.current || !dropdownRef.current.contains(event.target as Node))) {
        setIsOpen(false);
        setQuery(''); // Limpiar la query para contraer el buscador
        document.body.style.overflow = ''; // Restaurar scroll
        document.body.style.paddingRight = ''; // Restaurar padding
      }
    };
    
    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };
    
    // Solo actualizar posición en scroll si no es scroll interno del dropdown
    const handleScroll = (e: Event) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        // Solo si el scroll no es del dropdown interno
        setIsScrolling(true);
        setTimeout(() => {
          setIsScrolling(false);
          updateDropdownPosition();
        }, 100);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    document.addEventListener('scroll', handleScroll, true); // Capture phase
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  // Actualizar posición cuando se abre el dropdown
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        updateDropdownPosition();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Manejar selección de resultado
  const handleSelectResult = (result: SearchResult) => {
    console.log('🔍 Producto seleccionado:', {
      nombre: result.nombre,
      groupId: result.groupId,
      codigo: result.codigo
    });
    
    // Navegar inmediatamente
    const url = `/productos/${result.groupId}`;
    console.log('🚀 Navegando a:', url);
    
    // Navegar primero, luego limpiar
    router.push(url);
    
    // Limpiar después de navegar
    setTimeout(() => {
      setQuery('');
      setIsOpen(false);
    }, 50);
  };

  // Manejar entrada de texto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
  };

  // Manejar teclas
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery(''); // Esto contraerá el buscador al tamaño original
      inputRef.current?.blur();
      document.body.style.overflow = ''; // Restaurar scroll
      document.body.style.paddingRight = ''; // Restaurar padding
    }
  };

  return (
    <>
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {/* Overlay muy sutil solo cuando está abierto */}
      {isOpen && (results.length > 0 || query.trim()) && (
        <div 
          className="fixed inset-0 bg-transparent"
          style={{ 
            zIndex: 9999998 // Justo debajo del dropdown
          }}
          onClick={() => {
            setIsOpen(false);
            setQuery('');
            document.body.style.overflow = ''; // Restaurar scroll
            document.body.style.paddingRight = ''; // Restaurar padding
          }}
        />
      )}
      
      <div ref={searchRef} className={`relative ${className}`}>
        {/* Buscador estilo moderno */}
        <div className="relative group">
          <div className={`
            flex items-center transition-all duration-300 ease-out
            ${query || isOpen ? 'w-60' : 'w-32'}
            h-8 bg-white border border-gray-200
            hover:border-gray-300 focus-within:border-gray-400
            rounded-md shadow-sm hover:shadow-md focus-within:shadow-lg
          `}>
            {/* Icono de lupa */}
            <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
              <svg 
                className="w-3.5 h-3.5 text-gray-400 transition-colors"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </div>
            
            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              placeholder="Buscar"
              className="flex-1 h-full bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Dropdown de resultados */}
        {isOpen && (results.length > 0 || query.trim()) && (
          <div 
            ref={dropdownRef}
            className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 overflow-y-auto scrollbar-hide"
            style={{ 
              zIndex: 9999999, // Z-index súper alto
              width: '580px',
              minWidth: '580px',
              maxWidth: '95vw',
              maxHeight: results.length <= 4 ? 'auto' : '320px', // Altura para 4 productos completos
              pointerEvents: 'auto',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
            onWheel={(e) => {
              // Solo prevenir scroll de página si hay contenido para scrollear internamente
              const container = e.currentTarget;
              const scrollTop = container.scrollTop;
              const scrollHeight = container.scrollHeight;
              const height = container.clientHeight;
              const delta = e.deltaY;
              
              // Si hay contenido para scrollear internamente
              if (scrollHeight > height) {
                // Verificar si estamos en los límites del scroll interno
                const isAtTop = scrollTop === 0 && delta < 0;
                const isAtBottom = scrollTop + height >= scrollHeight && delta > 0;
                
                if (!isAtTop && !isAtBottom) {
                  // Prevenir scroll de página solo cuando hay scroll interno disponible
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Hacer scroll interno suave
                  const newScrollTop = Math.max(0, Math.min(scrollTop + delta, scrollHeight - height));
                  container.scrollTop = newScrollTop;
                }
              } else {
                // Si no hay contenido para scrollear, prevenir scroll de página
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            {/* Header del buscador inteligente */}
            {results.length > 0 && (
              <div className="border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50">
                <div className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">Búsqueda Inteligente</div>
                        <div className="text-xs text-gray-600">Productos recomendados para tu proyecto</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contenedor con scroll para resultados */}
            <div 
              className={`${results.length > 4 ? 'max-h-[320px] overflow-y-auto' : ''}`}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9'
              }}
              onScroll={(e) => {
                e.stopPropagation();
              }}
              onWheel={(e) => {
                e.stopPropagation();
              }}
            >
              {/* Mostrar solo los primeros 10 resultados */}
              {results.slice(0, 10).map((result, index) => (
                <button
                  key={result.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectResult(result);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#eff6ff';
                    e.currentTarget.style.borderLeft = '4px solid #3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '';
                    e.currentTarget.style.borderLeft = '';
                  }}
                  className="group w-full text-left px-5 py-4 border-b border-gray-100 last:border-b-0 transition-all duration-200 cursor-pointer hover:bg-blue-50 hover:border-l-4 hover:border-l-blue-500"
                  style={{ 
                    pointerEvents: 'auto',
                    position: 'relative',
                    zIndex: '999999999'
                  }}
                >
                  <div className="flex items-center space-x-4">
                    {/* Imagen del producto */}
                    <div className="w-16 h-16 bg-gray-50 rounded-lg border border-gray-200 flex-shrink-0 overflow-hidden shadow-sm">
                      <img
                        src={result.imagen || '/assets/images/Productos/Policarbonato Alveolar/Alveolar_Clear.webp'}
                        alt={result.nombre}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback a imagen por defecto
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/assets/images/Productos/Policarbonato Alveolar/Alveolar_Clear.webp') {
                            target.src = '/assets/images/Productos/Policarbonato Alveolar/Alveolar_Clear.webp';
                          } else {
                            // Si falla también la imagen por defecto, mostrar un ícono
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                  <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                  </svg>
                                </div>
                              `;
                            }
                          }
                        }}
                      />
                    </div>

                    {/* Información del producto */}
                    <div className="flex-1 min-w-0">
                      <div 
                        className="font-semibold text-gray-900 text-lg leading-tight mb-1"
                        dangerouslySetInnerHTML={{ __html: highlightText(result.nombre, query) }}
                      />
                      <div 
                        className="text-sm text-gray-600 leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightText(`${result.categoria} • ${result.espesor} • ${result.color}`, query) 
                        }}
                      />
                    </div>

                    {/* Precio */}
                    <div className="text-right flex-shrink-0 ml-6">
                      <div className="font-bold text-blue-600 text-lg">
                        ${result.precio.toLocaleString('es-CL')}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 font-medium">
                        IVA incluido
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Indicador de scroll mejorado - sin superposición */}
            {results.length > 4 && (
              <div className="relative">
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none"></div>
                <div className="sticky bottom-0 pb-3 pt-8 bg-gradient-to-t from-white via-white/95 to-transparent">
                  <div className="flex justify-center">
                    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7" />
                        </svg>
                        <span className="text-gray-700 font-medium text-xs">
                          {results.length > 10 ? 
                            `${results.length} productos encontrados` : 
                            `Desliza para ver más`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje cuando no hay resultados de productos - mejorado */}
            {query.trim() && results.length === 0 && (
              <div className="px-5 py-8 text-center">
                <div className="text-gray-400 mb-3">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-700 font-semibold mb-2">No encontramos "{query}"</p>
                <p className="text-gray-500 text-sm mb-3">Prueba con estos términos populares:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button 
                    onClick={() => {
                      setQuery('policarbonato');
                      performSearch('policarbonato');
                    }}
                    className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 rounded-full text-xs text-gray-700 transition-colors font-medium"
                  >
                    Policarbonato
                  </button>
                  <button 
                    onClick={() => {
                      setQuery('alveolar');
                      performSearch('alveolar');
                    }}
                    className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 rounded-full text-xs text-gray-700 transition-colors font-medium"
                  >
                    Alveolar
                  </button>
                  <button 
                    onClick={() => {
                      setQuery('perfil');
                      performSearch('perfil');
                    }}
                    className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 rounded-full text-xs text-gray-700 transition-colors font-medium"
                  >
                    Perfiles
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// Hook simplificado para atajos de teclado
export const useSearchShortcut = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]');
        input?.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};