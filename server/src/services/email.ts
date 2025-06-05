// Email service for sending emails
import nodemailer from 'nodemailer';
import { Invoice } from '@shared/schema';

// Create a test account for development
let testAccount: any = null;

// Initialize the transporter
async function getTransporter() {
  if (process.env.NODE_ENV === 'production') {
    // Use real email service in production
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.example.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    });
  } else {
    // Use ethereal.email for development
    if (!testAccount) {
      testAccount = await nodemailer.createTestAccount();
    }
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
}

// Send an email
export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: any[];
}) {
  try {
    const transporter = await getTransporter();
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"CogniFlow ERP" <erp@example.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });
    
    console.log('Message sent: %s', info.messageId);
    
    // Preview URL for development
    if (process.env.NODE_ENV !== 'production' && testAccount) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('📧 EMAIL PREVIEW URL: %s', previewUrl);
      console.log('🔗 Copy this URL to view the email in your browser');
    }
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Send an invoice email
export async function sendInvoiceEmail(options: {
  invoice: Invoice;
  to: string;
  subject: string;
  message: string;
  includeAttachment?: boolean;
}) {
  const { invoice, to, subject, message, includeAttachment = true } = options;
  
  // Generate HTML for the email
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Invoice #${invoice.invoiceNumber}</h2>
      <p>${message}</p>
      <div style="margin: 20px 0; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <p><strong>Amount Due:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(invoice.totalAmount)}</p>
        <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
        <p><strong>Status:</strong> ${invoice.status}</p>
      </div>
      <p>Thank you for your business!</p>
      <p>
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/invoices/view/${invoice.payment_portal_token}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
          View Invoice
        </a>
      </p>
    </div>
  `;
  
  // Prepare attachments if needed
  const attachments = includeAttachment ? [
    // In a real implementation, you would generate a PDF here
    // {
    //   filename: `Invoice-${invoice.invoiceNumber}.pdf`,
    //   content: pdfBuffer,
    //   contentType: 'application/pdf',
    // }
  ] : [];
  
  // Send the email
  return sendEmail({
    to,
    subject,
    text: message,
    html,
    attachments,
  });
}