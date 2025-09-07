"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { PDFGenerator, InvoiceData } from '@/services/pdf-generator';

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
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderTotal, setOrderTotal] = useState<number>(0);

  useEffect(() => {
    // Marcar el body para ocultar elementos flotantes durante checkout
    document.body.setAttribute('data-checkout-process', 'true');
    
    return () => {
      document.body.removeAttribute('data-checkout-process');
    };
  }, []);

  useEffect(() => {
    if (!token) {
      router.push('/');
      return;
    }

    const initializeSuccessPage = async () => {
      try {
        // Capturar datos del carrito antes de que se limpie
        const currentItems = [...state.items];
        const currentTotal = state.total;
        
        console.log('🛒 Cart state at success page:', {
          items: currentItems,
          total: currentTotal,
          itemsCount: currentItems.length
        });
        
        // Guardar estos datos en el estado local
        setOrderItems(currentItems);
        setOrderTotal(currentTotal);

        // En modo simulador, generar datos ficticios
        const isSimulated = token.startsWith('SIMULATED_TOKEN');
        let orderSummaryData: OrderSummary;
        
        if (isSimulated) {
          // Extraer buyOrder del token simulado
          const buyOrderMatch = token.match(/SIMULATED_TOKEN_(.+)_\d+/);
          const buyOrder = buyOrderMatch ? buyOrderMatch[1] : 'SIMULATED_ORDER';
          
          orderSummaryData = {
            buyOrder: buyOrder,
            amount: currentTotal,
            authorizationCode: `SIM${Math.random().toString().substr(2, 6)}`,
            transactionDate: new Date().toLocaleString('es-CL'),
            cardType: 'VISA',
            cardLast4: '1234'
          };
        } else {
          // Aquí iría la lógica para obtener detalles reales de Transbank
          // Por ahora usar datos simulados también
          orderSummaryData = {
            buyOrder: `REAL_${Date.now()}`,
            amount: currentTotal,
            authorizationCode: `AUTH${Math.random().toString().substr(2, 6)}`,
            transactionDate: new Date().toLocaleString('es-CL'),
            cardType: 'MASTERCARD',
            cardLast4: '5678'
          };
        }

        setOrderSummary(orderSummaryData);

        // Recuperar datos del cliente desde localStorage (guardados en checkout)
        const storedCustomerData = localStorage.getItem('checkout_customer_data');
        if (storedCustomerData) {
          setCustomerData(JSON.parse(storedCustomerData));
        }

        // Limpiar carrito después de pago exitoso - solo si tiene items
        if (currentItems.length > 0) {
          clearCart();
        }
        setLoading(false);
        
        // Enviar automáticamente el comprobante por email si hay datos del cliente
        if (storedCustomerData) {
          const customerInfo = JSON.parse(storedCustomerData);
          setTimeout(() => {
            sendInvoiceEmail(orderSummaryData, customerInfo);
          }, 1000);
        }
      } catch (error) {
        console.error('Error inicializando página de éxito:', error);
        setLoading(false);
      }
    };

    // Solo ejecutar una vez cuando se carga la página
    if (!orderSummary && loading && token) {
      initializeSuccessPage();
    }
  }, [token, router, orderSummary, loading]); // Fixed logic and dependencies

  // Función para generar datos de factura
  const generateInvoiceData = (summary: OrderSummary, customer: any): InvoiceData => {
    const subtotal = Math.round(summary.amount / 1.19); // Calcular subtotal sin IVA
    const iva = summary.amount - subtotal;
    
    return {
      orderNumber: summary.buyOrder,
      date: new Date().toISOString(),
      customer: {
        nombre: customer?.nombre || 'Cliente',
        email: customer?.email || 'cliente@email.com',
        telefono: customer?.telefono || 'N/A',
        empresa: customer?.empresa || undefined,
        rut: customer?.rut || undefined,
        direccion: customer?.direccion || 'N/A',
        region: customer?.region || 'N/A',
        comuna: customer?.comuna || 'N/A'
      },
      items: orderItems.map(item => ({
        id: item.id || 'unknown',
        nombre: item.nombre || 'Producto',
        cantidad: item.cantidad || 1,
        precioUnitario: item.precioUnitario || 0,
        subtotal: item.total || 0,
        espesor: item.espesor,
        color: item.color,
        dimensiones: item.ancho && item.largo ? {
          ancho: item.ancho,
          largo: item.largo
        } : undefined
      })),
      subtotal,
      iva,
      total: summary.amount,
      paymentDetails: {
        method: `${summary.cardType} ***${summary.cardLast4}`,
        transactionId: summary.buyOrder,
        authorizationCode: summary.authorizationCode,
        paymentDate: new Date().toISOString()
      }
    };
  };

  // Función para descargar PDF
  const downloadPDF = async () => {
    if (!orderSummary || !customerData) {
      alert('No hay datos disponibles para generar el comprobante');
      return;
    }

    setPdfGenerating(true);
    try {
      const invoiceData = generateInvoiceData(orderSummary, customerData);
      await PDFGenerator.downloadInvoice(invoiceData);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el comprobante PDF');
    } finally {
      setPdfGenerating(false);
    }
  };

  // Función para enviar comprobante por email
  const sendInvoiceEmail = async (summary?: OrderSummary, customer?: any) => {
    const summaryToUse = summary || orderSummary;
    const customerToUse = customer || customerData;
    
    if (!summaryToUse || !customerToUse?.email) {
      console.log('No hay datos suficientes para enviar email');
      return;
    }

    setEmailSending(true);
    try {
      const invoiceData = generateInvoiceData(summaryToUse, customerToUse);
      
      const response = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceData,
          customerEmail: customerToUse.email
        })
      });

      const result = await response.json();
      
      if (result.success || result.simulated) {
        setEmailSent(true);
        console.log('✅ Comprobante enviado por email' + (result.simulated ? ' (simulado)' : ''));
      } else {
        console.warn('⚠️ No se pudo enviar el email:', result.error);
        // En desarrollo, no consideramos esto un error crítico
        if (process.env.NODE_ENV === 'development') {
          console.log('🧪 Modo desarrollo: Email no enviado pero continuando...');
        }
      }
    } catch (error) {
      console.error('Error enviando comprobante por email:', error);
      // En desarrollo, loggear pero no interrumpir el flujo
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Modo desarrollo: Error de email ignorado');
      }
      // No mostrar error al usuario ya que es automático
    } finally {
      setEmailSending(false);
    }
  };

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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

          {/* Products Section */}
          {orderItems.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Productos Comprados</h3>
              <div className="space-y-4">
                {orderItems.map((item, index) => {
                  console.log(`🛍️ Rendering item ${index}:`, {
                    nombre: item.nombre,
                    precioUnitario: item.precioUnitario,
                    total: item.total,
                    cantidad: item.cantidad,
                    imagen: item.imagen,
                    categoria: item.categoria,
                    espesor: item.espesor,
                    color: item.color
                  });
                  return (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {item.imagen ? (
                        <img
                          src={item.imagen}
                          alt={item.nombre}
                          className="w-16 h-16 rounded-lg object-cover bg-white border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/images/placeholder-product.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">{item.nombre}</h4>
                      <div className="text-sm text-gray-500 mt-1">
                        {item.categoria && (
                          <div>Categoría: {item.categoria}</div>
                        )}
                        {item.espesor && (
                          <span>Espesor: {item.espesor} | </span>
                        )}
                        {item.color && (
                          <span>Color: {item.color}</span>
                        )}
                        {item.ancho && item.largo && (
                          <div className="mt-1">
                            Dimensiones: {item.ancho}m x {item.largo}m
                          </div>
                        )}
                        {item.especificaciones && item.especificaciones.length > 0 && (
                          <div className="mt-1 text-xs">
                            {item.especificaciones.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm text-gray-500">Cantidad: {item.cantidad || 1}</div>
                      <div className="font-medium text-gray-900">
                        ${(item.total || 0).toLocaleString('es-CL')}
                      </div>
                      <div className="text-xs text-gray-400">
                        ${(item.precioUnitario || 0).toLocaleString('es-CL')} c/u
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
              
              {/* Total Summary */}
              <div className="border-t mt-6 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-green-600">
                    ${orderTotal.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Comprobante de Pago</h3>
          
          {/* Email Status */}
          <div className="mb-6">
            {emailSending && (
              <div className="flex items-center text-blue-600 mb-2">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Enviando comprobante por email...</span>
              </div>
            )}
            
            {emailSent && (
              <div className="flex items-center text-green-600 mb-2">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Comprobante enviado a {customerData?.email}</span>
              </div>
            )}
            
            {!emailSending && !emailSent && customerData?.email && (
              <div className="flex items-center text-gray-600 mb-2">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Preparando envío del comprobante...</span>
              </div>
            )}
          </div>
          
          {/* Download PDF Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadPDF}
              disabled={pdfGenerating || !orderSummary || !customerData}
              className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {pdfGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando PDF...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Descargar Comprobante PDF
                </>
              )}
            </button>
            
            {customerData?.email && (
              <button
                onClick={() => sendInvoiceEmail()}
                disabled={emailSending}
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {emailSending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Reenviar por Email
                  </>
                )}
              </button>
            )}
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