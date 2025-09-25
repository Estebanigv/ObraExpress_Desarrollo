"use client";

import React, { useState, useEffect, useMemo } from 'react';
import ProductConfiguratorSimple from '@/modules/products/components/product-configurator-simple';
import ObraExpressLoader from '@/components/ObraExpressLoader';

export default function PerfilesClientSide() {
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todos');
  const [ordenPor, setOrdenPor] = useState<string>('nombre-asc');
  const [busqueda, setBusqueda] = useState<string>('');
  const [productosData, setProductosData] = useState<any>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [isClient, setIsClient] = useState(false);

  // Procesar solo productos de perfiles
  const perfilesAgrupados = useMemo(() => {
    console.log('🔄 [PERFILES-PROC] Procesando perfiles...');
    console.log('🔄 [PERFILES-PROC] productosData existe?', !!productosData);
    
    if (!productosData) {
      console.log('❌ [PERFILES-PROC] No hay productosData');
      return [];
    }

    const { productos_por_categoria = {} } = productosData;
    console.log('🔄 [PERFILES-PROC] Categorías disponibles:', Object.keys(productos_por_categoria));

    // Buscar perfiles en la categoría "Accesorios" donde están todos los perfiles
    const perfilesIndividuales = [];
    const accesorios = productos_por_categoria['Accesorios'] || [];
    
    // Filtrar solo los perfiles de la categoría Accesorios
    accesorios.forEach(producto => {
      if (producto.id === 'perfil-u' || 
          producto.id === 'perfil-clip-plano' || 
          producto.id === 'perfil-h' ||
          producto.nombre?.toLowerCase().includes('perfil')) {
        
        let categoria = 'Perfiles';
        let nombreDescriptivo = producto.nombre;
        
        // Asignar categorías específicas para el filtro
        if (producto.id === 'perfil-u' || producto.nombre?.toLowerCase().includes('perfil u')) {
          categoria = 'Perfil U';
          nombreDescriptivo = 'Perfil U de Policarbonato';
        } else if (producto.id === 'perfil-clip-plano' || producto.nombre?.toLowerCase().includes('perfil clip')) {
          categoria = 'Perfil Clip Plano';
          nombreDescriptivo = 'Perfil Clip Plano de Policarbonato';
        } else if (producto.id === 'perfil-h' || producto.nombre?.toLowerCase().includes('perfil h')) {
          categoria = 'Perfil H';
          nombreDescriptivo = 'Perfil H de Policarbonato';
        }
        
        perfilesIndividuales.push({
          ...producto,
          nombre: nombreDescriptivo,
          categoria: categoria
        });
        
        console.log('🔄 [PERFILES-PROC] Perfil encontrado:', nombreDescriptivo);
      }
    });
    
    console.log('🔄 [PERFILES-PROC] Perfiles encontrados:', {
      total: perfilesIndividuales.length,
      nombres: perfilesIndividuales.map(p => p.nombre || p.id)
    });

    // Aplicar filtros
    let perfilesFiltrados = perfilesIndividuales;

    // Filtro por búsqueda
    if (busqueda.trim()) {
      perfilesFiltrados = perfilesFiltrados.filter(perfil =>
        perfil.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        perfil.id?.toLowerCase().includes(busqueda.toLowerCase()) ||
        perfil.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    // Filtro por categoría
    if (filtroCategoria !== 'Todos') {
      perfilesFiltrados = perfilesFiltrados.filter(perfil =>
        perfil.categoria === filtroCategoria
      );
    }

    // Ordenar
    perfilesFiltrados.sort((a, b) => {
      switch (ordenPor) {
        case 'nombre-asc':
          return (a.nombre || '').localeCompare(b.nombre || '');
        case 'nombre-desc':
          return (b.nombre || '').localeCompare(a.nombre || '');
        case 'precio-asc':
          const precioA = a.variantes?.[0]?.precio || 0;
          const precioB = b.variantes?.[0]?.precio || 0;
          return precioA - precioB;
        case 'precio-desc':
          const precioDscA = a.variantes?.[0]?.precio || 0;
          const precioDscB = b.variantes?.[0]?.precio || 0;
          return precioDscB - precioDscA;
        default:
          return 0;
      }
    });

    console.log('✅ [PERFILES-PROC] Procesamiento completado:', {
      total: perfilesFiltrados.length
    });

    return perfilesFiltrados;
  }, [productosData, busqueda, filtroCategoria, ordenPor]);

  // Marcar como cliente y cargar datos
  useEffect(() => {
    console.log('🎯 [PERFILES-CLIENT] Componente PerfilesClientSide montado');
    setIsClient(true);
    
    const loadData = async () => {
      try {
        console.log('🔄 [PERFILES-LOAD] Iniciando carga desde componente cliente...');
        
        const apiUrl = `/api/productos-publico?client=true&t=${Date.now()}`;
        console.log('🔄 [PERFILES-LOAD] Fetching:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        console.log('🔄 [PERFILES-LOAD] Response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ [PERFILES-LOAD] Datos recibidos:', {
            success: result.success,
            total: result.total,
            hasData: !!result.data,
            categoriesCount: Object.keys(result.data?.productos_por_categoria || {}).length
          });
          
          if (result.success && result.data) {
            setProductosData(result.data);
            console.log('✅ [PERFILES-LOAD] ProductosData establecido en componente perfiles');
          } else {
            console.error('❌ [PERFILES-LOAD] Error en respuesta:', result.error);
            setProductosData({ productos_por_categoria: {}, productos_policarbonato: [] });
          }
        } else {
          console.error('❌ [PERFILES-LOAD] HTTP Error:', response.status);
          setProductosData({ productos_por_categoria: {}, productos_policarbonato: [] });
        }
      } catch (error) {
        console.error('❌ [PERFILES-LOAD] Error de red:', error);
        setProductosData({ productos_por_categoria: {}, productos_policarbonato: [] });
      } finally {
        setIsLoadingProducts(false);
        console.log('✅ [PERFILES-LOAD] Carga finalizada');
      }
    };

    loadData();
  }, []);

  // Loading state - solo mostrar un loader
  if (!isClient || isLoadingProducts) {
    return (
      <ObraExpressLoader 
        message="Cargando catálogo de perfiles"
        showPercentage={true}
        duration={2}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-40">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Perfiles para Policarbonato
          </h1>
          <p className="text-gray-600 mb-4">
            Accesorios esenciales para la instalación correcta de tus paneles de policarbonato
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-4xl mx-auto">
            <p className="text-amber-800 text-sm">
              <strong>¿Por qué necesitas perfiles?</strong> Los perfiles son fundamentales para una instalación profesional. 
              Protegen los bordes, sellan contra filtraciones y garantizan una unión perfecta entre paneles.
            </p>
          </div>
        </div>

        {/* Filtros básicos */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar perfiles
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, tipo..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Productos
              </label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="Todos">Todos los productos</option>
                <option value="Perfil U">Perfil U (Cierre)</option>
                <option value="Perfil Clip Plano">Perfil Clip Plano (Unión)</option>
                <option value="Perfil H">Perfil H (Conector)</option>
                <option value="Perfiles">Otros Perfiles</option>
              </select>
            </div>

            {/* Orden */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <select
                value={ordenPor}
                onChange={(e) => setOrdenPor(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="nombre-asc">Nombre (A-Z)</option>
                <option value="nombre-desc">Nombre (Z-A)</option>
                <option value="precio-asc">Precio (Menor a mayor)</option>
                <option value="precio-desc">Precio (Mayor a menor)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Catálogo de Perfiles
            </h2>
            <span className="text-sm text-gray-500">
              {perfilesAgrupados.length} perfil{perfilesAgrupados.length !== 1 ? 'es' : ''} encontrado{perfilesAgrupados.length !== 1 ? 's' : ''}
            </span>
          </div>

          {perfilesAgrupados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {perfilesAgrupados.map((perfil, index) => (
                <ProductConfiguratorSimple
                  key={`perfil-${perfil.id || perfil.nombre || index}`}
                  productGroup={perfil}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron perfiles</h3>
              <p className="text-gray-500">
                {busqueda ? 
                  `No hay perfiles que coincidan con "${busqueda}"` : 
                  'No hay perfiles disponibles en esta categoría'
                }
              </p>
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="mt-4 text-yellow-600 hover:text-yellow-700 font-medium"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Perfil U - Para cerrar extremos
            </h3>
            <p className="text-blue-800 text-sm">
              Ideal para sellar los extremos de los paneles alveolares. Evita el ingreso de agua, 
              polvo e insectos. Instalación fácil y acabado profesional.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">
              Perfil Clip Plano - Para unir paneles
            </h3>
            <p className="text-green-800 text-sm">
              Sistema de unión sin tornillos para paneles alveolares. Permite expansión térmica 
              y garantiza una instalación rápida y segura.
            </p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">
              Perfil H - Para conectar paneles
            </h3>
            <p className="text-purple-800 text-sm">
              Conector que une dos planchas de policarbonato creando superficies amplias 
              con uniones impermeables y estéticamente perfectas.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}