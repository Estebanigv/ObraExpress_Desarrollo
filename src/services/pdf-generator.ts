import jsPDF from 'jspdf';

export interface InvoiceData {
  orderNumber: string;
  date: string;
  customer: {
    nombre: string;
    email: string;
    telefono: string;
    empresa?: string;
    rut?: string;
    direccion: string;
    region: string;
    comuna: string;
  };
  items: Array<{
    id: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    espesor?: string;
    color?: string;
    dimensiones?: {
      ancho: number;
      largo: number;
    };
  }>;
  subtotal: number;
  iva: number;
  total: number;
  paymentDetails?: {
    method: string;
    transactionId?: string;
    authorizationCode?: string;
    paymentDate: string;
  };
}

export class PDFGenerator {
  private static readonly COMPANY_INFO = {
    name: 'ObraExpress',
    address: 'Dirección de la empresa', // TODO: Actualizar con dirección real
    phone: '+56 9 XXXX XXXX', // TODO: Actualizar con teléfono real
    email: 'ventas@obraexpress.cl',
    rut: 'XX.XXX.XXX-X', // TODO: Actualizar con RUT real
  };

  static async generateInvoicePDF(invoiceData: InvoiceData): Promise<Uint8Array> {
    const pdf = new jsPDF();
    
    // Configurar fuentes y colores
    const primaryColor = '#2563eb'; // Azul
    const secondaryColor = '#64748b'; // Gris
    const darkColor = '#1e293b'; // Gris oscuro
    
    let yPosition = 20;
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Header con logo y datos de la empresa
    pdf.setFontSize(24);
    pdf.setTextColor(primaryColor);
    pdf.text('ObraExpress', margin, yPosition);
    
    pdf.setFontSize(10);
    pdf.setTextColor(secondaryColor);
    yPosition += 8;
    pdf.text(this.COMPANY_INFO.address, margin, yPosition);
    yPosition += 5;
    pdf.text(`Tel: ${this.COMPANY_INFO.phone} | Email: ${this.COMPANY_INFO.email}`, margin, yPosition);
    yPosition += 5;
    pdf.text(`RUT: ${this.COMPANY_INFO.rut}`, margin, yPosition);
    
    // Información de la factura (lado derecho)
    pdf.setFontSize(16);
    pdf.setTextColor(darkColor);
    pdf.text('COMPROBANTE DE PAGO', pageWidth - margin - 60, 20);
    
    pdf.setFontSize(10);
    pdf.setTextColor(secondaryColor);
    pdf.text(`N° Orden: ${invoiceData.orderNumber}`, pageWidth - margin - 60, 32);
    pdf.text(`Fecha: ${new Date(invoiceData.date).toLocaleDateString('es-CL')}`, pageWidth - margin - 60, 40);
    
    // Línea separadora
    yPosition = 60;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    
    // Datos del cliente
    yPosition += 15;
    pdf.setFontSize(12);
    pdf.setTextColor(darkColor);
    pdf.text('DATOS DEL CLIENTE', margin, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(secondaryColor);
    pdf.text(`Nombre: ${invoiceData.customer.nombre}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Email: ${invoiceData.customer.email}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Teléfono: ${invoiceData.customer.telefono}`, margin, yPosition);
    
    if (invoiceData.customer.empresa) {
      yPosition += 6;
      pdf.text(`Empresa: ${invoiceData.customer.empresa}`, margin, yPosition);
    }
    
    if (invoiceData.customer.rut) {
      yPosition += 6;
      pdf.text(`RUT: ${invoiceData.customer.rut}`, margin, yPosition);
    }
    
    yPosition += 6;
    pdf.text(`Dirección: ${invoiceData.customer.direccion}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`${invoiceData.customer.comuna}, ${invoiceData.customer.region}`, margin, yPosition);
    
    // Tabla de productos
    yPosition += 20;
    pdf.setFontSize(12);
    pdf.setTextColor(darkColor);
    pdf.text('DETALLE DE PRODUCTOS', margin, yPosition);
    
    // Headers de la tabla
    yPosition += 15;
    const tableHeaders = ['Producto', 'Cant.', 'Precio Unit.', 'Subtotal'];
    const colWidths = [80, 20, 30, 30];
    let xPosition = margin;
    
    pdf.setFontSize(9);
    pdf.setTextColor(primaryColor);
    pdf.setFontSize(9);
    
    tableHeaders.forEach((header, index) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    
    // Línea bajo los headers
    yPosition += 3;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    
    // Filas de productos
    yPosition += 8;
    pdf.setTextColor(secondaryColor);
    
    invoiceData.items.forEach((item) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      
      xPosition = margin;
      
      // Nombre del producto con especificaciones
      let productName = item.nombre;
      if (item.espesor || item.color) {
        const specs = [item.espesor, item.color].filter(Boolean).join(', ');
        productName += ` (${specs})`;
      }
      if (item.dimensiones) {
        productName += `\\n${item.dimensiones.ancho}x${item.dimensiones.largo}m`;
      }
      
      const productLines = pdf.splitTextToSize(productName, colWidths[0] - 5);
      pdf.text(productLines, xPosition, yPosition);
      
      xPosition += colWidths[0];
      pdf.text(item.cantidad.toString(), xPosition, yPosition);
      
      xPosition += colWidths[1];
      pdf.text(`$${item.precioUnitario.toLocaleString('es-CL')}`, xPosition, yPosition);
      
      xPosition += colWidths[2];
      pdf.text(`$${item.subtotal.toLocaleString('es-CL')}`, xPosition, yPosition);
      
      yPosition += Math.max(15, productLines.length * 5);
    });
    
    // Totales
    yPosition += 10;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    
    yPosition += 15;
    const totalsX = pageWidth - margin - 80;
    
    pdf.setFontSize(10);
    pdf.setTextColor(secondaryColor);
    pdf.text('Subtotal:', totalsX, yPosition);
    pdf.text(`$${invoiceData.subtotal.toLocaleString('es-CL')}`, totalsX + 40, yPosition);
    
    yPosition += 8;
    pdf.text('IVA (19%):', totalsX, yPosition);
    pdf.text(`$${invoiceData.iva.toLocaleString('es-CL')}`, totalsX + 40, yPosition);
    
    yPosition += 8;
    pdf.setFontSize(12);
    pdf.setTextColor(darkColor);
    pdf.text('TOTAL:', totalsX, yPosition);
    pdf.text(`$${invoiceData.total.toLocaleString('es-CL')}`, totalsX + 40, yPosition);
    
    // Información de pago (si existe)
    if (invoiceData.paymentDetails) {
      yPosition += 20;
      pdf.setFontSize(12);
      pdf.setTextColor(darkColor);
      pdf.text('INFORMACIÓN DE PAGO', margin, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(secondaryColor);
      pdf.text(`Método: ${invoiceData.paymentDetails.method}`, margin, yPosition);
      
      if (invoiceData.paymentDetails.transactionId) {
        yPosition += 6;
        pdf.text(`ID Transacción: ${invoiceData.paymentDetails.transactionId}`, margin, yPosition);
      }
      
      if (invoiceData.paymentDetails.authorizationCode) {
        yPosition += 6;
        pdf.text(`Código Autorización: ${invoiceData.paymentDetails.authorizationCode}`, margin, yPosition);
      }
      
      yPosition += 6;
      pdf.text(`Fecha Pago: ${new Date(invoiceData.paymentDetails.paymentDate).toLocaleString('es-CL')}`, margin, yPosition);
    }
    
    // Footer
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.setFontSize(8);
    pdf.setTextColor(secondaryColor);
    pdf.text('Este comprobante es válido para efectos tributarios', margin, pageHeight - 30);
    pdf.text('ObraExpress - Especialistas en Policarbonato', margin, pageHeight - 22);
    pdf.text(`Generado el: ${new Date().toLocaleString('es-CL')}`, margin, pageHeight - 14);
    
    return pdf.output('arraybuffer') as Uint8Array;
  }
  
  static async downloadInvoice(invoiceData: InvoiceData): Promise<void> {
    const pdfBytes = await this.generateInvoicePDF(invoiceData);
    
    // Crear blob y descargar
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Comprobante_${invoiceData.orderNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}