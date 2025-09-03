// Enhanced Email service for production with fallback mechanisms
import nodemailer from 'nodemailer';
import { storage } from '../../storage';
import { Invoice, EmailTemplate, Contact, User, invoices, contacts, invoice_tokens } from '@shared/schema';
import { invoicePDFService } from './pdf';
import { sql, eq } from 'drizzle-orm';
import { db } from '../../db';
import { and } from 'drizzle-orm';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

interface InvoiceEmailOptions {
  templateId?: number;
  customMessage?: string;
  includePDF?: boolean;
  ccEmails?: string[];
  scheduledSendDate?: Date;
  customEmail?: string;
  subject?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private resendClient: any = null;
  private emailProvider: 'smtp' | 'mock' = 'mock';
  
  constructor() {
    this.initializeEmailProvider();
  }

  private async initializeEmailProvider() {
    try {
      // Force SendGrid via nodemailer transport if API key present
      if (process.env.SENDGRID_API_KEY) {
        console.log('🟢 Initializing SendGrid email service...');
        const sgTransport = await import('nodemailer-sendgrid');
        this.transporter = (await import('nodemailer')).default.createTransport(
          sgTransport.default({ apiKey: process.env.SENDGRID_API_KEY }) as any
        );
        // Force From email to verified sender
        process.env.FROM_EMAIL = process.env.FROM_EMAIL || 'Yashwanth <yashwanth73374@gmail.com>';
        await this.transporter.verify();
        this.emailProvider = 'smtp';
        console.log('✅ SendGrid email service initialized');
        return;
      }

      // Disable Resend usage completely
      this.resendClient = null;

      // Fallback to SMTP if configured
      if (process.env.SMTP_USER && process.env.SMTP_PASS && 
          process.env.SMTP_USER !== 'your-email@gmail.com' && 
          process.env.SMTP_PASS !== 'your-app-password') {
        console.log('🟡 Initializing SMTP email service...');
        const config: EmailConfig = {
          host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!,
          },
        };

        this.transporter = nodemailer.createTransport(config);
        
        // Test the connection
        await this.transporter.verify();
        this.emailProvider = 'smtp';
        console.log('✅ SMTP email service initialized');
        return;
      }

      // Development/mock mode
      console.log('🟡 Using mock email service for development');
      this.emailProvider = 'mock';
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.emailProvider = 'mock';
    }
  }

  // Send email using the configured provider
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      switch (this.emailProvider) {
        case 'smtp':
          return await this.sendViaSMTP(options);
        case 'mock':
        default:
          return await this.sendViaMock(options);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: 'Failed to send email' };
    }
  }

  // Send via SMTP
  private async sendViaSMTP(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.transporter) {
        throw new Error('SMTP transporter not initialized');
      }

      const fromAddress = process.env.FROM_EMAIL || 'Yashwanth <yashwanth73374@gmail.com>';
      const mailOptions = {
        from: fromAddress,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      } as any;

      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('SMTP email error:', error);
      return { success: false, error: 'Failed to send via SMTP' };
    }
  }

  // Send via Mock (development)
  private async sendViaMock(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    console.log('📧 Mock Email Sent:', {
      to: options.to,
      subject: options.subject,
      provider: 'mock',
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }

  // Send invoice email
  async sendInvoiceEmail(
    invoiceId: number,
    userId: number,
    emailOptions?: InvoiceEmailOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get invoice with contact details
      const invoiceFull = await db.query.invoices.findFirst({
        where: eq(invoices.id, invoiceId),
        with: {
          contact: true,
          tokens: true,
        },
      });

      if (!invoiceFull) {
        return { success: false, error: 'Invoice not found' };
      }

      const contact = invoiceFull.contact;
      if (!contact || !contact.email) {
        return { success: false, error: 'Contact email not found' };
      }

      // Ensure a public token exists (30-day default)
      let token = invoiceFull.tokens?.find(t => t.is_active) || null;
      if (!token) {
        [token] = await db.insert(invoice_tokens)
          .values({
            invoice_id: invoiceId,
            created_by: userId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            permissions: { view: true, pay: true, download: true } as any,
          })
          .returning();
      }

      // Generate email content
      const content = this.generateInvoiceEmailContent(invoiceFull as any, contact as any, emailOptions);

      // Send email via configured provider (SendGrid SMTP/Nodemailer)
      const result = await this.sendEmail({
        to: emailOptions?.customEmail || contact.email,
        subject: emailOptions?.subject || `Invoice ${invoiceFull.invoiceNumber} from ${process.env.COMPANY_NAME || 'CogniFlow'}`,
        html: content.html,
        text: content.text,
        attachments: emailOptions?.includePDF ? await this.generateInvoicePDF(invoiceId) : undefined,
      });

      if (result.success) {
        // Update invoice as sent
        await db.update(invoices)
          .set({
            email_sent: true,
            email_sent_date: new Date(),
          })
          .where(eq(invoices.id, invoiceId));
      }

      return result;
    } catch (error) {
      console.error('Error sending invoice email:', error);
      return { success: false, error: 'Failed to send invoice email' };
    }
  }

  // Generate invoice email content
  private generateInvoiceEmailContent(
    invoice: any,
    contact: any,
    options?: InvoiceEmailOptions
  ): { html: string; text: string } {
    const companyName = process.env.COMPANY_NAME || 'CogniFlow';
    const companyEmail = process.env.COMPANY_EMAIL || 'support@cogniflow.com';
    const appUrl = process.env.APP_URL || 'http://localhost:5000';

    // Build public invoice URL using token; if missing, fallback to server route to create one
    const publicToken = invoice.payment_portal_token || (invoice.tokens && invoice.tokens[0]?.token);
    const invoiceUrl = `${appUrl}/public/invoices/${publicToken || invoice.id}`;
    const amount = this.formatCurrency(invoice.totalAmount, invoice.currency || 'USD');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .amount { font-size: 24px; font-weight: bold; color: #28a745; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice ${invoice.invoiceNumber}</h1>
            <p>Dear ${contact.firstName} ${contact.lastName},</p>
            <p>Please find attached your invoice for <span class="amount">${amount}</span></p>
          </div>
          
          <p>${options?.customMessage || 'Thank you for your business. Please review the attached invoice and let us know if you have any questions.'}</p>
          
          <p><a href="${invoiceUrl}" class="button">View Invoice Online</a></p>
          
          <div class="footer">
            <p>If you have any questions, please contact us at ${companyEmail}</p>
            <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Invoice ${invoice.invoiceNumber}
      
      Dear ${contact.firstName} ${contact.lastName},
      
      Please find attached your invoice for ${amount}.
      
      ${options?.customMessage || 'Thank you for your business. Please review the attached invoice and let us know if you have any questions.'}
      
      View invoice online: ${invoiceUrl}
      
      If you have any questions, please contact us at ${companyEmail}
      
      © ${new Date().getFullYear()} ${companyName}. All rights reserved.
    `;

    return { html, text };
  }

  // Generate invoice PDF attachment
  private async generateInvoicePDF(invoiceId: number): Promise<Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }> | undefined> {
    try {
      const pdfBuffer = await invoicePDFService.generateInvoicePDF(invoiceId);
      return [{
        filename: `invoice-${invoiceId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }];
    } catch (error) {
      console.error('Error generating PDF:', error);
      return undefined;
    }
  }

  // Format currency
  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  }

  // Send payment reminder
  async sendPaymentReminder(
    invoiceId: number,
    reminderType: 'due' | 'overdue' | 'thank_you'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const [invoice] = await db.select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        dueDate: invoices.dueDate,
        contactId: invoices.contactId,
      }).from(invoices).where(eq(invoices.id, invoiceId));

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      const [contact] = await db.select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
      }).from(contacts).where(eq(contacts.id, invoice.contactId || 0));

      if (!contact || !contact.email) {
        return { success: false, error: 'Contact email not found' };
      }

      const content = this.generateReminderContent(invoice, contact, reminderType);

      return await this.sendEmail({
        to: contact.email,
        subject: content.subject,
        html: content.html,
        text: content.text,
      });
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      return { success: false, error: 'Failed to send payment reminder' };
    }
  }

  // Generate reminder content
  private generateReminderContent(
    invoice: any,
    contact: any,
    reminderType: 'due' | 'overdue' | 'thank_you'
  ): { subject: string; html: string; text: string } {
    const companyName = process.env.COMPANY_NAME || 'CogniFlow';
    const amount = this.formatCurrency(invoice.totalAmount, invoice.currency || 'USD');
    const dueDate = new Date(invoice.dueDate).toLocaleDateString();

    let subject = '';
    let message = '';

    switch (reminderType) {
      case 'due':
        subject = `Payment Due: Invoice ${invoice.invoiceNumber}`;
        message = `Your payment of ${amount} for invoice ${invoice.invoiceNumber} is due on ${dueDate}.`;
        break;
      case 'overdue':
        subject = `Payment Overdue: Invoice ${invoice.invoiceNumber}`;
        message = `Your payment of ${amount} for invoice ${invoice.invoiceNumber} is overdue. Please make payment as soon as possible.`;
        break;
      case 'thank_you':
        subject = `Thank You: Payment Received for Invoice ${invoice.invoiceNumber}`;
        message = `Thank you for your payment of ${amount} for invoice ${invoice.invoiceNumber}.`;
        break;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .amount { font-size: 24px; font-weight: bold; color: #28a745; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${subject}</h1>
            <p>Dear ${contact.firstName} ${contact.lastName},</p>
            <p>${message}</p>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>${companyName}</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${subject}
      
      Dear ${contact.firstName} ${contact.lastName},
      
      ${message}
      
      If you have any questions, please don't hesitate to contact us.
      
      Best regards,
      ${companyName}
    `;

    return { subject, html, text };
  }
}

export const emailService = new EmailService();

// Lightweight helpers for routes to introspect provider or test connectivity
export function getEmailProviderStatus() {
  return {
    provider: (emailService as any).emailProvider,
    resendConfigured: !!process.env.RESEND_API_KEY,
    smtpConfigured: !!process.env.SMTP_USER && !!process.env.SMTP_PASS,
  };
}

export async function testEmailConnection() {
  try {
    if ((emailService as any).emailProvider === 'smtp' && (emailService as any).transporter) {
      await (emailService as any).transporter.verify();
      return { success: true, provider: 'smtp' };
    }
    if ((emailService as any).emailProvider === 'resend') {
      // No-op: Resend SDK doesn't need verification
      return { success: true, provider: 'resend' };
    }
    return { success: true, provider: 'mock' };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function sendEmail(options: any) {
  return emailService.sendEmail(options);
}