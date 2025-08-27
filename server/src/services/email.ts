// Enhanced Email service for production with fallback mechanisms
import nodemailer from 'nodemailer';
import { storage } from '../../storage';
import { Invoice, EmailTemplate, Contact, User, invoices, contacts } from '@shared/schema';
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
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private resendClient: any = null;
  private emailProvider: 'resend' | 'smtp' | 'mock' = 'mock';
  
  constructor() {
    this.initializeEmailProvider();
  }

  private async initializeEmailProvider() {
    try {
      // Try SendGrid via nodemailer transport
      if (process.env.SENDGRID_API_KEY) {
        console.log('🟢 Initializing SendGrid email service...');
        // Use nodemailer with SendGrid transport
        const sgTransport = await import('nodemailer-sendgrid');
        this.transporter = (await import('nodemailer')).default.createTransport(
          sgTransport.default({ apiKey: process.env.SENDGRID_API_KEY }) as any
        );
        await this.transporter.verify();
        this.emailProvider = 'smtp';
        console.log('✅ SendGrid email service initialized');
        return;
      }
      // Try Resend first (preferred for production)
      if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_123456789_placeholder_get_real_key_from_resend_com') {
        console.log('🟢 Initializing Resend email service...');
        const { Resend } = await import('resend');
        this.resendClient = new Resend(process.env.RESEND_API_KEY);
        this.emailProvider = 'resend';
        console.log('✅ Resend email service initialized');
        return;
      }

      // Fallback to SMTP if configured
      if (process.env.SMTP_USER && process.env.SMTP_PASS && 
          process.env.SMTP_USER !== 'your-email@gmail.com' && 
          process.env.SMTP_PASS !== 'your-app-password') {
        console.log('🟡 Initializing SMTP email service...');
        const config: EmailConfig = {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
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
        case 'resend':
          return await this.sendViaResend(options);
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

  // Send via Resend
  private async sendViaResend(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.resendClient) {
        throw new Error('Resend client not initialized');
      }

      const result = await this.resendClient.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@cogniflow.com',
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content.toString('base64'),
        })),
      });

      if ((result as any).error) {
        throw new Error((result as any).error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Resend email error:', error);
      return { success: false, error: 'Failed to send via Resend' };
    }
  }

  // Send via SMTP
  private async sendViaSMTP(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.transporter) {
        throw new Error('SMTP transporter not initialized');
      }

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@cogniflow.com',
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
      const [invoice] = await db.select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        status: invoices.status,
        contactId: invoices.contactId,
      }).from(invoices).where(eq(invoices.id, invoiceId));

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      // Get contact details
      let contact: any = null;
      if (invoice.contactId) {
        const [contactResult] = await db.select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          email: contacts.email,
          company: contacts.company,
        }).from(contacts).where(eq(contacts.id, invoice.contactId || 0));
        contact = contactResult;
      }

      if (!contact || !contact.email) {
        return { success: false, error: 'Contact email not found' };
      }

      // Generate email content
      const content = this.generateInvoiceEmailContent(invoice, contact, emailOptions);

      // Send email
      const result = await this.sendEmail({
        to: contact.email,
        subject: `Invoice ${invoice.invoiceNumber} from ${process.env.COMPANY_NAME || 'CogniFlow'}`,
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

    const invoiceUrl = `${appUrl}/public/invoices/${invoice.payment_portal_token || invoice.id}`;
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