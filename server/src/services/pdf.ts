import PDFDocument from 'pdfkit';
import { Invoice, InvoiceItem, Contact, User } from '@shared/schema';
import { storage } from '../../storage';

export interface InvoiceWithDetails extends Invoice {
  items: InvoiceItem[];
  contact?: Contact;
  user?: User;
}

export interface PDFGenerationOptions {
  templateId?: number;
  includeLogo?: boolean;
  customization?: {
    primaryColor?: string;
    logoUrl?: string;
    footerText?: string;
  };
}

export class InvoicePDFService {
  private formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  private formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  async generateInvoicePDF(
    invoiceId: number,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    // Get invoice with all related data
    const invoice = await storage.getInvoiceWithItems(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const contact = invoice.contactId 
      ? await storage.getContact(invoice.contactId)
      : null;

    const user = await storage.getUser(invoice.userId);

    const invoiceWithDetails: InvoiceWithDetails = {
      ...invoice,
      contact: contact || undefined,
      user: user || undefined,
    };

    return this.createPDFDocument(invoiceWithDetails, options);
  }

  private createPDFDocument(
    invoice: InvoiceWithDetails,
    options: PDFGenerationOptions
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Set primary color
        const primaryColor = options.customization?.primaryColor || '#2563eb';

        // Header
        this.addHeader(doc, invoice, options, primaryColor);

        // Invoice details
        this.addInvoiceDetails(doc, invoice);

        // Billing information
        this.addBillingInfo(doc, invoice);

        // Items table
        this.addItemsTable(doc, invoice);

        // Totals
        this.addTotals(doc, invoice);

        // Payment terms and notes
        this.addPaymentTermsAndNotes(doc, invoice);

        // Footer
        this.addFooter(doc, invoice, options);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private addHeader(
    doc: PDFKit.PDFDocument,
    invoice: InvoiceWithDetails,
    options: PDFGenerationOptions,
    primaryColor: string
  ) {
    const startY = 50;

    // Company logo (if available)
    if (options.includeLogo && options.customization?.logoUrl) {
      // In a real implementation, you would load and add the logo image
      // doc.image(options.customization.logoUrl, 50, startY, { width: 100 });
    }

    // Company information (right side)
    doc.fontSize(20)
       .fillColor(primaryColor)
       .text('INVOICE', 350, startY, { align: 'right' });

    doc.fontSize(10)
       .fillColor('#333333')
       .text(invoice.user?.firstName + ' ' + invoice.user?.lastName || 'Your Company', 350, startY + 30, { align: 'right' })
       .text(invoice.user?.email || 'company@example.com', 350, startY + 45, { align: 'right' })
       .text(invoice.user?.phone || '+1 (555) 123-4567', 350, startY + 60, { align: 'right' });

    // Invoice number and date
    doc.fontSize(12)
       .fillColor(primaryColor)
       .text(`Invoice #${invoice.invoiceNumber}`, 350, startY + 90, { align: 'right' });

    doc.fontSize(10)
       .fillColor('#666666')
       .text(`Issue Date: ${this.formatDate(invoice.issueDate)}`, 350, startY + 110, { align: 'right' })
       .text(`Due Date: ${this.formatDate(invoice.dueDate)}`, 350, startY + 125, { align: 'right' });

    // Status badge
    const statusColor = this.getStatusColor(invoice.status);
    doc.rect(350, startY + 145, 100, 20)
       .fillAndStroke(statusColor, statusColor);
    
    doc.fontSize(10)
       .fillColor('#ffffff')
       .text(invoice.status.toUpperCase(), 355, startY + 150);

    doc.fillColor('#333333'); // Reset color
  }

  private addInvoiceDetails(doc: PDFKit.PDFDocument, invoice: InvoiceWithDetails) {
    const startY = 200;

    // Payment terms and currency
    doc.fontSize(10)
       .text(`Payment Terms: ${invoice.payment_terms || 'Net 30'}`, 50, startY)
       .text(`Currency: ${invoice.currency}`, 50, startY + 15);

    if (invoice.exchange_rate && invoice.exchange_rate !== 1) {
      doc.text(`Exchange Rate: ${invoice.exchange_rate}`, 50, startY + 30);
    }
  }

  private addBillingInfo(doc: PDFKit.PDFDocument, invoice: InvoiceWithDetails) {
    const startY = 250;

    // Bill To section
    doc.fontSize(12)
       .fillColor('#2563eb')
       .text('Bill To:', 50, startY);

    doc.fontSize(10)
       .fillColor('#333333');

    if (invoice.contact) {
      doc.text(`${invoice.contact.firstName} ${invoice.contact.lastName}`, 50, startY + 20);
      
      if (invoice.contact.company) {
        doc.text(invoice.contact.company, 50, startY + 35);
      }
      
      if (invoice.contact.address) {
        doc.text(invoice.contact.address, 50, startY + 50);
      }
      
      if (invoice.contact.city) {
        const addressLine = `${invoice.contact.city}${invoice.contact.state ? ', ' + invoice.contact.state : ''}${invoice.contact.postalCode ? ' ' + invoice.contact.postalCode : ''}`;
        doc.text(addressLine, 50, startY + 65);
      }
      
      if (invoice.contact.country) {
        doc.text(invoice.contact.country, 50, startY + 80);
      }
      
      if (invoice.contact.email) {
        doc.text(invoice.contact.email, 50, startY + 95);
      }
    } else {
      doc.text('Customer information not available', 50, startY + 20);
    }
  }

  private addItemsTable(doc: PDFKit.PDFDocument, invoice: InvoiceWithDetails) {
    const startY = 380;
    const tableTop = startY;
    const itemHeight = 20;

    // Table headers
    doc.fontSize(10)
       .fillColor('#ffffff');

    // Header background
    doc.rect(50, tableTop, 495, 20)
       .fill('#2563eb');

    // Header text
    doc.text('Description', 55, tableTop + 5)
       .text('Qty', 300, tableTop + 5)
       .text('Price', 350, tableTop + 5)
       .text('Tax', 400, tableTop + 5)
       .text('Total', 480, tableTop + 5);

    doc.fillColor('#333333');

    // Table rows
    let currentY = tableTop + 25;
    
    invoice.items.forEach((item, index) => {
      const rowY = currentY + (index * itemHeight);
      
      // Alternate row background
      if (index % 2 === 1) {
        doc.rect(50, rowY - 2, 495, itemHeight)
           .fill('#f8f9fa');
      }

      doc.fontSize(9)
         .fillColor('#333333')
         .text(item.description, 55, rowY + 3, { width: 240 })
         .text(item.quantity.toString(), 300, rowY + 3)
         .text(this.formatCurrency(item.unitPrice, invoice.currency), 350, rowY + 3)
         .text(`${item.taxRate || 0}%`, 400, rowY + 3)
         .text(this.formatCurrency(item.totalAmount, invoice.currency), 480, rowY + 3);
    });

    return currentY + (invoice.items.length * itemHeight) + 10;
  }

  private addTotals(doc: PDFKit.PDFDocument, invoice: InvoiceWithDetails) {
    const startY = 500;

    // Totals section
    const totalsX = 350;
    
    doc.fontSize(10)
       .fillColor('#666666');

    // Subtotal
    doc.text('Subtotal:', totalsX, startY)
       .text(this.formatCurrency(invoice.subtotal, invoice.currency), 450, startY);

    // Tax
    if (invoice.taxAmount && invoice.taxAmount > 0) {
      doc.text(`Tax (${invoice.tax_type || 'Tax'}):`, totalsX, startY + 15)
         .text(this.formatCurrency(invoice.taxAmount, invoice.currency), 450, startY + 15);
    }

    // Discount
    if (invoice.discountAmount && invoice.discountAmount > 0) {
      doc.text('Discount:', totalsX, startY + 30)
         .text(`-${this.formatCurrency(invoice.discountAmount, invoice.currency)}`, 450, startY + 30);
    }

    // Total line
    doc.rect(totalsX, startY + 45, 145, 1)
       .fill('#cccccc');

    // Total amount
    doc.fontSize(12)
       .fillColor('#2563eb')
       .text('Total:', totalsX, startY + 55)
       .text(this.formatCurrency(invoice.totalAmount, invoice.currency), 450, startY + 55);

    // Amount paid and balance due
    if (invoice.amountPaid && invoice.amountPaid > 0) {
      doc.fontSize(10)
         .fillColor('#666666')
         .text('Amount Paid:', totalsX, startY + 75)
         .text(this.formatCurrency(invoice.amountPaid, invoice.currency), 450, startY + 75);

      const balanceDue = invoice.totalAmount - invoice.amountPaid;
      if (balanceDue > 0) {
        doc.fontSize(11)
           .fillColor('#dc2626')
           .text('Balance Due:', totalsX, startY + 90)
           .text(this.formatCurrency(balanceDue, invoice.currency), 450, startY + 90);
      }
    }
  }

  private addPaymentTermsAndNotes(doc: PDFKit.PDFDocument, invoice: InvoiceWithDetails) {
    const startY = 620;

    // Payment instructions
    if (invoice.payment_instructions) {
      doc.fontSize(10)
         .fillColor('#2563eb')
         .text('Payment Instructions:', 50, startY);
         
      doc.fontSize(9)
         .fillColor('#333333')
         .text(invoice.payment_instructions, 50, startY + 15, { width: 495 });
    }

    // Notes
    if (invoice.notes) {
      doc.fontSize(10)
         .fillColor('#2563eb')
         .text('Notes:', 50, startY + 60);
         
      doc.fontSize(9)
         .fillColor('#333333')
         .text(invoice.notes, 50, startY + 75, { width: 495 });
    }

    // Terms and conditions
    if (invoice.terms) {
      doc.fontSize(10)
         .fillColor('#2563eb')
         .text('Terms & Conditions:', 50, startY + 120);
         
      doc.fontSize(9)
         .fillColor('#333333')
         .text(invoice.terms, 50, startY + 135, { width: 495 });
    }
  }

  private addFooter(
    doc: PDFKit.PDFDocument,
    invoice: InvoiceWithDetails,
    options: PDFGenerationOptions
  ) {
    const footerY = 750;

    // Footer line
    doc.rect(50, footerY, 495, 1)
       .fill('#cccccc');

    // Footer text
    const footerText = options.customization?.footerText || 
      'Thank you for your business! Please remit payment by the due date.';

    doc.fontSize(8)
       .fillColor('#666666')
       .text(footerText, 50, footerY + 10, { align: 'center', width: 495 });

    // Page number
    doc.text(`Page 1 of 1`, 50, footerY + 25, { align: 'center', width: 495 });
  }

  private getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
        return '#10b981';
      case 'sent':
        return '#3b82f6';
      case 'overdue':
        return '#ef4444';
      case 'draft':
        return '#6b7280';
      default:
        return '#f59e0b';
    }
  }

  // Method to generate and save PDF
  async generateAndSavePDF(invoiceId: number, options: PDFGenerationOptions = {}): Promise<string> {
    const pdfBuffer = await this.generateInvoicePDF(invoiceId, options);
    
    // In a real implementation, you would save this to cloud storage (AWS S3, etc.)
    // For now, we'll return a URL that the backend can serve
    const pdfUrl = `/api/invoices/${invoiceId}/pdf`;
    
    // Update the invoice to mark PDF as generated
    await storage.updateInvoice(invoiceId, {
      pdf_generated: true,
      pdf_url: pdfUrl,
      updatedAt: new Date().toISOString(),
    });

    return pdfUrl;
  }

  // Method to customize invoice template
  async generateWithTemplate(invoiceId: number, templateId: number): Promise<Buffer> {
    const template = await storage.getInvoiceTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const customization = template.template_data as any;
    return this.generateInvoicePDF(invoiceId, { 
      templateId,
      customization: customization?.customization 
    });
  }
}

export const invoicePDFService = new InvoicePDFService();