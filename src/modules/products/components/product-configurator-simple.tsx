"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { TechnicalSpecsModal } from '@/components/technical-specs-modal';
import { getProductSpecifications } from '@/utils/product-specifications';
import DispatchCalendarModal from '@/components/dispatch-calendar-modal';
import { formatCurrency } from '@/utils/format-currency';
import { getProductDimensionInfo, calculateProductArea, formatDimensionForDisplay } from '@/utils/dimension-pricing';

interface ProductVariant {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  tipo: string;
  precio_neto?: number;
  precio_con_iva: number;
  precio?: number; // Alias para precio_con_iva
  espesor: string;
  dimensiones: string;
  ancho?: string;
  largo?: string;
  color: string;
  uso: string;
  stock: number;
  uv_protection: boolean;
  garantia: string;
  disponible?: boolean;
  imagen?: string;
}

interface ProductGroup {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  tipo?: string;
  variantes: ProductVariant[];
  colores: string[];
  espesores?: string[];
  dimensiones?: string[];
  precio_desde: number;
  stock_total: number;
  variantes_count: number;
  imagen: string;
  etiqueta?: string;
}

interface ProductConfiguratorSimpleProps {
  productGroup: ProductGroup;
  className?: string;
}

function ProductConfiguratorSimple({ productGroup, className = '' }: ProductConfiguratorSimpleProps) {
  const { addItem, removeItem, state } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [selectedDispatchDate, setSelectedDispatchDate] = useState<string>('');

  // Función para formatear dimensiones with unidades correctas
  const formatDimensionWithUnit = (dimension: string) => {
    if (!dimension) return 'N/A';
    
    // Extraer números de la dimensión (ej: "1.05x2.90" -> [1.05, 2.90])
    const numbers = dimension.split('x').map(n => parseFloat(n.trim()));
    
    return numbers.map(num => {
      if (num < 1) {
        // Menos de 1 = milímetros 
        return `${(num * 1000).toFixed(0)}mm`;
      } else if (num < 10) {
        // Entre 1 y 10 = centímetros si es decimal, metros si es entero
        if (num % 1 !== 0) {
          return `${(num * 100).toFixed(0)}cm`;
        } else {
          return `${num.toFixed(1)}mts`;
        }
      } else {
        // Mayor a 10 = centímetros  
        return `${num.toFixed(0)}cm`;
      }
    }).join(' x ');
  };

  // Función para formatear una dimensión individual (ancho o largo)  
  const formatSingleDimension = (value: string, campo?: string) => {
    if (!value || value === '0' || value === '0.0') return 'N/A';
    
    // Manejar valores con coma decimal (formato chileno)
    const normalizedValue = value.toString().replace(',', '.');
    const num = parseFloat(normalizedValue);
    
    if (isNaN(num) || num === 0) return 'N/A';
    
    // CORRECCIÓN ESPECIAL PARA PERFILES
    const esPerfilCategoria = productGroup.categoria?.toLowerCase().includes('perfil') || 
                             productGroup.tipo?.toLowerCase().includes('perfil') ||
                             productGroup.nombre?.toLowerCase().includes('perfil');
    
    if (esPerfilCategoria && campo === 'ancho') {
      // Corregir valores específicos de Google Sheets para anchos de perfiles
      if (num === 20 || Math.abs(num - 20) < 0.01) {
        return '0,02 mm';
      }
      if (num === 55 || Math.abs(num - 55) < 0.01) {
        return '0,055 mm';
      }
      // Para otros valores de perfil, asumir que ya están en mm
      if (num < 1) {
        return `${num.toString().replace('.', ',')} mm`;
      }
      return `${num} mm`;
    }
    
    // LÓGICA ORIGINAL para otros casos
    // Para valores muy pequeños (menos de 0.01 metros = 10mm)
    if (num < 0.01) {
      const mm = Math.round(num * 1000);
      return `${mm} mm`;
    } 
    // Para valores entre 0.01 y 0.99 metros, mostrar en centímetros para mayor claridad
    else if (num < 1) {
      const cm = Math.round(num * 100);
      return `${cm} cm`;
    }
    // Para valores de 1 metro o más, mostrar en metros
    else {
      // Si es un número entero, mostrarlo sin decimales
      // Si tiene decimales, usar formato chileno con coma
      const formatted = num % 1 === 0 ? num.toFixed(0) : num.toFixed(2).replace('.', ',');
      return `${formatted} mts`;
    }
  };
  
  // Estados para las selecciones del usuario
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    productGroup.variantes?.[0] || {} as ProductVariant
  );
  
  // Estados para filtros dinámicos
  const [selectedColor, setSelectedColor] = useState<string>(productGroup.variantes?.[0]?.color || '');
  const [selectedEspesor, setSelectedEspesor] = useState<string>(productGroup.variantes?.[0]?.espesor || '');
  const [selectedDimension, setSelectedDimension] = useState<string>(productGroup.variantes?.[0]?.dimensiones || '');
  const [selectedAncho, setSelectedAncho] = useState<string>(productGroup.variantes?.[0]?.ancho || '');
  const [selectedLargo, setSelectedLargo] = useState<string>(productGroup.variantes?.[0]?.largo || '');

  // Calcular precio ajustado por dimensiones
  const dimensionInfo = getProductDimensionInfo(
    productGroup.categoria || '',
    productGroup.tipo || '',
    selectedAncho || selectedVariant.ancho || '',
    selectedLargo || selectedVariant.largo || '',
    selectedVariant.precio_con_iva || 0
  );

  // Precio final que se muestra (puede incluir cálculo por área)
  const finalPrice = dimensionInfo.finalPrice;
  
  // Determinar cantidad mínima e inicial basada en el tipo de producto
  const getMinQuantity = () => {
    // Detectar si es compacto por el nombre del producto o el código
    const isCompacto = productGroup.nombre?.includes('Compacto') || 
                      selectedVariant.nombre?.includes('Compacto') ||
                      selectedVariant.codigo?.startsWith('517');
    return isCompacto ? 1 : 10;
  };

  const [quantity, setQuantity] = useState(getMinQuantity());

  // Función para limpiar valor de espesor (quitar mm si ya lo tiene)
  const cleanEspesorValue = (espesor: string) => {
    if (!espesor) return '';
    return espesor.replace(/mm$/i, ''); // Quitar "mm" o "MM" del final si lo tiene
  };
  
  // Verificar si el producto está en el carrito
  const isInCart = state.items.some(item => item.id === selectedVariant.codigo);

  // Efecto para leer la fecha de despacho específica del producto desde localStorage
  useEffect(() => {
    const productKey = `dispatch-date-${selectedVariant.codigo}`;
    const savedDate = localStorage.getItem(productKey);
    if (savedDate) {
      setSelectedDispatchDate(savedDate);
    } else {
      // Solo usar searchParams si no hay fecha guardada específica para este producto
      const fechaParam = searchParams.get('fecha');
      if (fechaParam) {
        setSelectedDispatchDate(fechaParam);
      }
    }
  }, [searchParams, selectedVariant.codigo]);

  // Efecto para ajustar cantidad inicial cuando cambie la variante
  useEffect(() => {
    if (selectedVariant.codigo) {
      const isCompacto = productGroup.nombre?.includes('Compacto') || 
                        selectedVariant.nombre?.includes('Compacto') ||
                        selectedVariant.codigo?.startsWith('517');
      const newMinQuantity = isCompacto ? 1 : 10;
      setQuantity(newMinQuantity);
    }
  }, [selectedVariant.codigo]); // Solo cuando cambie el código de variante

  // Función para crear fecha consistente desde string ISO
  const createDateFromISOString = (dateString: string) => {
    // Crear fecha en zona horaria local para evitar problemas de timezone
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month es 0-indexed en Date
  };

  // Función para formatear la fecha de despacho
  const getDispatchDateText = () => {
    if (selectedDispatchDate) {
      const date = createDateFromISOString(selectedDispatchDate);
      return date.toLocaleDateString('es-CL', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'short' 
      });
    }
    return null;
  };

  // Función para manejar la selección de fecha de despacho
  const handleDispatchDateSelect = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    setSelectedDispatchDate(dateString);
    
    // Guardar fecha específica para este producto en localStorage
    const productKey = `dispatch-date-${selectedVariant.codigo}`;
    localStorage.setItem(productKey, dateString);
    
    // Solo actualizar la URL si NO estamos en la página principal
    const currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath !== '') {
      // Actualizar la URL con la nueva fecha sin navegación completa
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('fecha', dateString);
      // Usar replace para no agregar entrada al historial
      window.history.replaceState({}, '', currentUrl.pathname + currentUrl.search);
    }
    
    setIsCalendarModalOpen(false);
  };

  const handleViewDetails = () => {
    router.push(`/productos/${productGroup.id}`);
  };

  const handleShowSpecs = () => {
    setIsSpecsModalOpen(true);
  };

  const handleAddToCart = () => {
    if (selectedVariant && selectedVariant.codigo) {
      // Usar el nombre del grupo de producto que es el más específico
      let nombreCompleto = productGroup.nombre || selectedVariant.nombre;
      
      // Solo corregir si el nombre es genérico "Policarbonato" sin tipo específico
      if (nombreCompleto === 'Policarbonato' || nombreCompleto === 'policarbonato') {
        // Detectar tipo específico basado en código o nombre de variante
        if (selectedVariant.codigo?.startsWith('517') || selectedVariant.nombre?.includes('Compacto')) {
          nombreCompleto = 'Policarbonato Compacto';
        } else if (selectedVariant.nombre?.includes('Alveolar') || productGroup.categoria?.includes('Alveolar')) {
          nombreCompleto = 'Policarbonato Alveolar';
        } else if (selectedVariant.nombre?.includes('Ondulado') || productGroup.categoria?.includes('Ondulado')) {
          nombreCompleto = 'Policarbonato Ondulado';
        }
      }
      
      // Obtener imagen con prioridad: variante específica > grupo > fallback
      let imagenParaCarrito = selectedVariant.imagen || productGroup.imagen;
      
      // Si no hay imagen válida, usar fallback según el tipo de producto
      if (!imagenParaCarrito || imagenParaCarrito.trim() === '' || imagenParaCarrito === 'undefined') {
        console.log('🔧 Configurador - Fallback activado para:', nombreCompleto, 'Categoría:', productGroup.categoria);
        if (productGroup.categoria === 'Perfiles Alveolar' && productGroup.nombre?.includes('Perfil U')) {
          imagenParaCarrito = '/assets/images/Productos/Perfiles/perfil-u-policarbonato.webp';
        } else if (productGroup.categoria === 'Perfiles Alveolar' && productGroup.nombre?.includes('Perfil Clip')) {
          imagenParaCarrito = '/assets/images/Productos/Perfiles/perfil-clip-policarbonato.webp';
        } else if (productGroup.categoria?.includes('Perfil') || nombreCompleto.includes('Perfil')) {
          imagenParaCarrito = '/assets/images/Productos/Perfiles/perfil-u-policarbonato.webp';
        } else if (nombreCompleto.includes('Ondulado')) {
          // Usar imagen específica por color para Policarbonato Ondulado
          const colorActual = selectedColor; // Usar siempre selectedColor para consistencia
          console.log('🛒 Color para carrito:', colorActual);
          switch (colorActual) {
            case 'Clear':
              imagenParaCarrito = '/assets/images/Productos/Policarbonato Ondulado/ondulado_Clear.webp';
              break;
            case 'Bronce':
              imagenParaCarrito = '/assets/images/Productos/Policarbonato Ondulado/ondulado_Bronce.webp';
              break;
            case 'Opal':
              imagenParaCarrito = '/assets/images/Productos/Policarbonato Ondulado/ondulado_Opal.webp';
              break;
            default:
              imagenParaCarrito = '/assets/images/Productos/Policarbonato Ondulado/ondulado_Clear.webp';
          }
        } else if (nombreCompleto.includes('Alveolar')) {
          // Usar imagen específica por color para Policarbonato Alveolar
          const colorActual = selectedColor; // Usar siempre selectedColor para consistencia
          console.log('🛒 Color para carrito Alveolar:', colorActual);
          switch (colorActual) {
            case 'Clear':
              imagenParaCarrito = '/assets/images/Productos/Policarbonato Alveolar/Alveolar_Clear.webp';
              break;
            case 'Bronce':
              imagenParaCarrito = '/assets/images/Productos/Policarbonato Alveolar/Alveolar_bronce.webp';
              break;
            case 'Opal':
              imagenParaCarrito = '/assets/images/Productos/Policarbonato Alveolar/Alveolar_Opal.webp';
              break;
            default:
              imagenParaCarrito = '/assets/images/Productos/Policarbonato Alveolar/Alveolar_Clear.webp';
          }
        } else if (nombreCompleto.includes('Compacto')) {
          imagenParaCarrito = '/assets/images/Productos/Policarbonato Compacto/policarbonato_compacto.webp';
        } else {
          imagenParaCarrito = '/assets/images/Productos/Policarbonato Alveolar/policarbonato_alveolar.webp';
        }
        console.log('🔧 Configurador - Imagen asignada:', imagenParaCarrito);
      }

      const item = {
        id: selectedVariant.codigo,
        tipo: 'producto' as const,
        nombre: nombreCompleto,
        descripcion: selectedVariant.descripcion,
        categoria: productGroup.categoria, // Agregar categoría del producto
        cantidad: quantity,
        precioUnitario: finalPrice, // Usar precio calculado por área
        total: finalPrice * quantity,
        imagen: imagenParaCarrito,
        fechaDespacho: selectedDispatchDate ? createDateFromISOString(selectedDispatchDate) : undefined,
        especificaciones: [
          `Código: ${selectedVariant.codigo}`,
          `Espesor: ${selectedVariant.espesor}`,
          ...(selectedAncho ? [`Ancho: ${formatSingleDimension(selectedAncho, 'ancho')}`] : []),
          ...(selectedLargo ? [`Largo: ${formatSingleDimension(selectedLargo, 'largo')}`] : []),
          ...(selectedVariant.color && selectedVariant.color !== 'Sin color' ? [`Color: ${selectedVariant.color}`] : []),
          `Protección UV: ${selectedVariant.uv_protection ? 'Sí' : 'No'}`,
          ...(selectedDispatchDate ? [`Fecha de despacho: ${createDateFromISOString(selectedDispatchDate).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}`] : [])
        ]
      };
      addItem(item);
    }
  };

  const productSpecs = getProductSpecifications(productGroup);

  // Obtener opciones desde el grupo (ya calculadas en el servidor)
  const uniqueColors = productGroup.colores || [];
  const uniqueThicknesses = productGroup.espesores || [];
  const uniqueDimensions = productGroup.dimensiones || [];
  
  // Obtener anchos únicos desde las variantes
  const uniqueAnchos = [...new Set(productGroup.variantes?.map(v => v.ancho).filter(Boolean))];
  
  // Obtener largos disponibles según el ancho seleccionado
  const getAvailableLargos = () => {
    if (!selectedAncho) {
      return [...new Set(productGroup.variantes?.map(v => v.largo).filter(Boolean))];
    }
    
    // Filtrar variantes por ancho seleccionado
    const variantesConAncho = productGroup.variantes?.filter(v => v.ancho === selectedAncho);
    
    // Obtener largos únicos de esas variantes
    return [...new Set(variantesConAncho?.map(v => v.largo).filter(Boolean))];
  };
  
  const uniqueLargos = getAvailableLargos();


  // Filtrado dinámico: obtener dimensiones disponibles para el espesor seleccionado
  const getAvailableDimensionsForThickness = (thickness: string) => {
    if (!thickness) return uniqueDimensions;
    
    const availableDimensions = productGroup.variantes
      ?.filter(v => v.espesor === thickness)
      .map(v => v.dimensiones)
      .filter(Boolean);
    
    return [...new Set(availableDimensions)];
  };

  // Filtrado dinámico: obtener dimensiones disponibles para el color seleccionado
  const getAvailableDimensionsForColor = (color: string) => {
    if (!color) return uniqueDimensions;
    
    const availableDimensions = productGroup.variantes
      ?.filter(v => v.color === color)
      .map(v => v.dimensiones)
      .filter(Boolean);
    
    return [...new Set(availableDimensions)];
  };

  // Obtener dimensiones filtradas por espesor Y color seleccionados
  const getFilteredDimensions = () => {
    if (!selectedEspesor && !selectedColor) return uniqueDimensions;
    
    let filteredVariants = productGroup.variantes || [];
    
    if (selectedEspesor) {
      filteredVariants = filteredVariants.filter(v => v.espesor === selectedEspesor);
    }
    
    if (selectedColor) {
      filteredVariants = filteredVariants.filter(v => v.color === selectedColor);
    }
    
    const availableDimensions = filteredVariants
      .map(v => v.dimensiones)
      .filter(Boolean);
    
    return [...new Set(availableDimensions)];
  };

  // Función para encontrar variante compatible (actualizada para ancho y largo)
  const findVariant = (color: string, espesor: string, ancho: string, largo: string) => {
    return productGroup.variantes?.find(v => 
      v.color === color && 
      v.espesor === espesor && 
      v.ancho === ancho &&
      v.largo === largo
    ) || selectedVariant;
  };

  // Handlers para cambios de configuración
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    
    const newVariant = findVariant(color, selectedEspesor, selectedAncho, selectedLargo);
    setSelectedVariant(newVariant);
    
    // Actualizar cantidad si el nuevo tipo requiere cantidad mínima diferente
    const isCompacto = productGroup.nombre?.includes('Compacto') || newVariant.codigo?.startsWith('517');
    const newMinQuantity = isCompacto ? 1 : 10;
    if (quantity < newMinQuantity) {
      setQuantity(newMinQuantity);
    }
  };

  const handleEspesorChange = (espesor: string) => {
    setSelectedEspesor(espesor);
    
    const newVariant = findVariant(selectedColor, espesor, selectedAncho, selectedLargo);
    setSelectedVariant(newVariant);
    
    // Actualizar cantidad si el nuevo tipo requiere cantidad mínima diferente
    const isCompacto = productGroup.nombre?.includes('Compacto') || newVariant.codigo?.startsWith('517');
    const newMinQuantity = isCompacto ? 1 : 10;
    if (quantity < newMinQuantity) {
      setQuantity(newMinQuantity);
    }
  };

  const handleAnchoChange = (ancho: string) => {
    setSelectedAncho(ancho);
    
    // Verificar si el largo actual sigue siendo válido para el nuevo ancho
    const variantesConNuevoAncho = productGroup.variantes?.filter(v => v.ancho === ancho);
    const largosDisponibles = [...new Set(variantesConNuevoAncho?.map(v => v.largo).filter(Boolean))];
    
    // Si el largo actual no está disponible con el nuevo ancho, seleccionar el primero disponible
    let nuevoLargo = selectedLargo;
    if (!largosDisponibles.includes(selectedLargo) && largosDisponibles.length > 0) {
      nuevoLargo = largosDisponibles[0];
      setSelectedLargo(nuevoLargo);
    }
    
    const newVariant = findVariant(selectedColor, selectedEspesor, ancho, nuevoLargo);
    setSelectedVariant(newVariant);
  };

  const handleLargoChange = (largo: string) => {
    setSelectedLargo(largo);
    
    const newVariant = findVariant(selectedColor, selectedEspesor, selectedAncho, largo);
    setSelectedVariant(newVariant);
  };


  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${className} flex flex-col product-card-mobile product-card-mobile-md product-card-tablet`}>
      <div className="p-4 sm:p-5 lg:p-6 flex-1">
        {/* Imagen - Clickeable */}
        <div 
          className="bg-gray-100 rounded-xl h-48 mb-3 overflow-hidden product-image img-mobile cursor-pointer hover:scale-105 transition-transform duration-200"
          onClick={() => router.push(`/productos/${productGroup.id}`)}
        >
          {/* Función para obtener la imagen correcta - Con soporte para cambio dinámico por color */}
          {(() => {
            const getImagePath = () => {
              // POLICARBONATO ONDULADO - Usar imágenes dinámicas específicas por color seleccionado
              if (productGroup.nombre?.includes('Ondulado')) {
                const currentColor = selectedColor;
                console.log('🎨 Color seleccionado para imagen:', currentColor, 'Producto:', productGroup.nombre);
                switch (currentColor) {
                  case 'Clear':
                    return "/assets/images/Productos/Policarbonato Ondulado/ondulado_Clear.webp";
                  case 'Bronce':
                    return "/assets/images/Productos/Policarbonato Ondulado/ondulado_Bronce.webp";
                  case 'Opal':
                    return "/assets/images/Productos/Policarbonato Ondulado/ondulado_Opal.webp";
                  default:
                    return "/assets/images/Productos/Policarbonato Ondulado/ondulado_Clear.webp";
                }
              }
              
              // POLICARBONATO ALVEOLAR - Usar imágenes dinámicas específicas por color seleccionado
              if (productGroup.nombre?.includes('Alveolar')) {
                const currentColor = selectedColor;
                console.log('🎨 Color seleccionado para imagen Alveolar:', currentColor, 'Producto:', productGroup.nombre);
                switch (currentColor) {
                  case 'Clear':
                    return "/assets/images/Productos/Policarbonato Alveolar/Alveolar_Clear.webp";
                  case 'Bronce':
                    return "/assets/images/Productos/Policarbonato Alveolar/Alveolar_bronce.webp";
                  case 'Opal':
                    return "/assets/images/Productos/Policarbonato Alveolar/Alveolar_Opal.webp";
                  default:
                    return "/assets/images/Productos/Policarbonato Alveolar/Alveolar_Clear.webp";
                }
              }
              
              // Otros productos - usar imagen de variante o fallback
              let imagenFinal = selectedVariant.imagen || selectedVariant.ruta_imagen;
              
              if (!imagenFinal || imagenFinal.includes('policarbonato-ondulado.webp') || 
                  imagenFinal.trim() === '' || imagenFinal === 'undefined') {
                
                if (productGroup.categoria === 'Perfiles Alveolar' || productGroup.nombre?.includes('Perfil')) {
                  if (productGroup.nombre?.includes('Perfil U') || selectedVariant.nombre?.includes('Perfil U')) {
                    return "/assets/images/Productos/Perfiles/perfil-u-policarbonato.webp";
                  } else if (productGroup.nombre?.includes('Perfil H') || selectedVariant.nombre?.includes('Perfil H')) {
                    return "/assets/images/Productos/Perfiles/perfil-u-policarbonato.webp";
                  } else if (productGroup.nombre?.includes('Perfil Clip') || selectedVariant.nombre?.includes('Perfil Clip')) {
                    return "/assets/images/productos/perfiles/perfil-clip-policarbonato.webp";
                  } else if (productGroup.nombre?.includes('Perfil Alveolar') || selectedVariant.nombre?.includes('Perfil Alveolar')) {
                    return "/assets/images/productos/perfiles/perfil-alveolar-policarbonato.webp";
                  } else {
                    return "/assets/images/productos/perfiles/perfiles-policarbonato-generic.webp";
                  }
                } else if (productGroup.categoria === 'Policarbonato' || productGroup.nombre) {
                  if (productGroup.nombre?.includes('Alveolar')) {
                    return "/assets/images/Productos/Policarbonato Alveolar/Alveolar_Clear.webp";
                  } else if (productGroup.nombre?.includes('Compacto')) {
                    return "/assets/images/Productos/Policarbonato Compacto/policarbonato_compacto.webp";
                  } else {
                    return "/assets/images/productos/policarbonato/policarbonato-generic.webp";
                  }
                } else {
                  return productGroup.imagen;
                }
              }
              
              return imagenFinal;
            };

            const imagenFinal = getImagePath();
            
            return imagenFinal ? (
              <img
                src={imagenFinal}
                alt={`${productGroup.nombre} - ${productGroup.descripcion}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.style.display = 'flex';
                  }
                }}
              />
            ) : null;
          })()}
          
          {/* Placeholder cuando no hay imagen */}
          <div 
            className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400"
            style={{ display: (selectedVariant.imagen || productGroup.imagen) ? 'none' : 'flex' }}
          >
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">{productGroup.nombre}</p>
            </div>
          </div>
        </div>

        {/* Información básica */}
        <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
              {productGroup.categoria}
            </span>
            {productGroup.etiqueta && (
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                {productGroup.etiqueta}
              </span>
            )}
          </div>
          {isInCart && (
            <div className="relative">
              <div className="flex items-center bg-white border-2 border-emerald-500 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                <div className="w-4 h-4 bg-emerald-500 rounded-sm flex items-center justify-center mr-1">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                En carrito
              </div>
              {/* Globito rojo con cantidad */}
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                {state.items.filter(item => item.id === selectedVariant.codigo).reduce((sum, item) => sum + item.cantidad, 0)}
              </div>
            </div>
          )}
        </div>
        
        <h3 
          className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-amber-600 transition-colors duration-200"
          onClick={() => router.push(`/productos/${productGroup.id}`)}
        >
          {productGroup.nombre}
        </h3>
        
        <div className="mb-3 flex items-start">
          <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
            {productGroup.descripcion}
          </p>
        </div>

        {/* Colores disponibles - Solo para policarbonatos */}
        {(productGroup.nombre?.includes('Policarbonato') || productGroup.categoria === 'Policarbonato') && uniqueColors.length > 1 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Colores disponibles:</span>
              <span className="text-xs text-gray-500">({uniqueColors.length} opciones)</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {uniqueColors.map((color) => {
                // Obtener la imagen específica del color si existe
                let imagenColor = '';
                if (productGroup.nombre?.includes('Ondulado')) {
                  switch (color) {
                    case 'Clear': imagenColor = "/assets/images/Productos/Policarbonato Ondulado/ondulado_Clear.webp"; break;
                    case 'Bronce': imagenColor = "/assets/images/Productos/Policarbonato Ondulado/ondulado_Bronce.webp"; break;
                    case 'Opal': imagenColor = "/assets/images/Productos/Policarbonato Ondulado/ondulado_Opal.webp"; break;
                  }
                } else if (productGroup.nombre?.includes('Alveolar')) {
                  switch (color) {
                    case 'Clear': imagenColor = "/assets/images/Productos/Policarbonato Alveolar/Alveolar_Clear.webp"; break;
                    case 'Bronce': imagenColor = "/assets/images/Productos/Policarbonato Alveolar/Alveolar_bronce.webp"; break;
                    case 'Opal': imagenColor = "/assets/images/Productos/Policarbonato Alveolar/Alveolar_Opal.webp"; break;
                  }
                }

                return (
                  <button 
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`group relative flex items-center rounded-md px-2 py-1 transition-all cursor-pointer border ${
                      selectedColor === color 
                        ? 'bg-amber-50 border-amber-300 shadow-md' 
                        : 'bg-gray-50 hover:bg-gray-100 border-transparent hover:border-gray-200'
                    }`}
                    title={`Cambiar a ${productGroup.nombre} - ${color}`}
                  >
                    {/* Círculo de color clickable */}
                    <div 
                      className={`w-5 h-5 rounded-full mr-2 border-2 shadow-sm transition-all ${
                        selectedColor === color ? 'ring-2 ring-amber-400 ring-offset-1' : ''
                      } ${
                        color === 'Clear' ? 'bg-white border-gray-400' :
                        color === 'Bronce' ? 'bg-amber-700 border-amber-800' :
                        color === 'Opal' ? 'bg-blue-200 border-blue-300' :
                        color === 'Solid' ? 'bg-gray-600 border-gray-700' :
                        'bg-gray-400 border-gray-500'
                      }`}
                    ></div>
                    <span className={`text-xs font-medium transition-colors ${
                      selectedColor === color ? 'text-amber-800' : 'text-gray-700'
                    }`}>
                      {color}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        

        {/* SKU sutilmente debajo de la descripción */}
        <div className="mb-3">
          <div className="text-right">
            <span className="text-gray-400 text-xs font-medium">SKU: {selectedVariant.codigo || 'N/A'}</span>
          </div>
        </div>

        {/* Precio y Stock */}
        <div className="mb-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-baseline gap-2 mb-2">
              <div className="text-lg font-bold text-gray-900">
                ${formatCurrency(finalPrice)}
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">IVA incluido</span>
            </div>
            
            
            
            {/* Información de stock mejorada */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`flex items-center ${
                  (selectedVariant?.stock || productGroup.stock_total) > 10 ? 'text-green-600' : 
                  (selectedVariant?.stock || productGroup.stock_total) > 0 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    (selectedVariant?.stock || productGroup.stock_total) > 10 ? 'bg-green-500' : 
                    (selectedVariant?.stock || productGroup.stock_total) > 0 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="font-medium text-sm">
                    Stock disponible: {selectedVariant?.stock || productGroup.stock_total}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => setIsCalendarModalOpen(true)}
                className={`text-sm font-medium transition-all cursor-pointer px-3 py-2 rounded-lg touch-target flex items-center ${
                  selectedDispatchDate 
                    ? 'text-emerald-700 bg-emerald-50 border-2 border-emerald-200 hover:bg-emerald-100 shadow-md font-bold' 
                    : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200'
                }`}
              >
                <span>🚚 {getDispatchDateText() || 'Elegir despacho'}</span>
                {selectedDispatchDate && (
                  <div className="ml-2 flex items-center justify-center w-5 h-5 bg-emerald-600 rounded-full shadow-lg">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>


        {/* Configuración de Producto */}
        <div className="space-y-4">
          {/* Selección de Color */}
          {uniqueColors.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color: <span className="text-amber-600 font-bold">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                      selectedColor === color 
                        ? 'border-amber-400 bg-amber-100 text-amber-800 shadow-md ring-2 ring-amber-200' 
                        : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50 text-gray-700'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selección de Espesor */}
          {uniqueThicknesses.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Espesor: <span className="text-amber-600 font-bold">{cleanEspesorValue(selectedEspesor)}mm</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {uniqueThicknesses.map((espesor) => (
                  <button
                    key={espesor}
                    onClick={() => handleEspesorChange(espesor)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                      selectedEspesor === espesor 
                        ? 'border-amber-400 bg-amber-100 text-amber-800 shadow-md ring-2 ring-amber-200' 
                        : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50 text-gray-700'
                    }`}
                  >
                    {cleanEspesorValue(espesor)}mm
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selección de Ancho */}
          {uniqueAnchos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ancho: <span className="text-amber-600 font-bold">{formatSingleDimension(selectedAncho, 'ancho')}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {uniqueAnchos.map((ancho) => (
                  <button
                    key={ancho}
                    onClick={() => handleAnchoChange(ancho)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                      selectedAncho === ancho 
                        ? 'border-amber-400 bg-amber-100 text-amber-800 shadow-md ring-2 ring-amber-200' 
                        : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50 text-gray-700'
                    }`}
                  >
                    {formatSingleDimension(ancho, 'ancho')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selección de Largo */}
          {uniqueLargos.length > 0 && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Largo: <span className="text-amber-600 font-bold">{formatSingleDimension(selectedLargo, 'largo')}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {uniqueLargos.map((largo) => (
                  <button
                    key={largo}
                    onClick={() => handleLargoChange(largo)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                      selectedLargo === largo 
                        ? 'border-amber-400 bg-amber-100 text-amber-800 shadow-md ring-2 ring-amber-200' 
                        : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50 text-gray-700'
                    }`}
                  >
                    {formatSingleDimension(largo, 'largo')}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
      
      {/* Contenedor de botones - posición fija en la parte inferior */}
      <div className="p-4 sm:p-5 lg:p-6 bg-white border-t border-gray-100 flex-shrink-0">
        {/* Cantidad - Alineada en todas las tarjetas */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-2 form-label-mobile">
            Cantidad: 
            {!productGroup.nombre?.includes('Compacto') && (
              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full ml-2">
                (mín. 10 unidades)
              </span>
            )}
          </label>
          <div className="flex items-center justify-between bg-gray-50 border border-gray-300 rounded-lg p-2 touch-target">
            <button
              onClick={() => {
                const isCompacto = productGroup.nombre?.includes('Compacto') || selectedVariant.codigo?.startsWith('517');
                const minQty = isCompacto ? 1 : 10;
                const increment = isCompacto ? 1 : 10;
                setQuantity(Math.max(minQty, quantity - increment));
              }}
              className="flex items-center justify-center w-10 h-10 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-target"
              disabled={quantity <= (productGroup.nombre?.includes('Compacto') || selectedVariant.codigo?.startsWith('517') ? 1 : 10)}
            >
              −
            </button>
            <div className="flex-1 text-center">
              <div className="text-lg font-bold text-gray-900">
                {quantity}
              </div>
              <div className="text-xs text-gray-500">
                unidades
              </div>
            </div>
            <button
              onClick={() => {
                const isCompacto = productGroup.nombre?.includes('Compacto') || selectedVariant.codigo?.startsWith('517');
                const increment = isCompacto ? 1 : 10;
                const stockDisponible = selectedVariant.stock || 0;
                const nuevaCantidad = quantity + increment;
                
                // Solo incrementar si no excede el stock disponible
                if (nuevaCantidad <= stockDisponible) {
                  setQuantity(nuevaCantidad);
                }
              }}
              className="flex items-center justify-center w-10 h-10 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-target"
              disabled={(() => {
                const isCompacto = productGroup.nombre?.includes('Compacto') || selectedVariant.codigo?.startsWith('517');
                const increment = isCompacto ? 1 : 10;
                const stockDisponible = selectedVariant.stock || 0;
                return (quantity + increment) > stockDisponible;
              })()}
            >
              +
            </button>
          </div>
        </div>
        
        {/* Precio total a la derecha */}
        <div className="flex justify-end mb-3">
          <div className="text-right">
            <div className="text-sm text-gray-600">Total:</div>
            <div className="text-xl font-bold text-green-600">
              ${formatCurrency(finalPrice * quantity)}
            </div>
          </div>
        </div>
        {/* Botón de compra directo */}
        <div className="relative min-h-[80px] flex flex-col justify-end">
          {!isInCart ? (
            <button
              onClick={handleAddToCart}
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-lg transition-colors mb-3 flex items-center justify-center btn-mobile btn-touch touch-target"
            >
              Agregar al Carrito
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Botón Agregar Más - Verde para acción positiva */}
              <button
                onClick={handleAddToCart}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center btn-mobile btn-touch touch-target group hover:scale-105"
                title="Agregar al carrito"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="ml-2">Más</span>
              </button>
              
              {/* Botón Quitar - Solo icono de basurero */}
              <button
                onClick={() => {
                  removeItem(selectedVariant.codigo);
                }}
                className="bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 p-3 rounded-lg transition-all duration-200 flex items-center justify-center btn-mobile btn-touch touch-target group hover:scale-105"
                title="Quitar producto del carrito"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Botones de acción principal */}
        <div className="flex gap-3 btn-group-mobile btn-group-mobile-md min-h-[60px] items-end">
          <button
            onClick={handleViewDetails}
            className="flex-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-amber-500 text-black font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center btn-mobile-md btn-touch touch-target shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Ver Detalles
          </button>
          <button
            onClick={handleShowSpecs}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center min-w-[50px] btn-touch touch-target hover:scale-105"
            title="Especificaciones técnicas"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal de Especificaciones Técnicas */}
      <TechnicalSpecsModal
        isOpen={isSpecsModalOpen}
        onClose={() => setIsSpecsModalOpen(false)}
        productName={productSpecs.name}
        productType={productSpecs.type}
        specifications={productSpecs.specifications}
        applications={productSpecs.applications}
        advantages={productSpecs.advantages}
      />

      {/* Modal de Calendario de Despacho */}
      <DispatchCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        productType={productGroup.categoria}
        onDateSelect={handleDispatchDateSelect}
      />
    </div>
  );
}

export default ProductConfiguratorSimple;