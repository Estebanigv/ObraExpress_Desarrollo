"use client";

import React, { useState, useEffect, useMemo } from 'react';
import ProductConfiguratorSimple from '@/modules/products/components/product-configurator-simple';
import ObraExpressLoader from '@/components/ObraExpressLoader';

export default function PolicarbonatosClientSide() {
  const [filtroTipo, setFiltroTipo] = useState<string>('Todos');
  const [ordenPor, setOrdenPor] = useState<string>('nombre-asc');
  const [busqueda, setBusqueda] = useState<string>('');
  const [productosData, setProductosData] = useState<any>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [isClient, setIsClient] = useState(false);

  // Procesar solo productos de policarbonato
  const policarbonatosAgrupados = useMemo(() => {
    console.log('🔄 [POLICARBONATOS-PROC] Procesando policarbonatos...');
    console.log('🔄 [POLICARBONATOS-PROC] productosData existe?', !!productosData);
    
    if (!productosData) {
      console.log('❌ [POLICARBONATOS-PROC] No hay productosData');
      return [];
    }

    const { productos_por_categoria = {} } = productosData;
    console.log('🔄 [POLICARBONATOS-PROC] Categorías disponibles:', Object.keys(productos_por_categoria));

    // Buscar productos de policarbonato
    const todosPolicarbonatos = productos_por_categoria['Policarbonato'] || [];
    console.log('🔄 [POLICARBONATOS-PROC] Policarbonatos encontrados:', todosPolicarbonatos.length);
    
    // Separar por tipo dentro de Policarbonato y agregar información de espesores
    const policarbonatoOndulado = todosPolicarbonatos.find(p => p.tipo === 'Ondulado');
    const policarbonatoAlveolar = todosPolicarbonatos.find(p => p.tipo === 'Alveolar');
    const policarbonatoCompacto = todosPolicarbonatos.find(p => p.tipo === 'Compacto');
    
    // Agregar información de espesores disponibles a cada producto
    if (policarbonatoOndulado) {
      const espesores = [...new Set(policarbonatoOndulado.variantes?.map(v => v.espesor).filter(Boolean))];
      policarbonatoOndulado.espesores = espesores;
      console.log('🔄 [POLICARBONATOS-PROC] Ondulado espesores:', espesores);
    }
    
    if (policarbonatoAlveolar) {
      const espesores = [...new Set(policarbonatoAlveolar.variantes?.map(v => v.espesor).filter(Boolean))];
      policarbonatoAlveolar.espesores = espesores;
      console.log('🔄 [POLICARBONATOS-PROC] Alveolar espesores:', espesores);
    }
    
    if (policarbonatoCompacto) {
      const espesores = [...new Set(policarbonatoCompacto.variantes?.map(v => v.espesor).filter(Boolean))];
      policarbonatoCompacto.espesores = espesores;
      console.log('🔄 [POLICARBONATOS-PROC] Compacto espesores:', espesores);
    }
    
    console.log('🔄 [POLICARBONATOS-PROC] Tipos encontrados:', {
      ondulado: !!policarbonatoOndulado,
      alveolar: !!policarbonatoAlveolar,
      compacto: !!policarbonatoCompacto
    });
    let productosPolicarbonato = [policarbonatoOndulado, policarbonatoAlveolar, policarbonatoCompacto].filter(Boolean);

    // Aplicar filtros
    let productosFiltrados = productosPolicarbonato;

    // Filtro por búsqueda
    if (busqueda.trim()) {
      productosFiltrados = productosFiltrados.filter(producto =>
        producto.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        producto.id?.toLowerCase().includes(busqueda.toLowerCase()) ||
        producto.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        producto.tipo?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    // Filtro por tipo
    if (filtroTipo !== 'Todos') {
      productosFiltrados = productosFiltrados.filter(producto =>
        producto.tipo === filtroTipo
      );
    }

    // Ordenar
    productosFiltrados.sort((a, b) => {
      switch (ordenPor) {
        case 'nombre-asc':
          return (a.nombre || '').localeCompare(b.nombre || '');
        case 'nombre-desc':
          return (b.nombre || '').localeCompare(a.nombre || '');
        case 'precio-asc':
          const precioA = a.precio_desde || 0;
          const precioB = b.precio_desde || 0;
          return precioA - precioB;
        case 'precio-desc':
          const precioDscA = a.precio_desde || 0;
          const precioDscB = b.precio_desde || 0;
          return precioDscB - precioDscA;
        default:
          return 0;
      }
    });

    console.log('✅ [POLICARBONATOS-PROC] Procesamiento completado:', {
      total: productosFiltrados.length
    });

    return productosFiltrados;
  }, [productosData, busqueda, filtroTipo, ordenPor]);

  // Marcar como cliente y cargar datos
  useEffect(() => {
    console.log('🎯 [POLICARBONATOS-CLIENT] Componente PolicarbonatosClientSide montado');
    setIsClient(true);
    
    const loadData = async () => {
      try {
        console.log('🔄 [POLICARBONATOS-LOAD] Iniciando carga desde componente cliente...');
        
        const apiUrl = `/api/productos-publico?client=true&t=${Date.now()}`;
        console.log('🔄 [POLICARBONATOS-LOAD] Fetching:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        console.log('🔄 [POLICARBONATOS-LOAD] Response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ [POLICARBONATOS-LOAD] Datos recibidos:', {
            success: result.success,
            total: result.total,
            hasData: !!result.data,
            categoriesCount: Object.keys(result.data?.productos_por_categoria || {}).length
          });
          
          if (result.success && result.data) {
            setProductosData(result.data);
            console.log('✅ [POLICARBONATOS-LOAD] ProductosData establecido en componente policarbonatos');
          } else {
            console.error('❌ [POLICARBONATOS-LOAD] Error en respuesta:', result.error);
            setProductosData({ productos_por_categoria: {}, productos_policarbonato: [] });
          }
        } else {
          console.error('❌ [POLICARBONATOS-LOAD] HTTP Error:', response.status);
          setProductosData({ productos_por_categoria: {}, productos_policarbonato: [] });
        }
      } catch (error) {
        console.error('❌ [POLICARBONATOS-LOAD] Error de red:', error);
        setProductosData({ productos_por_categoria: {}, productos_policarbonato: [] });
      } finally {
        setIsLoadingProducts(false);
        console.log('✅ [POLICARBONATOS-LOAD] Carga finalizada');
      }
    };

    loadData();
  }, []);

  // Loading state - solo mostrar un loader
  if (!isClient || isLoadingProducts) {
    return (
      <ObraExpressLoader 
        message="Cargando policarbonatos"
        showPercentage={true}
        duration={1.5}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-40">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Policarbonatos
          </h1>
          <p className="text-gray-600 mb-4">
            Descubre nuestra gama completa de policarbonatos para construcción
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-4xl mx-auto">
            <p className="text-blue-800 text-sm">
              <strong>¿Qué tipo necesitas?</strong> El <strong>Ondulado</strong> es ideal para techos con pendiente, 
              el <strong>Alveolar</strong> para cubiertas que requieren aislamiento, y el <strong>Compacto</strong> 
              para aplicaciones que necesitan máxima transparencia y resistencia.
            </p>
          </div>
        </div>

        {/* Filtros básicos */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar policarbonatos
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por tipo, nombre..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de policarbonato
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="Todos">Todos los tipos</option>
                <option value="Ondulado">Ondulado</option>
                <option value="Alveolar">Alveolar</option>
                <option value="Compacto">Compacto</option>
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
              Catálogo de Policarbonatos
            </h2>
            <span className="text-sm text-gray-500">
              {policarbonatosAgrupados.length} tipo{policarbonatosAgrupados.length !== 1 ? 's' : ''} encontrado{policarbonatosAgrupados.length !== 1 ? 's' : ''}
            </span>
          </div>

          {policarbonatosAgrupados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {policarbonatosAgrupados.map((producto, index) => (
                <ProductConfiguratorSimple
                  key={`policarbonato-${producto.id || index}`}
                  productGroup={producto}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron policarbonatos</h3>
              <p className="text-gray-500">
                {busqueda ? 
                  `No hay policarbonatos que coincidan con "${busqueda}"` : 
                  'No hay policarbonatos disponibles en esta categoría'
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
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-orange-900 mb-3">
              Policarbonato Ondulado
            </h3>
            <p className="text-orange-800 text-sm">
              Ideal para techos con pendiente. Su perfil ondulado proporciona mayor rigidez estructural 
              y facilita el escurrimiento de agua. Perfecto para galpones y cobertizos.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">
              Policarbonato Alveolar
            </h3>
            <p className="text-green-800 text-sm">
              Estructura de celdas que proporciona excelente aislamiento térmico y acústico. 
              Ideal para invernaderos, terrazas y aplicaciones que requieren control climático.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Policarbonato Compacto
            </h3>
            <p className="text-blue-800 text-sm">
              Máxima transparencia y resistencia. Sin celdas internas, ofrece mayor claridad óptica 
              y resistencia al impacto. Perfecto para ventanas y aplicaciones arquitectónicas.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}