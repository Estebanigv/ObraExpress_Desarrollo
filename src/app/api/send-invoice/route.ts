import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { PDFGenerator, InvoiceData } from '@/services/pdf-generator';

interface EmailRequest {
  invoiceData: InvoiceData;
  customerEmail: string;
}

export async function POST(request: NextRequest) {
  try {
    const { invoiceData, customerEmail }: EmailRequest = await request.json();

    // Validar datos requeridos
    if (!invoiceData || !customerEmail) {
      return NextResponse.json(
        { error: 'Datos de factura y email requeridos' },
        { status: 400 }
      );
    }

    // Generar PDF
    console.log('📄 Generando PDF de comprobante...');
    const pdfBuffer = await PDFGenerator.generateInvoicePDF(invoiceData);

    // Configurar transporter de email
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true para puerto 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Configuración adicional para Gmail
      ...(process.env.EMAIL_HOST === 'smtp.gmail.com' && {
        service: 'gmail',
        tls: {
          rejectUnauthorized: false
        }
      })
    });

    // Verificar conexión
    try {
      await transporter.verify();
      console.log('✅ Servidor de email configurado correctamente');
    } catch (error) {
      console.error('❌ Error configurando servidor de email:', error);
      // En desarrollo, continuar sin enviar email real
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Modo desarrollo: Simulando envío de email');
        return NextResponse.json({
          success: true,
          message: 'Comprobante generado (simulado en desarrollo)',
          simulated: true
        });
      }
      throw error;
    }

    // Crear el contenido del email
    const emailHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comprobante de Pago - ObraExpress</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #2563eb, #1e40af);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            .content {
                background: white;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
            }
            .order-info {
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .footer {
                background: #1e293b;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 0 0 8px 8px;
                font-size: 14px;
            }
            .button {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
            }
            .highlight {
                color: #2563eb;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>¡Tu pedido ha sido confirmado!</h1>
            <h2>ObraExpress</h2>
        </div>
        
        <div class="content">
            <p>Hola <strong>${invoiceData.customer.nombre}</strong>,</p>
            
            <p>Te confirmamos que hemos recibido tu pago y tu pedido está siendo procesado.</p>
            
            <div class="order-info">
                <h3>Detalles del pedido:</h3>
                <p><strong>Número de orden:</strong> <span class="highlight">${invoiceData.orderNumber}</span></p>
                <p><strong>Fecha:</strong> ${new Date(invoiceData.date).toLocaleDateString('es-CL')}</p>
                <p><strong>Total pagado:</strong> <span class="highlight">$${invoiceData.total.toLocaleString('es-CL')}</span></p>
                ${invoiceData.paymentDetails ? `
                <p><strong>Método de pago:</strong> ${invoiceData.paymentDetails.method}</p>
                ${invoiceData.paymentDetails.authorizationCode ? `
                <p><strong>Código de autorización:</strong> ${invoiceData.paymentDetails.authorizationCode}</p>
                ` : ''}
                ` : ''}
            </div>
            
            <h3>Productos adquiridos:</h3>
            <ul>
                ${invoiceData.items.map(item => `
                <li>
                    <strong>${item.nombre}</strong>
                    ${item.espesor || item.color ? ` (${[item.espesor, item.color].filter(Boolean).join(', ')})` : ''}
                    ${item.dimensiones ? ` - ${item.dimensiones.ancho}x${item.dimensiones.largo}m` : ''}
                    <br>
                    Cantidad: ${item.cantidad} | Precio: $${item.subtotal.toLocaleString('es-CL')}
                </li>
                `).join('')}
            </ul>
            
            <p>Adjunto encontrarás tu comprobante de pago en formato PDF.</p>
            
            <h3>¿Qué sigue?</h3>
            <p>Nuestro equipo se pondrá en contacto contigo dentro de las próximas 24 horas para coordinar la entrega de tu pedido.</p>
            
            <p>Si tienes alguna consulta, no dudes en contactarnos:</p>
            <ul>
                <li>📧 Email: ventas@obraexpress.cl</li>
                <li>📱 WhatsApp: +56 9 XXXX XXXX</li>
                <li>📞 Teléfono: +56 2 XXXX XXXX</li>
            </ul>
        </div>
        
        <div class="footer">
            <p><strong>ObraExpress</strong> - Especialistas en Policarbonato</p>
            <p>Gracias por confiar en nosotros para tu proyecto.</p>
        </div>
    </body>
    </html>
    `;

    const emailText = `
    Hola ${invoiceData.customer.nombre},

    Te confirmamos que hemos recibido tu pago y tu pedido está siendo procesado.

    Detalles del pedido:
    - Número de orden: ${invoiceData.orderNumber}
    - Fecha: ${new Date(invoiceData.date).toLocaleDateString('es-CL')}
    - Total pagado: $${invoiceData.total.toLocaleString('es-CL')}

    Productos adquiridos:
    ${invoiceData.items.map(item => `
    - ${item.nombre} ${item.espesor || item.color ? `(${[item.espesor, item.color].filter(Boolean).join(', ')})` : ''}
      Cantidad: ${item.cantidad} | Precio: $${item.subtotal.toLocaleString('es-CL')}
    `).join('')}

    Nuestro equipo se pondrá en contacto contigo dentro de las próximas 24 horas para coordinar la entrega.

    Gracias por confiar en ObraExpress.

    Saludos cordiales,
    Equipo ObraExpress
    `;

    // Configurar y enviar email
    const mailOptions = {
      from: {
        name: 'ObraExpress',
        address: process.env.EMAIL_USER || 'noreply@obraexpress.cl'
      },
      to: customerEmail,
      subject: `Comprobante de Pago - Orden ${invoiceData.orderNumber}`,
      text: emailText,
      html: emailHTML,
      attachments: [
        {
          filename: `Comprobante_${invoiceData.orderNumber}.pdf`,
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf'
        }
      ]
    };

    console.log('📧 Enviando email a:', customerEmail);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado:', info.messageId);

    return NextResponse.json({
      success: true,
      message: 'Comprobante enviado por email exitosamente',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('❌ Error enviando comprobante por email:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor al enviar email',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}