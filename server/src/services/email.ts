// Email service for sending emails
import nodemailer from 'nodemailer';
import { storage } from '../../storage';
import { Invoice, EmailTemplate, Contact, User } from '@shared/schema';
import { invoicePDFService } from './pdf';

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
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor() {
    // Initialize with default SMTP configuration
    // In production, these should come from environment variables
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    this.transporter = nodemailer.createTransport(config);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || options.to,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      });

      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendInvoiceEmail(
    invoiceId: number,
    options: InvoiceEmailOptions = {}
  ): Promise<boolean> {
    try {
      // Get invoice with related data
      const invoice = await storage.getInvoiceWithItems(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const contact = invoice.contactId 
        ? await storage.getContact(invoice.contactId)
        : null;

      const user = await storage.getUser(invoice.userId);

      if (!contact?.email) {
        throw new Error('Customer email not found');
      }

      // Get email template
      let emailTemplate: EmailTemplate | undefined;
      if (options.templateId) {
        emailTemplate = await storage.getEmailTemplate(options.templateId);
      } else {
        emailTemplate = await storage.getEmailTemplateByType(invoice.userId, 'invoice_send');
      }

      // Generate email content
      const emailContent = await this.generateInvoiceEmailContent(
        invoice,
        contact,
        user,
        emailTemplate,
        options.customMessage
      );

      // Prepare attachments
      const attachments = [];
      if (options.includePDF !== false) {
        const pdfBuffer = await invoicePDFService.generateInvoicePDF(invoiceId);
        attachments.push({
          filename: `Invoice_${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        });
      }

      // Send email
      const emailOptions: EmailOptions = {
        to: contact.email,
        cc: options.ccEmails,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        attachments,
      };

      const sent = await this.sendEmail(emailOptions);

      if (sent) {
        // Update invoice as sent
        await storage.updateInvoice(invoiceId, {
          email_sent: true,
          email_sent_date: new Date().toISOString(),
          status: invoice.status === 'draft' ? 'sent' : invoice.status,
          updatedAt: new Date().toISOString(),
        });

        // Log activity
        await storage.createInvoiceActivity({
          invoiceId,
          userId: invoice.userId,
          activity_type: 'sent',
          description: `Invoice ${invoice.invoiceNumber} sent to ${contact.email}`,
          metadata: {
            templateId: options.templateId,
            customMessage: options.customMessage,
            includePDF: options.includePDF !== false,
            recipientEmail: contact.email,
          },
        });
      }

      return sent;
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      return false;
    }
  }

  private async generateInvoiceEmailContent(
    invoice: Invoice,
    contact: Contact,
    user: User | undefined,
    template: EmailTemplate | undefined,
    customMessage?: string
  ): Promise<{ subject: string; html: string; text: string }> {
    // Default values
    const defaultSubject = `Invoice ${invoice.invoiceNumber} from ${user?.firstName} ${user?.lastName}`;
    const customerName = `${contact.firstName} ${contact.lastName}`;
    const companyName = user ? `${user.firstName} ${user.lastName}` : 'Our Company';

    // Template variables for replacement
    const variables = {
      customer_name: customerName,
      customer_first_name: contact.firstName,
      invoice_number: invoice.invoiceNumber,
      invoice_date: new Date(invoice.issueDate).toLocaleDateString(),
      due_date: new Date(invoice.dueDate).toLocaleDateString(),
      total_amount: this.formatCurrency(invoice.totalAmount, invoice.currency),
      currency: invoice.currency,
      company_name: companyName,
      payment_terms: invoice.payment_terms || 'Net 30',
      payment_link: `${process.env.APP_URL}/invoice/${invoice.id}/pay`,
      view_link: `${process.env.APP_URL}/invoice/${invoice.id}/view`,
    };

    let subject = defaultSubject;
    let htmlContent = this.getDefaultInvoiceEmailTemplate();
    let textContent = this.getDefaultInvoiceEmailText();

    // Use custom template if available
    if (template) {
      subject = template.subject;
      htmlContent = template.body;
    }

    // Replace template variables
    subject = this.replaceTemplateVariables(subject, variables);
    htmlContent = this.replaceTemplateVariables(htmlContent, variables);
    textContent = this.replaceTemplateVariables(textContent, variables);

    // Add custom message if provided
    if (customMessage) {
      const customMessageHtml = `
        <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #007bff; border-radius: 4px;">
          <h4 style="margin: 0 0 10px 0; color: #007bff;">Personal Message:</h4>
          <p style="margin: 0; color: #333;">${customMessage}</p>
        </div>
      `;
      htmlContent = htmlContent.replace('{{custom_message}}', customMessageHtml);
      textContent = textContent.replace('{{custom_message}}', `\n\nPersonal Message: ${customMessage}\n\n`);
    } else {
      htmlContent = htmlContent.replace('{{custom_message}}', '');
      textContent = textContent.replace('{{custom_message}}', '');
    }

    return {
      subject,
      html: htmlContent,
      text: textContent,
    };
  }

  private replaceTemplateVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });

    return result;
  }

  private formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  private getDefaultInvoiceEmailTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice {{invoice_number}}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .email-container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 28px;
          }
          .content {
            margin-bottom: 30px;
          }
          .invoice-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .invoice-details table {
            width: 100%;
            border-collapse: collapse;
          }
          .invoice-details td {
            padding: 8px 0;
            border-bottom: 1px solid #dee2e6;
          }
          .invoice-details td:first-child {
            font-weight: bold;
            color: #495057;
          }
          .cta-button {
            display: inline-block;
            background-color: #007bff;
            color: white !important;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 10px 5px;
            text-align: center;
          }
          .cta-button:hover {
            background-color: #0056b3;
          }
          .cta-button.secondary {
            background-color: #6c757d;
          }
          .cta-button.secondary:hover {
            background-color: #545b62;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #28a745;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>Invoice {{invoice_number}}</h1>
            <p>From {{company_name}}</p>
          </div>
          
          <div class="content">
            <p>Dear {{customer_name}},</p>
            
            <p>We hope this email finds you well. Please find attached your invoice for the services/products provided.</p>
            
            {{custom_message}}
            
            <div class="invoice-details">
              <table>
                <tr>
                  <td>Invoice Number:</td>
                  <td>{{invoice_number}}</td>
                </tr>
                <tr>
                  <td>Invoice Date:</td>
                  <td>{{invoice_date}}</td>
                </tr>
                <tr>
                  <td>Due Date:</td>
                  <td>{{due_date}}</td>
                </tr>
                <tr>
                  <td>Payment Terms:</td>
                  <td>{{payment_terms}}</td>
                </tr>
                <tr>
                  <td>Total Amount:</td>
                  <td><span class="amount">{{total_amount}}</span></td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{payment_link}}" class="cta-button">Pay Now</a>
              <a href="{{view_link}}" class="cta-button secondary">View Invoice</a>
            </div>
            
            <p>If you have any questions about this invoice, please don't hesitate to contact us. We appreciate your business and prompt payment.</p>
            
            <p>Best regards,<br>{{company_name}}</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
            <p>If you need assistance, please contact us through our regular channels.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getDefaultInvoiceEmailText(): string {
    return `
      Invoice {{invoice_number}} from {{company_name}}
      
      Dear {{customer_name}},
      
      We hope this email finds you well. Please find attached your invoice for the services/products provided.
      
      {{custom_message}}
      
      Invoice Details:
      - Invoice Number: {{invoice_number}}
      - Invoice Date: {{invoice_date}}
      - Due Date: {{due_date}}
      - Payment Terms: {{payment_terms}}
      - Total Amount: {{total_amount}}
      
      You can pay online at: {{payment_link}}
      View your invoice at: {{view_link}}
      
      If you have any questions about this invoice, please don't hesitate to contact us. We appreciate your business and prompt payment.
      
      Best regards,
      {{company_name}}
      
      ---
      This is an automated email. Please do not reply directly to this message.
      If you need assistance, please contact us through our regular channels.
    `;
  }

  // Payment reminder emails
  async sendPaymentReminder(invoiceId: number, reminderType: 'gentle' | 'firm' | 'final'): Promise<boolean> {
    try {
      const invoice = await storage.getInvoiceWithItems(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const contact = invoice.contactId 
        ? await storage.getContact(invoice.contactId)
        : null;

      if (!contact?.email) {
        throw new Error('Customer email not found');
      }

      const content = this.generateReminderContent(invoice, contact, reminderType);

      const emailOptions: EmailOptions = {
        to: contact.email,
        subject: content.subject,
        html: content.html,
        text: content.text,
      };

      const sent = await this.sendEmail(emailOptions);

      if (sent) {
        // Log activity
        await storage.createInvoiceActivity({
          invoiceId,
          userId: invoice.userId,
          activity_type: 'reminder_sent',
          description: `${reminderType} payment reminder sent for invoice ${invoice.invoiceNumber}`,
          metadata: {
            reminderType,
            recipientEmail: contact.email,
          },
        });
      }

      return sent;
    } catch (error) {
      console.error('Failed to send payment reminder:', error);
      return false;
    }
  }

  private generateReminderContent(
    invoice: Invoice,
    contact: Contact,
    reminderType: 'gentle' | 'firm' | 'final'
  ): { subject: string; html: string; text: string } {
    const customerName = `${contact.firstName} ${contact.lastName}`;
    const daysOverdue = Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = this.formatCurrency(invoice.totalAmount, invoice.currency);

    const subjects = {
      gentle: `Friendly Reminder: Invoice ${invoice.invoiceNumber} Payment Due`,
      firm: `Payment Overdue: Invoice ${invoice.invoiceNumber} - ${daysOverdue} days past due`,
      final: `FINAL NOTICE: Invoice ${invoice.invoiceNumber} - Immediate Action Required`,
    };

    const messages = {
      gentle: `We wanted to send you a friendly reminder that your invoice payment is now due. We understand that sometimes invoices can be overlooked, so we thought we'd reach out.`,
      firm: `Your invoice payment is now ${daysOverdue} days overdue. Please arrange payment as soon as possible to avoid any service interruptions.`,
      final: `This is your final notice regarding the overdue payment for Invoice ${invoice.invoiceNumber}. Immediate payment is required to avoid further collection actions.`,
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .reminder-${reminderType} { border-left: 4px solid ${reminderType === 'gentle' ? '#ffc107' : reminderType === 'firm' ? '#fd7e14' : '#dc3545'}; padding-left: 15px; }
          .amount { font-size: 20px; font-weight: bold; color: #dc3545; }
          .cta-button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="reminder-${reminderType}">
          <h2>${subjects[reminderType]}</h2>
          <p>Dear ${customerName},</p>
          <p>${messages[reminderType]}</p>
          <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Original Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p><strong>Amount Due:</strong> <span class="amount">${totalAmount}</span></p>
            ${daysOverdue > 0 ? `<p><strong>Days Overdue:</strong> ${daysOverdue}</p>` : ''}
          </div>
          <p style="text-align: center;">
            <a href="${process.env.APP_URL}/invoice/${invoice.id}/pay" class="cta-button">Pay Now</a>
          </p>
          <p>If you have any questions or concerns about this invoice, please don't hesitate to contact us.</p>
          <p>Thank you for your prompt attention to this matter.</p>
          <p>Best regards,<br>Your Accounts Team</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${subjects[reminderType]}
      
      Dear ${customerName},
      
      ${messages[reminderType]}
      
      Invoice Details:
      - Invoice Number: ${invoice.invoiceNumber}
      - Original Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
      - Amount Due: ${totalAmount}
      ${daysOverdue > 0 ? `- Days Overdue: ${daysOverdue}` : ''}
      
      Pay online at: ${process.env.APP_URL}/invoice/${invoice.id}/pay
      
      If you have any questions or concerns about this invoice, please don't hesitate to contact us.
      
      Thank you for your prompt attention to this matter.
      
      Best regards,
      Your Accounts Team
    `;

    return {
      subject: subjects[reminderType],
      html,
      text,
    };
  }

  // Test email configuration
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email configuration is valid');
      return true;
    } catch (error) {
      console.error('Email configuration error:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();

// Export individual methods for convenience
export const sendInvoiceEmail = (invoiceId: number, options?: InvoiceEmailOptions) => 
  emailService.sendInvoiceEmail(invoiceId, options);

export const sendPaymentReminder = (invoiceId: number, reminderType: 'gentle' | 'firm' | 'final') =>
  emailService.sendPaymentReminder(invoiceId, reminderType);