"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { NavbarSimple } from '@/components/navbar-simple';
import { ProductImage } from '@/components/optimized-image';
import { useCart } from '@/contexts/CartContext';
import ProductConfiguratorSimple from '@/modules/products/components/product-configurator-simple';
import proyectosData from '@/data/proyectos-realizados.json';
import imagenesProductos from '@/data/imagenes-productos.json';
import AlveolarProfileInfo from '@/components/AlveolarProfileInfo';

interface ProductVariant {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  tipo: string;
  precio_con_iva: number;
  espesor: string;
  dimensiones: string;
  color: string;
  uso: string;
  stock: number;
  ancho: string;
  largo: string;
}

interface ProductGroup {
  id: string;
  nombre: string;
  descripcion: string;
  descripcion_completa?: string;
  categoria: string;
  tipo: string;
  variantes: ProductVariant[];
  colores: string[];
  precio_desde: number;
  stock_total: number;
  variantes_count: number;
  imagen: string;
  caracteristicas?: string[];
  usos_principales?: string[];
  especificaciones_tecnicas?: any;
  ventajas_competitivas?: string[];
  instalacion_recomendada?: any;
}

interface Proyecto {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_principal: string;
  imagen_hover?: string;
  imagen_secundaria?: string;
  caracteristicas: string[];
  tipo: string;
  material_usado: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'descripcion' | 'especificaciones' | 'instalacion'>('descripcion');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  
  const productId = params.id as string;
  
  // Cargar datos
  const productosData = require('@/data/productos-policarbonato.json');
  const productos: ProductGroup[] = productosData.productos_por_categoria?.Policarbonato || [];
  const productosAccesorios: ProductGroup[] = productosData.productos_por_categoria?.Accesorios || [];
  const todosProductos = [...productos, ...productosAccesorios];
  
  const producto = todosProductos.find(p => p.id === productId);
  const proyectos = proyectosData[productId as keyof typeof proyectosData]?.proyectos || [];
  const imagenesDelProducto = imagenesProductos[productId as keyof typeof imagenesProductos] || {};
  
  // Calcular stock real sumando todas las variantes
  const stockReal = useMemo(() => {
    if (!producto?.variantes) return 0;
    return producto.variantes.reduce((total, variante) => {
      return total + (variante.stock || 0);
    }, 0);
  }, [producto?.variantes]);

  // Opciones disponibles
  const opciones = useMemo(() => {
    if (!producto || !producto.variantes) return { espesores: [], colores: [], dimensiones: [] };
    
    const espesores = new Set<string>();
    const colores = new Set<string>();
    const dimensiones = new Set<string>();
    
    producto.variantes.forEach(v => {
      if (v.espesor) espesores.add(v.espesor);
      if (v.color) colores.add(v.color);
      if (v.dimensiones) dimensiones.add(v.dimensiones);
    });
    
    return {
      espesores: Array.from(espesores).sort(),
      colores: Array.from(colores).sort(),
      dimensiones: Array.from(dimensiones).sort(),
    };
  }, [producto?.variantes]);

  // Efecto para establecer el color inicial y la imagen
  useEffect(() => {
    if (opciones.colores.length > 0 && !selectedColor) {
      setSelectedColor(opciones.colores[0]);
    }
  }, [opciones.colores]);

  // Efecto para actualizar la imagen según el color seleccionado
  useEffect(() => {
    if (imagenesDelProducto && selectedColor) {
      const imagenPorColor = imagenesDelProducto.imagenes_por_color?.[selectedColor];
      if (imagenPorColor) {
        setSelectedImage(imagenPorColor);
      } else if (imagenesDelProducto.imagen_principal) {
        setSelectedImage(imagenesDelProducto.imagen_principal);
      } else if (producto?.imagen) {
        setSelectedImage(producto.imagen);
      }
    } else if (imagenesDelProducto?.imagen_principal) {
      setSelectedImage(imagenesDelProducto.imagen_principal);
    } else if (producto?.imagen) {
      setSelectedImage(producto.imagen);
    }
  }, [selectedColor, imagenesDelProducto, producto]);

  if (!producto) {
    return (
      <main className="min-h-screen bg-gray-50">
        <NavbarSimple />
        <div className="pt-32 pb-20 container mx-auto px-6 text-center">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Producto no encontrado</h1>
            <p className="text-gray-600 mb-6">El producto que buscas no existe o ha sido movido.</p>
            <button
              onClick={() => router.push('/productos')}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              Ver todos los productos
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <NavbarSimple />
      
      <div className="pt-44 pb-16">
        <div className="container mx-auto px-6 max-w-7xl">
          
          {/* Breadcrumbs mejorado */}
          <div className="mb-8">
            <nav className="flex items-center text-sm text-gray-500">
              <button onClick={() => router.push('/')} className="hover:text-amber-600 transition-colors">
                Inicio
              </button>
              <span className="mx-2">/</span>
              <button onClick={() => router.push('/productos')} className="hover:text-amber-600 transition-colors">
                Productos
              </button>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{producto.nombre}</span>
            </nav>
          </div>

          {/* Layout Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Columna Izquierda: Imagen y Proyectos */}
            <div className="">
              <div className="relative">
                {/* Imagen principal con badge */}
                <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden mb-4 relative">
                  <ProductImage
                    src={selectedImage || producto.imagen || '/images/placeholder.svg'}
                    alt={`${producto.nombre} - ${selectedColor || 'Vista general'}`}
                    className="w-full h-full object-cover"
                  />
                  {stockReal > 0 && (
                    <div className={`absolute top-4 left-4 text-white px-3 py-1 rounded-full text-sm font-medium ${
                      stockReal > 10 ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                      {stockReal > 10 ? 'En Stock' : 'Pocas unidades'}
                    </div>
                  )}
                </div>
                
                {/* Miniaturas de colores disponibles */}
                {opciones.colores.length > 1 && imagenesDelProducto.imagenes_por_color && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">Colores disponibles:</p>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {opciones.colores.map((color) => {
                        const imagenColor = imagenesDelProducto.imagenes_por_color?.[color];
                        if (!imagenColor) return null;
                        
                        return (
                          <div 
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer transition-all transform hover:scale-105 ${
                              selectedColor === color 
                                ? 'ring-3 ring-amber-500 shadow-lg' 
                                : 'hover:ring-2 hover:ring-amber-300'
                            }`}
                          >
                            <ProductImage
                              src={imagenColor}
                              alt={`${producto.nombre} - ${color}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        );
                      })}
                    </div>
                    {selectedColor && (
                      <p className="text-xs text-gray-500 mt-2">
                        Color seleccionado: <span className="font-medium text-gray-700">{selectedColor}</span>
                      </p>
                    )}
                  </div>
                )}
                
                
                {/* Proyectos Realizados Mejorado */}
                {proyectos.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {(productId.includes('perfil') || productId.includes('clip')) ? 'Casos de Uso' : 'Trabajos Realizados'}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">
                          {(productId.includes('perfil') || productId.includes('clip'))
                            ? `Aplicaciones prácticas de ${producto.nombre}`
                            : `Proyectos reales con ${producto.nombre}`}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        {proyectos.length} PROYECTOS
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {proyectos.map((proyecto) => (
                        <div 
                          key={proyecto.id}
                          className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-amber-200 transition-all duration-500 hover:shadow-2xl cursor-pointer"
                          onMouseEnter={() => setHoveredProject(proyecto.id)}
                          onMouseLeave={() => setHoveredProject(null)}
                        >
                          <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                            {/* Contenedor para el efecto zoom */}
                            <div className="w-full h-full relative transition-transform duration-1000 ease-out group-hover:scale-105">
                              {/* Imagen base - siempre visible */}
                              <ProductImage
                                src={proyecto.imagen_principal}
                                alt={proyecto.titulo}
                                className="w-full h-full object-cover absolute inset-0"
                              />
                              {/* Imagen hover - aparece con crossfade suave */}
                              {proyecto.imagen_hover && (
                                <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                                  hoveredProject === proyecto.id ? 'opacity-100' : 'opacity-0'
                                }`}>
                                  <ProductImage
                                    src={proyecto.imagen_hover}
                                    alt={`${proyecto.titulo} - vista alternativa`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              {/* Overlay sutil para mejorar legibilidad del texto */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                            </div>
                            
                            {/* Badge de tipo de proyecto */}
                            <div className="absolute top-4 left-4 z-10">
                              <span className="bg-white/95 backdrop-blur-sm text-gray-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                                {proyecto.tipo}
                              </span>
                            </div>
                            
                            {/* Overlay con información rápida */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent h-32 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                              <div className="absolute bottom-4 left-4 right-4">
                                <p className="text-white text-sm font-medium line-clamp-2">
                                  {proyecto.descripcion}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-5">
                            <div className="mb-3">
                              <h4 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-amber-600 transition-colors">
                                {proyecto.titulo}
                              </h4>
                              <p className="text-xs text-gray-500 font-medium">
                                {proyecto.material_usado}
                              </p>
                            </div>
                            
                            {/* Características principales */}
                            <div className="space-y-2">
                              {proyecto.caracteristicas.slice(0, 3).map((caract, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0"></div>
                                  <span className="text-sm text-gray-600">{caract}</span>
                                </div>
                              ))}
                            </div>
                            
                            {/* Indicador visual de interactividad */}
                            <div className="mt-4 pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-400 group-hover:text-amber-600 transition-colors flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                Pasa el cursor para ver más detalles
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha: Información y Configurador */}
            <div className="">
              <div className="">
                
                {/* Badges */}
                <div className="flex gap-2 mb-4">
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                    Nuevo Producto
                  </span>
                  {producto.ventajas_competitivas && producto.ventajas_competitivas.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                      Premium
                    </span>
                  )}
                </div>
                
                {/* Título y Rating */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{producto.nombre}</h1>
                  
                  {/* Descripción completa */}
                  <div className="mb-4">
                    <p className="text-gray-700 text-base leading-relaxed">
                      {producto.descripcion_completa || producto.descripcion}
                    </p>
                  </div>
                  
                  {/* Rating y Reviews */}
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-900">(4.8)</span>
                    <span className="text-sm text-gray-500">{producto.variantes_count || 0} variantes disponibles</span>
                  </div>
                  
                  {/* Stock y disponibilidad */}
                  <div className="flex items-center space-x-4 text-sm">
                    <div className={`flex items-center ${
                      stockReal > 10 ? 'text-green-600' : 
                      stockReal > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        stockReal > 10 ? 'bg-green-500' : 
                        stockReal > 0 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      {stockReal > 10 ? 'Disponible' : 
                       stockReal > 0 ? `Stock limitado (${stockReal})` : 'Sin stock'}
                    </div>
                    <div className="text-gray-600">
                      {opciones.colores.length} colores • {opciones.dimensiones.length} tamaños
                    </div>
                  </div>
                </div>

                {/* Tabs de información */}
                <div className="border-b mb-6">
                  <div className="flex gap-0">
                    <button
                      onClick={() => setSelectedTab('descripcion')}
                      className={`px-6 py-4 font-semibold text-sm uppercase tracking-wide transition-all duration-300 border-b-3 ${
                        selectedTab === 'descripcion' 
                          ? 'border-amber-500 text-amber-600 bg-amber-50' 
                          : 'border-transparent text-gray-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-25'
                      }`}
                    >
                      Descripción
                    </button>
                    <button
                      onClick={() => setSelectedTab('especificaciones')}
                      className={`px-6 py-4 font-semibold text-sm uppercase tracking-wide transition-all duration-300 border-b-3 ${
                        selectedTab === 'especificaciones' 
                          ? 'border-amber-500 text-amber-600 bg-amber-50' 
                          : 'border-transparent text-gray-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-25'
                      }`}
                    >
                      Especificaciones
                    </button>
                    <button
                      onClick={() => setSelectedTab('instalacion')}
                      className={`px-6 py-4 font-semibold text-sm uppercase tracking-wide transition-all duration-300 border-b-3 ${
                        selectedTab === 'instalacion' 
                          ? 'border-amber-500 text-amber-600 bg-amber-50' 
                          : 'border-transparent text-gray-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-25'
                      }`}
                    >
                      Instalación
                    </button>
                  </div>
                </div>

                {/* Contenido de tabs */}
                <div className="mb-8">
                  {selectedTab === 'descripcion' && (
                    <div className="space-y-4">
                      {/* Características principales */}
                      {producto.caracteristicas && producto.caracteristicas.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Características principales</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {producto.caracteristicas.map((caracteristica, index) => (
                              <div key={index} className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
                                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-gray-700">{caracteristica}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Usos principales */}
                      {producto.usos_principales && producto.usos_principales.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Aplicaciones principales</h3>
                          <div className="flex flex-wrap gap-2">
                            {producto.usos_principales.map((uso, index) => (
                              <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                {uso}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ventajas competitivas */}
                      {producto.ventajas_competitivas && producto.ventajas_competitivas.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Ventajas competitivas</h3>
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <ul className="space-y-2">
                              {producto.ventajas_competitivas.map((ventaja, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-amber-600 font-bold">•</span>
                                  <span className="text-sm text-gray-700">{ventaja}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTab === 'especificaciones' && (
                    <div className="space-y-4">
                      {producto.especificaciones_tecnicas && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <table className="w-full">
                            <tbody>
                              {Object.entries(producto.especificaciones_tecnicas).map(([key, value]) => (
                                <tr key={key} className="border-b border-gray-200 last:border-0">
                                  <td className="py-3 text-sm font-medium text-gray-700 capitalize">
                                    {key.replace(/_/g, ' ')}
                                  </td>
                                  <td className="py-3 text-sm text-gray-900 text-right">
                                    {typeof value === 'object' ? JSON.stringify(value) : value}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTab === 'instalacion' && (
                    <div className="space-y-4">
                      {producto.instalacion_recomendada && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-3">Recomendaciones de instalación</h4>
                          <div className="space-y-2">
                            {Object.entries(producto.instalacion_recomendada).map(([key, value]) => (
                              <div key={key} className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">→</span>
                                <div>
                                  <span className="font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}:</span>
                                  <span className="text-gray-600 ml-2">{value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Configurador de producto */}
                <div className="mb-8">
                  <ProductConfiguratorSimple
                    productGroup={{
                      ...producto,
                      espesores: opciones.espesores,
                      dimensiones: opciones.dimensiones,
                      colores: opciones.colores,
                      variantes: producto.variantes || []
                    }}
                    className="border-0 shadow-none bg-transparent"
                  />
                </div>

                {/* Información de perfiles para productos alveolares */}
                {productId === 'policarbonato-alveolar' && (
                  <div className="mb-8">
                    <AlveolarProfileInfo />
                  </div>
                )}

                {/* Información adicional profesional */}
                <div className="mt-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mb-1">Garantía Extendida</div>
                      <div className="text-xs text-gray-600">10 años contra defectos</div>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-green-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mb-1">Protección UV</div>
                      <div className="text-xs text-gray-600">Filtro 99% rayos nocivos</div>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-amber-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mb-1">Logística Express</div>
                      <div className="text-xs text-gray-600">Entrega 24-48 horas</div>
                    </div>
                  </div>
                </div>

                {/* Soporte técnico profesional */}
                <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Soporte Técnico Especializado</p>
                        <p className="text-xs text-gray-600">Asesoramiento profesional para tu proyecto</p>
                      </div>
                    </div>
                    <button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Contactar Ahora
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sección de productos relacionados */}
        <div className="mt-16 bg-gray-50 py-16">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Productos Relacionados</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Completa tu proyecto con nuestra línea completa de policarbonato y accesorios profesionales
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Policarbonato Alveolar */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                  <ProductImage
                    src="/assets/images/Productos/Policarbonato Alveolar/Alveolar_Clear.webp"
                    alt="Policarbonato Alveolar"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Más Popular
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Policarbonato Alveolar</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Máximo aislamiento térmico con estructura de cámaras de aire. Ideal para cubiertas.
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Desde:</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">$8.500</div>
                  </div>
                  <button 
                    onClick={() => router.push('/productos/policarbonato-alveolar')}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium py-3 rounded-xl transition-all duration-200"
                  >
                    Ver Producto
                  </button>
                </div>
              </div>

              {/* Policarbonato Compacto */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                  <ProductImage
                    src="/assets/images/Productos/Policarbonato Compacto/policarbonato_compacto.webp"
                    alt="Policarbonato Compacto"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Premium
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Policarbonato Compacto</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Máxima resistencia al impacto. Perfecto para aplicaciones de alta exigencia.
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Desde:</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">$12.900</div>
                  </div>
                  <button 
                    onClick={() => router.push('/productos/policarbonato-compacto')}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium py-3 rounded-xl transition-all duration-200"
                  >
                    Ver Producto
                  </button>
                </div>
              </div>

              {/* Perfiles Alveolares */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                  <ProductImage
                    src="/assets/images/Productos/Perfiles/Gemini_Generated_Image_ytwkjzytwkjzytwk.webp"
                    alt="Perfiles Alveolares"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Esencial
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Perfiles Alveolares</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Perfiles de unión y sellado especializados para instalación profesional de policarbonato alveolar.
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Desde:</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">$850</div>
                  </div>
                  <button 
                    onClick={() => router.push('/perfiles')}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium py-3 rounded-xl transition-all duration-200"
                  >
                    Ver Perfiles
                  </button>
                </div>
              </div>
            </div>
            
            {/* CTA para ver todos los productos */}
            <div className="text-center mt-12">
              <button 
                onClick={() => router.push('/productos')}
                className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-8 rounded-xl border-2 border-gray-200 hover:border-amber-300 transition-all duration-200 inline-flex items-center gap-2"
              >
                Ver Todos los Productos
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}