// Enhanced Email service for production with fallback mechanisms
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
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
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
      console.log('🔶 No email provider configured, using mock mode');
      this.emailProvider = 'mock';
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
      this.emailProvider = 'mock';
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`📧 Sending email via ${this.emailProvider} to: ${options.to}`);
      
      switch (this.emailProvider) {
        case 'resend':
          return await this.sendViaResend(options);
        case 'smtp':
          return await this.sendViaSmtp(options);
        case 'mock':
        default:
          return await this.sendViaMock(options);
      }
    } catch (error: any) {
      console.error('❌ Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  private async sendViaResend(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const emailData: any = {
        from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
        to: [options.to],
        subject: options.subject,
        html: options.html,
      };

      if (options.cc?.length) emailData.cc = options.cc;
      if (options.bcc?.length) emailData.bcc = options.bcc;
      if (options.text) emailData.text = options.text;

      // Handle attachments for Resend
      if (options.attachments?.length) {
        emailData.attachments = options.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
        }));
      }

      const result = await this.resendClient.emails.send(emailData);
      console.log('✅ Resend email sent successfully:', result.data?.id);
      return { success: true, messageId: result.data?.id };
    } catch (error: any) {
      console.error('❌ Resend email failed:', error);
      // Try SMTP fallback if available
      if (this.transporter) {
        console.log('🔄 Trying SMTP fallback...');
        return await this.sendViaSmtp(options);
      }
      return { success: false, error: error.message };
    }
  }

  private async sendViaSmtp(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.transporter) {
        throw new Error('SMTP transporter not initialized');
      }

      const info = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER || options.to,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      });

      console.log('✅ SMTP email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error('❌ SMTP email failed:', error);
      return { success: false, error: error.message };
    }
  }

  private async sendViaMock(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Mock email for development - just log the email details
    console.log('📧 MOCK EMAIL (Development Mode):');
    console.log('  To:', options.to);
    console.log('  Subject:', options.subject);
    console.log('  HTML Length:', options.html.length);
    console.log('  Attachments:', options.attachments?.length || 0);
    console.log('  ✅ Mock email "sent" successfully');
    
    return { success: true, messageId: `mock_${Date.now()}` };
  }

  async sendInvoiceEmail(
    invoiceId: number,
    options: InvoiceEmailOptions = {}
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      console.log(`🚀 Starting invoice email send for invoice ${invoiceId}`);
      
      // Get invoice with related data using direct SQL to avoid ORM issues
      const { db } = await import('../../db');
      const { sql } = await import('drizzle-orm');
      
      // Get invoice data with contact information
      const invoiceResult = await db.execute(sql`
        SELECT 
          i.id, i.user_id, i.contact_id, i.invoice_number, i.issue_date, i.due_date,
          i.subtotal, i.tax_amount, i.discount_amount, i.total_amount, i.currency, 
          i.status, i.notes, i.terms, i.created_at, i.updated_at,
          c.first_name, c.last_name, c.email as contact_email, c.phone, c.company,
          c.address, c.city, c.state, c.postal_code, c.country,
          u.first_name as user_first_name, u.last_name as user_last_name, 
          u.email as user_email, u.company as user_company
        FROM invoices i
        LEFT JOIN contacts c ON i.contact_id = c.id
        LEFT JOIN users u ON i.user_id = u.id
        WHERE i.id = ${invoiceId}
      `);
      
      if (invoiceResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }
      
      const invoiceRow = invoiceResult.rows[0];
      
      // Build invoice object
      const invoice = {
        id: invoiceRow.id,
        userId: invoiceRow.user_id,
        contactId: invoiceRow.contact_id,
        invoiceNumber: invoiceRow.invoice_number,
        issueDate: invoiceRow.issue_date,
        dueDate: invoiceRow.due_date,
        subtotal: invoiceRow.subtotal || 0,
        taxAmount: invoiceRow.tax_amount || 0,
        discountAmount: invoiceRow.discount_amount || 0,
        totalAmount: invoiceRow.total_amount || 0,
        currency: invoiceRow.currency || 'USD',
        status: invoiceRow.status,
        notes: invoiceRow.notes,
        terms: invoiceRow.terms,
        createdAt: invoiceRow.created_at,
        updatedAt: invoiceRow.updated_at,
        payment_terms: 'Net 30',
      };
      
      // Build contact object
      const contact = invoiceRow.contact_email ? {
        id: invoiceRow.contact_id,
        firstName: invoiceRow.first_name,
        lastName: invoiceRow.last_name,
        email: invoiceRow.contact_email,
        phone: invoiceRow.phone,
        company: invoiceRow.company,
        address: invoiceRow.address,
        city: invoiceRow.city,
        state: invoiceRow.state,
        postalCode: invoiceRow.postal_code,
        country: invoiceRow.country,
      } : null;
      
      // Build user object
      const user = {
        id: invoiceRow.user_id,
        firstName: invoiceRow.user_first_name,
        lastName: invoiceRow.user_last_name,
        email: invoiceRow.user_email,
        company: invoiceRow.user_company,
      };

      // Use custom email if provided, otherwise use contact email
      const targetEmail = options.customEmail || contact?.email;
      if (!targetEmail) {
        throw new Error('Customer email not found. Please provide a custom email or ensure the invoice has a customer with an email address.');
      }

      console.log(`📧 Sending invoice to: ${targetEmail} ${options.customEmail ? '(custom)' : '(customer)'}`);

      // Get email template
      let emailTemplate: EmailTemplate | undefined;
      if (options.templateId) {
        emailTemplate = await storage.getEmailTemplate(options.templateId);
      }

      // Generate email content - create fallback contact if needed
      const emailContact = contact || {
        firstName: 'Valued',
        lastName: 'Customer',
        email: targetEmail,
        phone: '',
        company: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      };

      const emailContent = await this.generateInvoiceEmailContent(
        invoice,
        emailContact,
        user,
        emailTemplate,
        options.customMessage
      );

      // Prepare attachments
      const attachments = [];
      if (options.includePDF !== false) {
        try {
          console.log('📄 Generating PDF attachment...');
          const pdfBuffer = await invoicePDFService.generateInvoicePDF(invoiceId);
          attachments.push({
            filename: `Invoice_${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          });
          console.log('✅ PDF generated successfully');
        } catch (pdfError) {
          console.warn('⚠️ PDF generation failed, sending email without attachment:', pdfError);
          // Continue without PDF - better to send email than fail completely
        }
      }

      // Send email
      const emailOptions: EmailOptions = {
        to: targetEmail,
        cc: options.ccEmails,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        attachments,
      };

      const result = await this.sendEmail(emailOptions);

      if (result.success) {
        console.log('✅ Invoice email sent successfully');
        
        // Update invoice as sent using direct SQL
        await db.execute(sql`
          UPDATE invoices 
          SET status = ${invoice.status === 'draft' ? 'sent' : invoice.status}, 
              updated_at = ${new Date()}
          WHERE id = ${invoiceId}
        `);

        // Log activity (simplified to avoid ORM issues)
        try {
          console.log(`📝 Activity logged: Invoice ${invoice.invoiceNumber} sent to ${targetEmail} via ${this.emailProvider}`);
        } catch (activityError) {
          console.warn('⚠️ Failed to log activity:', activityError);
          // Don't fail the whole operation for logging issues
        }

        return { success: true, messageId: result.messageId };
      } else {
        console.error('❌ Invoice email failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('❌ Failed to send invoice email:', error);
      return { success: false, error: error.message };
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
    const defaultSubject = `Invoice ${invoice.invoiceNumber} from ${user?.firstName} ${user?.lastName} | ${user?.company || 'Your Company'}`;
    const customerName = contact.firstName && contact.lastName 
      ? `${contact.firstName} ${contact.lastName}` 
      : contact.company || 'Valued Customer';
    const companyName = user?.company || (user ? `${user.firstName} ${user.lastName}` : 'Your Company');

    // Create payment link
    const baseUrl = process.env.APP_URL || 'https://your-app-domain.com';
    const paymentLink = `${baseUrl}/invoices/view/${invoice.id}`;
    const viewLink = `${baseUrl}/invoices/view/${invoice.id}`;

    // Template variables for replacement
    const variables = {
      customer_name: customerName,
      customer_first_name: contact.firstName || 'Customer',
      invoice_number: invoice.invoiceNumber,
      invoice_date: new Date(invoice.issueDate).toLocaleDateString(),
      due_date: new Date(invoice.dueDate).toLocaleDateString(),
      total_amount: this.formatCurrency(invoice.totalAmount, invoice.currency),
      currency: invoice.currency || 'USD',
      company_name: companyName,
      payment_terms: invoice.payment_terms || 'Net 30',
      payment_link: paymentLink,
      view_link: viewLink,
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
          <p style="margin: 0; color: #333;">${customMessage.replace(/\n/g, '<br>')}</p>
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
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (error) {
      // Fallback for unsupported currencies
      return `${currency} ${amount.toFixed(2)}`;
    }
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
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            background-color: #007bff;
            color: white;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>📄 Invoice {{invoice_number}}</h1>
            <p>From <strong>{{company_name}}</strong></p>
            <span class="status-badge">New Invoice</span>
          </div>
          
          <div class="content">
            <p>Dear <strong>{{customer_name}}</strong>,</p>
            
            <p>We hope this email finds you well! Please find your invoice attached for the services/products provided.</p>
            
            {{custom_message}}
            
            <div class="invoice-details">
              <table>
                <tr>
                  <td>📋 Invoice Number:</td>
                  <td><strong>{{invoice_number}}</strong></td>
                </tr>
                <tr>
                  <td>📅 Invoice Date:</td>
                  <td>{{invoice_date}}</td>
                </tr>
                <tr>
                  <td>⏰ Due Date:</td>
                  <td><strong>{{due_date}}</strong></td>
                </tr>
                <tr>
                  <td>📋 Payment Terms:</td>
                  <td>{{payment_terms}}</td>
                </tr>
                <tr>
                  <td>💰 Total Amount:</td>
                  <td><span class="amount">{{total_amount}}</span></td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{view_link}}" class="cta-button">💳 View & Pay Invoice</a>
              <br><br>
              <a href="{{view_link}}" class="cta-button secondary">👁️ View Invoice Details</a>
            </div>
            
            <p>If you have any questions about this invoice, please don't hesitate to contact us. We appreciate your business and prompt payment!</p>
            
            <p><strong>Thank you for your business!</strong><br>
            <em>{{company_name}} Team</em></p>
          </div>
          
          <div class="footer">
            <p><small>This is an automated email. Please do not reply directly to this message.</small></p>
            <p><small>If you need assistance, please contact us through our regular support channels.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getDefaultInvoiceEmailText(): string {
    return `
      📄 Invoice {{invoice_number}} from {{company_name}}
      
      Dear {{customer_name}},
      
      We hope this email finds you well! Please find your invoice attached for the services/products provided.
      
      {{custom_message}}
      
      📋 Invoice Details:
      • Invoice Number: {{invoice_number}}
      • Invoice Date: {{invoice_date}}
      • Due Date: {{due_date}}
      • Payment Terms: {{payment_terms}}
      • Total Amount: {{total_amount}}
      
      💳 View & Pay your invoice: {{view_link}}
      👁️ View invoice details: {{view_link}}
      
      If you have any questions about this invoice, please don't hesitate to contact us. We appreciate your business and prompt payment!
      
      Thank you for your business!
      {{company_name}} Team
      
      ---
      This is an automated email. Please do not reply directly to this message.
      If you need assistance, please contact us through our regular support channels.
    `;
  }

  // Payment reminder emails
  async sendPaymentReminder(invoiceId: number, reminderType: 'gentle' | 'firm' | 'final'): Promise<boolean> {
    try {
      // Use direct SQL to avoid ORM issues
      const { db } = await import('../../db');
      const { sql } = await import('drizzle-orm');
      
      const invoiceResult = await db.execute(sql`
        SELECT 
          i.id, i.user_id, i.contact_id, i.invoice_number, i.issue_date, i.due_date,
          i.total_amount, i.currency, c.first_name, c.last_name, c.email as contact_email,
          c.company
        FROM invoices i
        LEFT JOIN contacts c ON i.contact_id = c.id
        WHERE i.id = ${invoiceId}
      `);
      
      if (invoiceResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }
      
      const row = invoiceResult.rows[0];
      const invoice = {
        id: row.id,
        userId: row.user_id,
        invoiceNumber: row.invoice_number,
        dueDate: row.due_date,
        totalAmount: row.total_amount,
        currency: row.currency || 'USD',
      };
      
      const contact = row.contact_email ? {
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.contact_email,
        company: row.company,
      } : null;

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

      const result = await this.sendEmail(emailOptions);

      if (result.success) {
        // Log activity (simplified to avoid ORM issues)
        try {
          console.log(`📝 Reminder activity logged: ${reminderType} reminder sent for invoice ${invoice.invoiceNumber} to ${contact.email}`);
        } catch (activityError) {
          console.warn('Failed to log reminder activity:', activityError);
        }
      }

      return result.success;
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
    const customerName = contact.firstName && contact.lastName 
      ? `${contact.firstName} ${contact.lastName}` 
      : contact.company || 'Valued Customer';
    const daysOverdue = Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = this.formatCurrency(invoice.totalAmount, invoice.currency);

    const subjects = {
      gentle: `🔔 Friendly Reminder: Invoice ${invoice.invoiceNumber} Payment Due`,
      firm: `⚠️ Payment Overdue: Invoice ${invoice.invoiceNumber} - ${daysOverdue} days past due`,
      final: `🚨 FINAL NOTICE: Invoice ${invoice.invoiceNumber} - Immediate Action Required`,
    };

    const messages = {
      gentle: `We wanted to send you a friendly reminder that your invoice payment is now due. We understand that sometimes invoices can be overlooked, so we thought we'd reach out.`,
      firm: `Your invoice payment is now ${daysOverdue} days overdue. Please arrange payment as soon as possible to avoid any service interruptions.`,
      final: `This is your final notice regarding the overdue payment for Invoice ${invoice.invoiceNumber}. Immediate payment is required to avoid further collection actions.`,
    };

    const colors = {
      gentle: '#ffc107',
      firm: '#fd7e14', 
      final: '#dc3545'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .reminder-${reminderType} { border-left: 4px solid ${colors[reminderType]}; padding-left: 15px; background-color: #f8f9fa; padding: 20px; border-radius: 4px; }
          .amount { font-size: 20px; font-weight: bold; color: #dc3545; }
          .cta-button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold; }
          .urgent { background-color: ${colors[reminderType]}; }
        </style>
      </head>
      <body>
        <div class="reminder-${reminderType}">
          <h2>${subjects[reminderType]}</h2>
          <p>Dear <strong>${customerName}</strong>,</p>
          <p>${messages[reminderType]}</p>
          <div style="background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; border: 1px solid #dee2e6;">
            <p><strong>📋 Invoice Number:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>📅 Original Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p><strong>💰 Amount Due:</strong> <span class="amount">${totalAmount}</span></p>
            ${daysOverdue > 0 ? `<p><strong>⏰ Days Overdue:</strong> <span style="color: #dc3545; font-weight: bold;">${daysOverdue}</span></p>` : ''}
          </div>
          <div style="text-align: center;">
            <a href="${process.env.APP_URL}/invoices/view/${invoice.id}" class="cta-button ${reminderType === 'final' ? 'urgent' : ''}">
              💳 Pay Now
            </a>
          </div>
          <p>If you have any questions or concerns about this invoice, please don't hesitate to contact us immediately.</p>
          <p><strong>Thank you for your prompt attention to this matter.</strong></p>
          <p>Best regards,<br><em>Accounts Receivable Team</em></p>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${subjects[reminderType]}
      
      Dear ${customerName},
      
      ${messages[reminderType]}
      
      📋 Invoice Details:
      • Invoice Number: ${invoice.invoiceNumber}
      • Original Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
      • Amount Due: ${totalAmount}
      ${daysOverdue > 0 ? `• Days Overdue: ${daysOverdue}` : ''}
      
      💳 Pay online: ${process.env.APP_URL}/invoices/view/${invoice.id}
      
      If you have any questions or concerns about this invoice, please don't hesitate to contact us immediately.
      
      Thank you for your prompt attention to this matter.
      
      Best regards,
      Accounts Receivable Team
    `;

    return {
      subject: subjects[reminderType],
      html,
      text,
    };
  }

  // Test email configuration
  async testConnection(): Promise<{ success: boolean; provider: string; error?: string }> {
    try {
      console.log(`🧪 Testing email connection for provider: ${this.emailProvider}`);
      
      switch (this.emailProvider) {
        case 'resend':
          // Test Resend by attempting to get domains
          if (this.resendClient) {
            await this.resendClient.domains.list();
            return { success: true, provider: 'resend' };
          }
          break;
        case 'smtp':
          if (this.transporter) {
            await this.transporter.verify();
            return { success: true, provider: 'smtp' };
          }
          break;
        case 'mock':
          return { success: true, provider: 'mock (development)' };
      }
      
      return { success: false, provider: this.emailProvider, error: 'Provider not properly initialized' };
    } catch (error: any) {
      console.error('❌ Email connection test failed:', error);
      return { success: false, provider: this.emailProvider, error: error.message };
    }
  }

  // Get current email provider status
  getProviderStatus(): { provider: string; configured: boolean; details: string } {
    switch (this.emailProvider) {
      case 'resend':
        return {
          provider: 'Resend',
          configured: true,
          details: 'Production-ready email service via Resend API'
        };
      case 'smtp':
        return {
          provider: 'SMTP',
          configured: true,
          details: `SMTP service via ${process.env.SMTP_HOST || 'default host'}`
        };
      case 'mock':
      default:
        return {
          provider: 'Mock',
          configured: false,
          details: 'Development mode - emails are logged but not sent. Configure RESEND_API_KEY or SMTP credentials for production.'
        };
    }
  }
}

export const emailService = new EmailService();

// Export individual methods for convenience
export const sendInvoiceEmail = (invoiceId: number, options?: InvoiceEmailOptions) => 
  emailService.sendInvoiceEmail(invoiceId, options);

export const sendPaymentReminder = (invoiceId: number, reminderType: 'gentle' | 'firm' | 'final') =>
  emailService.sendPaymentReminder(invoiceId, reminderType);

export const testEmailConnection = () => emailService.testConnection();
export const getEmailProviderStatus = () => emailService.getProviderStatus();