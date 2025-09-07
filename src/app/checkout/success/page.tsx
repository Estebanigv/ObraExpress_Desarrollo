"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

interface OrderSummary {
  buyOrder: string;
  amount: number;
  authorizationCode: string;
  transactionDate: string;
  cardType: string;
  cardLast4: string;
}

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart, state } = useCart();
  const token = searchParams.get('token');
  
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/');
      return;
    }

    const initializeSuccessPage = async () => {
      try {
        // En modo simulador, generar datos ficticios
        const isSimulated = token.startsWith('SIMULATED_TOKEN');
        
        if (isSimulated) {
          // Extraer buyOrder del token simulado
          const buyOrderMatch = token.match(/SIMULATED_TOKEN_(.+)_\d+/);
          const buyOrder = buyOrderMatch ? buyOrderMatch[1] : 'SIMULATED_ORDER';
          
          const simulatedSummary: OrderSummary = {
            buyOrder: buyOrder,
            amount: state.total,
            authorizationCode: `SIM${Math.random().toString().substr(2, 6)}`,
            transactionDate: new Date().toLocaleString('es-CL'),
            cardType: 'VISA',
            cardLast4: '1234'
          };
          
          setOrderSummary(simulatedSummary);
        } else {
          // Aquí iría la lógica para obtener detalles reales de Transbank
          // Por ahora usar datos simulados también
          const realSummary: OrderSummary = {
            buyOrder: `REAL_${Date.now()}`,
            amount: state.total,
            authorizationCode: `AUTH${Math.random().toString().substr(2, 6)}`,
            transactionDate: new Date().toLocaleString('es-CL'),
            cardType: 'MASTERCARD',
            cardLast4: '5678'
          };
          
          setOrderSummary(realSummary);
        }

        // Limpiar carrito después de pago exitoso
        clearCart();
        setLoading(false);
      } catch (error) {
        console.error('Error inicializando página de éxito:', error);
        setLoading(false);
      }
    };

    initializeSuccessPage();
  }, [token, router, state.total, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!orderSummary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error al cargar información del pedido
          </h1>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">O</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-gray-900">Obra</span>
                <span className="text-yellow-500">Express</span>
              </h1>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Pago Exitoso!
          </h1>
          <p className="text-lg text-gray-600">
            Tu pedido ha sido confirmado y será procesado pronto.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Detalles del Pedido</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Información de la Transacción</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Número de Orden:</span>
                  <span className="font-medium">{orderSummary.buyOrder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Código de Autorización:</span>
                  <span className="font-medium">{orderSummary.authorizationCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium">{orderSummary.transactionDate}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Información del Pago</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto Total:</span>
                  <span className="font-medium text-lg text-green-600">
                    ${orderSummary.amount.toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Método de Pago:</span>
                  <span className="font-medium">
                    {orderSummary.cardType} ***{orderSummary.cardLast4}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="font-medium text-green-600">Aprobado</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-3">¿Qué sigue ahora?</h3>
          <div className="space-y-2 text-blue-800">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm">Recibirás un email de confirmación con los detalles de tu pedido</p>
            </div>
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm">Nuestro equipo procesará tu pedido y te contactará para coordinar la entrega</p>
            </div>
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm">Podrás hacer seguimiento de tu pedido a través de nuestros canales de contacto</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Información de Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-gray-700">+56 9 7528 4619</span>
            </div>
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-700">contacto@obraexpress.cl</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/productos"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Seguir Comprando
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>

        {/* Debug Info (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs">
            <h4 className="text-green-300 font-bold mb-2">DEBUG INFO (Solo desarrollo):</h4>
            <p>Token: {token}</p>
            <p>Modo simulador: {token?.startsWith('SIMULATED_TOKEN') ? 'SÍ' : 'NO'}</p>
            <p>Timestamp: {new Date().toISOString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}