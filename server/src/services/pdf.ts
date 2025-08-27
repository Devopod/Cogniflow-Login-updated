import PDFDocument from 'pdfkit';
import { storage } from '../../storage';
import { Invoice, Contact, User } from '@shared/schema';
import { db } from '../../db';
import { invoices, contacts, users, invoiceItems } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export class PDFService {
  // Generate invoice PDF
  async generateInvoicePDF(invoiceId: number): Promise<Buffer> {
    try {
      // Get invoice with contact and user details
      const [invoice] = await db.select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        subtotal: invoices.subtotal,
        taxAmount: invoices.taxAmount,
        discountAmount: invoices.discountAmount,
        totalAmount: invoices.totalAmount,
        amountPaid: invoices.amountPaid,
        status: invoices.status,
        notes: invoices.notes,
        terms: invoices.terms,
        currency: invoices.currency,
        contactId: invoices.contactId,
        userId: invoices.userId,
      }).from(invoices).where(eq(invoices.id, invoiceId));

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Get contact details
      let contact: any = null;
      if (invoice.contactId) {
        const [contactResult] = await db.select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          email: contacts.email,
          phone: contacts.phone,
          company: contacts.company,
          address: contacts.address,
          city: contacts.city,
          state: contacts.state,
          postalCode: contacts.postalCode,
          country: contacts.country,
        }).from(contacts).where(eq(contacts.id, invoice.contactId));
        contact = contactResult;
      }

      // Get user/company details
      const [user] = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        companyId: users.companyId,
      }).from(users).where(eq(users.id, invoice.userId));

      // Get invoice items
      const items = await db.select({
        id: invoiceItems.id,
        description: invoiceItems.description,
        quantity: invoiceItems.quantity,
        unitPrice: invoiceItems.unitPrice,
        taxRate: invoiceItems.taxRate,
        taxAmount: invoiceItems.taxAmount,
        discountRate: invoiceItems.discountRate,
        discountAmount: invoiceItems.discountAmount,
        subtotal: invoiceItems.subtotal,
        totalAmount: invoiceItems.totalAmount,
      }).from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

      // Generate PDF
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {});

      // Header
      this.addHeader(doc, invoice, user, contact);

      // Invoice details
      this.addInvoiceDetails(doc, invoice, contact);

      // Items table
      this.addItemsTable(doc, items, invoice);

      // Totals
      this.addTotals(doc, invoice);

      // Footer
      this.addFooter(doc, invoice);

      doc.end();

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  // Add header to PDF
  private addHeader(doc: PDFKit.PDFDocument, invoice: any, user: any, contact: any) {
    // Company logo and info (placeholder)
    doc.fontSize(24).text('CogniFlow ERP', 50, 50);
    doc.fontSize(12).text('123 Business Street', 50, 80);
    doc.text('City, State 12345', 50, 95);
    doc.text('Phone: (555) 123-4567', 50, 110);
    doc.text('Email: info@cogniflow.com', 50, 125);

    // Invoice title
    doc.fontSize(20).text('INVOICE', 350, 50);

    // Invoice number and date
    doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`, 350, 80);
    doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 350, 95);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 350, 110);

    // Status
    const statusColor = this.getStatusColor(invoice.status || 'draft');
    doc.fillColor(statusColor);
    doc.text(`Status: ${(invoice.status || 'draft').toUpperCase()}`, 350, 125);
    doc.fillColor('black');
  }

  // Add invoice details
  private addInvoiceDetails(doc: PDFKit.PDFDocument, invoice: any, contact: any) {
    const startY = 180;

    // Bill to section
    doc.fontSize(14).text('Bill To:', 50, startY);
    if (contact) {
      doc.fontSize(12).text(`${contact.firstName} ${contact.lastName}`, 50, startY + 20);
      if (contact.company) {
        doc.text(contact.company, 50, startY + 35);
      }
      if (contact.address) {
        doc.text(contact.address, 50, startY + 50);
        if (contact.city && contact.state) {
          doc.text(`${contact.city}, ${contact.state} ${contact.postalCode || ''}`, 50, startY + 65);
        }
        if (contact.country) {
          doc.text(contact.country, 50, startY + 80);
        }
      }
      if (contact.email) {
        doc.text(`Email: ${contact.email}`, 50, startY + 95);
      }
      if (contact.phone) {
        doc.text(`Phone: ${contact.phone}`, 50, startY + 110);
      }
    } else {
      doc.fontSize(12).text('No contact information', 50, startY + 20);
    }
  }

  // Add items table
  private addItemsTable(doc: PDFKit.PDFDocument, items: any[], invoice: any) {
    const startY = 350;
    const tableTop = startY + 20;

    // Table headers
    doc.fontSize(10).fillColor('white').rect(50, tableTop, 500, 20).fill();
    doc.fillColor('black').text('Description', 60, tableTop + 5);
    doc.text('Qty', 250, tableTop + 5);
    doc.text('Unit Price', 300, tableTop + 5);
    doc.text('Amount', 400, tableTop + 5);

    // Table rows
    let rowY = tableTop + 25;
    items.forEach((item, index) => {
      if (rowY > 700) {
        doc.addPage();
        rowY = 50;
      }

      doc.fontSize(9).text(item.description || 'No description', 60, rowY);
      doc.text((item.quantity || 0).toString(), 250, rowY);
      doc.text(this.formatCurrency(item.unitPrice || 0, invoice.currency || 'USD'), 300, rowY);
      doc.text(this.formatCurrency(item.totalAmount || 0, invoice.currency || 'USD'), 400, rowY);

      rowY += 20;
    });

    return rowY + 10;
  }

  // Add totals section
  private addTotals(doc: PDFKit.PDFDocument, invoice: any) {
    const startY = 600;

    // Subtotal
    doc.fontSize(12).text('Subtotal:', 350, startY);
    doc.text(this.formatCurrency(invoice.subtotal || 0, invoice.currency || 'USD'), 450, startY);

    // Tax
    if (invoice.taxAmount && invoice.taxAmount > 0) {
      doc.text('Tax:', 350, startY + 15);
      doc.text(this.formatCurrency(invoice.taxAmount, invoice.currency || 'USD'), 450, startY + 15);
    }

    // Discount
    if (invoice.discountAmount && invoice.discountAmount > 0) {
      doc.text('Discount:', 350, startY + 30);
      doc.text(`-${this.formatCurrency(invoice.discountAmount, invoice.currency || 'USD')}`, 450, startY + 30);
    }

    // Total
    doc.fontSize(14).font('Helvetica-Bold').text('Total:', 350, startY + 50);
    doc.text(this.formatCurrency(invoice.totalAmount || 0, invoice.currency || 'USD'), 450, startY + 50);

    // Amount paid
    if (invoice.amountPaid && invoice.amountPaid > 0) {
      doc.fontSize(12).font('Helvetica').text('Amount Paid:', 350, startY + 70);
      doc.text(this.formatCurrency(invoice.amountPaid, invoice.currency || 'USD'), 450, startY + 70);

      // Balance due
      const balanceDue = (invoice.totalAmount || 0) - (invoice.amountPaid || 0);
      if (balanceDue > 0) {
        doc.font('Helvetica-Bold').text('Balance Due:', 350, startY + 90);
        doc.text(this.formatCurrency(balanceDue, invoice.currency || 'USD'), 450, startY + 90);
      }
    }
  }

  // Add footer
  private addFooter(doc: PDFKit.PDFDocument, invoice: any) {
    const startY = 750;

    // Notes
    if (invoice.notes) {
      doc.fontSize(10).text('Notes:', 50, startY);
      doc.fontSize(9).text(invoice.notes, 50, startY + 15, { width: 300 });
    }

    // Terms
    if (invoice.terms) {
      doc.fontSize(10).text('Terms:', 50, startY + 60);
      doc.fontSize(9).text(invoice.terms, 50, startY + 75, { width: 300 });
    }

    // Payment instructions
    doc.fontSize(10).text('Payment Instructions:', 50, startY + 120);
    doc.fontSize(9).text('Please make payment within the due date. Late payments may incur additional charges.', 50, startY + 135, { width: 300 });
  }

  // Get status color
  private getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid':
        return '#28a745';
      case 'overdue':
        return '#dc3545';
      case 'partial':
        return '#ffc107';
      case 'draft':
        return '#6c757d';
      default:
        return '#007bff';
    }
  }

  // Format currency
  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  }
}

export const invoicePDFService = new PDFService();