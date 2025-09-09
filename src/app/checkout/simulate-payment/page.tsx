"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SimulatePaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [simulatingPayment, setSimulatingPayment] = useState(true);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Marcar el body para ocultar elementos flotantes durante checkout
    document.body.setAttribute('data-checkout-process', 'true');
    
    return () => {
      document.body.removeAttribute('data-checkout-process');
    };
  }, []);

  useEffect(() => {
    if (!token) {
      router.push('/checkout');
      return;
    }

    // Simular proceso de pago de 3-5 segundos
    const simulatePayment = async () => {
      setSimulatingPayment(true);
      
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
      
      // 90% de probabilidad de éxito, 10% de fallo para simular casos reales
      const isSuccess = Math.random() > 0.1;
      
      setPaymentStatus(isSuccess ? 'success' : 'failed');
      setSimulatingPayment(false);

      // Log del resultado
      if (isSuccess) {
        console.log('✅ Pago aprobado, iniciando countdown');
      } else {
        console.log('❌ Pago rechazado, no redirigiendo');
      }
    };

    simulatePayment();
  }, [token, router]);

  // Countdown para redirección
  useEffect(() => {
    if (paymentStatus === 'success' && !simulatingPayment) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          const newCount = prev - 1;
          if (newCount <= 0) {
            clearInterval(timer);
            return 0;
          }
          return newCount;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [paymentStatus, simulatingPayment]);

  // Separate useEffect for redirect to avoid setState during render
  useEffect(() => {
    if (paymentStatus === 'success' && !simulatingPayment && countdown <= 0) {
      console.log('🔄 Redirigiendo por countdown a página de éxito');
      const timeoutId = setTimeout(() => {
        router.push(`/checkout/success?token=${token}`);
      }, 100); // Small delay to avoid setState during render

      return () => clearTimeout(timeoutId);
    }
  }, [paymentStatus, simulatingPayment, countdown, router, token]);

  // Función para continuar manualmente
  const handleContinue = () => {
    console.log('🔄 Redirección manual a página de éxito');
    router.push(`/checkout/success?token=${token}`);
  };

  if (simulatingPayment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Logo simulado de Transbank/Webpay */}
          <div className="mb-6">
            <img
              src="/assets/images/transbank-logo.svg"
              alt="Transbank Webpay"
              className="h-12 mx-auto"
              onError={(e) => {
                console.log('Error cargando logo Transbank, usando fallback');
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.logo-fallback')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'logo-fallback bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-lg mx-auto inline-block';
                  fallback.textContent = 'TRANSBANK Webpay';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>

          {/* Animación de carga */}
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Procesando Pago
          </h1>
          <p className="text-gray-600 mb-4">
            Estamos procesando tu pago de forma segura...
          </p>
          
          {/* Información del token (solo para desarrollo) */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-700">
              <strong>Modo Simulador Activado</strong>
            </p>
            <p className="text-xs text-blue-600 font-mono break-all">
              Token: {token?.substring(0, 20)}...
            </p>
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <svg className="animate-pulse w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Transacción segura</span>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Logo simulado de Transbank/Webpay */}
          <div className="mb-6">
            <img
              src="/assets/images/transbank-logo.svg"
              alt="Transbank Webpay"
              className="h-12 mx-auto"
              onError={(e) => {
                console.log('Error cargando logo Transbank, usando fallback');
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.logo-fallback')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'logo-fallback bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-lg mx-auto inline-block';
                  fallback.textContent = 'TRANSBANK Webpay';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>

          {/* Icono de error */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-red-900 mb-2">
            Pago Rechazado
          </h1>
          <p className="text-gray-600 mb-6">
            Tu pago no pudo ser procesado. Esto puede deberse a fondos insuficientes, límites excedidos o problemas con la tarjeta.
          </p>

          {/* Información del error (simulado) */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-700">
              <strong>Código de error:</strong> SIMULATED_REJECTION
            </p>
            <p className="text-sm text-red-600">
              Por favor verifica los datos de tu tarjeta e intenta nuevamente.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/checkout')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Intentar Nuevamente
            </button>
            
            <Link
              href="/"
              className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Estado de éxito - se mostrará brevemente antes de redirigir
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Logo simulado de Transbank/Webpay */}
        <div className="mb-6">
          <img
            src="https://www.transbank.cl/public/img/Logo_Webpay3-01-01.png"
            alt="Webpay"
            className="h-12 mx-auto"
          />
        </div>

        {/* Icono de éxito */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-green-900 mb-2">
          ¡Pago Aprobado!
        </h1>
        <p className="text-gray-600 mb-4">
          Tu transacción ha sido procesada exitosamente.
        </p>

        {/* Información de éxito con countdown */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-700 mb-2">
            <strong>Transacción aprobada exitosamente</strong>
          </p>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">{countdown}</div>
            <p className="text-xs text-green-600">
              Redirigiendo automáticamente en {countdown} segundo{countdown !== 1 ? 's' : ''}...
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleContinue}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Continuar Ahora
          </button>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Procesamiento completado</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SimulatePaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <SimulatePaymentContent />
    </Suspense>
  );
}