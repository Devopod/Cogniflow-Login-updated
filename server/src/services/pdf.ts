import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { Invoice } from '@shared/schema';
import { formatCurrency } from '../utils/formatters';

// Register Handlebars helpers
handlebars.registerHelper('formatDate', function(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

handlebars.registerHelper('formatCurrency', function(amount: number, currency: string = 'USD') {
  return formatCurrency(amount, currency);
});

handlebars.registerHelper('calculateRowTotal', function(quantity: number, unitPrice: number, discount: number = 0, taxRate: number = 0) {
  const subtotal = quantity * unitPrice - discount;
  const tax = subtotal * (taxRate / 100);
  return formatCurrency(subtotal + tax);
});

// Load invoice template
const loadTemplate = () => {
  const templatePath = path.join(__dirname, '../templates/invoice.html');
  try {
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(templateSource);
  } catch (error) {
    console.error('Error loading invoice template:', error);
    // Fallback to a basic template if file not found
    const basicTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice {{invoice.invoice_number}}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
          .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .company-details, .client-details { margin-bottom: 20px; }
          .invoice-meta { margin-bottom: 20px; }
          .invoice-meta-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
          .text-right { text-align: right; }
          .totals { margin-left: auto; width: 300px; }
          .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .totals-row.grand-total { font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
          .notes { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">#{{invoice.invoice_number}}</div>
          </div>
          <div class="company-logo">
            <!-- Logo would go here -->
          </div>
        </div>
        
        <div class="company-details">
          <div class="company-name">Your Company Name</div>
          <div>123 Business Street</div>
          <div>City, State ZIP</div>
          <div>Phone: (123) 456-7890</div>
          <div>Email: accounts@yourcompany.com</div>
        </div>
        
        <div class="client-details">
          <div><strong>Bill To:</strong></div>
          <div>{{contact.company}}</div>
          <div>{{contact.firstName}} {{contact.lastName}}</div>
          <div>{{contact.address}}</div>
          <div>{{contact.city}}, {{contact.state}} {{contact.postalCode}}</div>
          <div>{{contact.email}}</div>
        </div>
        
        <div class="invoice-meta">
          <div class="invoice-meta-row">
            <div><strong>Invoice Date:</strong></div>
            <div>{{formatDate invoice.issue_date}}</div>
          </div>
          <div class="invoice-meta-row">
            <div><strong>Due Date:</strong></div>
            <div>{{formatDate invoice.due_date}}</div>
          </div>
          <div class="invoice-meta-row">
            <div><strong>Status:</strong></div>
            <div>{{invoice.status}}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th class="text-right">Quantity</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Discount</th>
              <th class="text-right">Tax Rate</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {{#each items}}
            <tr>
              <td>{{product.name}}</td>
              <td>{{description}}</td>
              <td class="text-right">{{quantity}}</td>
              <td class="text-right">{{formatCurrency unit_price ../invoice.currency}}</td>
              <td class="text-right">{{formatCurrency discount ../invoice.currency}}</td>
              <td class="text-right">{{tax_rate}}%</td>
              <td class="text-right">{{calculateRowTotal quantity unit_price discount tax_rate}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-row">
            <div>Subtotal:</div>
            <div>{{formatCurrency invoice.subtotal invoice.currency}}</div>
          </div>
          <div class="totals-row">
            <div>Tax:</div>
            <div>{{formatCurrency invoice.tax_amount invoice.currency}}</div>
          </div>
          <div class="totals-row">
            <div>Discount:</div>
            <div>{{formatCurrency invoice.discount_amount invoice.currency}}</div>
          </div>
          <div class="totals-row grand-total">
            <div>Total:</div>
            <div>{{formatCurrency invoice.total_amount invoice.currency}}</div>
          </div>
          <div class="totals-row">
            <div>Amount Paid:</div>
            <div>{{formatCurrency invoice.amount_paid invoice.currency}}</div>
          </div>
          <div class="totals-row grand-total">
            <div>Balance Due:</div>
            <div>{{formatCurrency (subtract invoice.total_amount invoice.amount_paid) invoice.currency}}</div>
          </div>
        </div>
        
        {{#if invoice.notes}}
        <div class="notes">
          <div><strong>Notes:</strong></div>
          <div>{{invoice.notes}}</div>
        </div>
        {{/if}}
        
        {{#if invoice.terms}}
        <div class="notes">
          <div><strong>Terms and Conditions:</strong></div>
          <div>{{invoice.terms}}</div>
        </div>
        {{/if}}
        
        <div class="footer">
          <p>Thank you for your business!</p>
        </div>
      </body>
      </html>
    `;
    return handlebars.compile(basicTemplate);
  }
};

// Generate PDF from invoice data
export async function generateInvoicePdf(invoice: any): Promise<Buffer> {
  try {
    // Prepare data for template
    const templateData = {
      invoice,
      contact: invoice.contact,
      items: invoice.items,
      formatCurrency,
      subtract: (a: number, b: number) => a - b
    };
    
    // Compile template
    const template = loadTemplate();
    const html = template(templateData);
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create page and set content
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    // Close browser
    await browser.close();
    
    return pdf;
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw new Error('Failed to generate invoice PDF');
  }
}

// Create directory for invoice templates if it doesn't exist
export function ensureTemplateDirectoryExists() {
  const templateDir = path.join(__dirname, '../templates');
  if (!fs.existsSync(templateDir)) {
    fs.mkdirSync(templateDir, { recursive: true });
  }
  
  // Create basic template file if it doesn't exist
  const templatePath = path.join(templateDir, 'invoice.html');
  if (!fs.existsSync(templatePath)) {
    const basicTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice {{invoice.invoice_number}}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
          .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .company-details, .client-details { margin-bottom: 20px; }
          .invoice-meta { margin-bottom: 20px; }
          .invoice-meta-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
          .text-right { text-align: right; }
          .totals { margin-left: auto; width: 300px; }
          .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .totals-row.grand-total { font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
          .notes { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">#{{invoice.invoice_number}}</div>
          </div>
          <div class="company-logo">
            <!-- Logo would go here -->
          </div>
        </div>
        
        <div class="company-details">
          <div class="company-name">Your Company Name</div>
          <div>123 Business Street</div>
          <div>City, State ZIP</div>
          <div>Phone: (123) 456-7890</div>
          <div>Email: accounts@yourcompany.com</div>
        </div>
        
        <div class="client-details">
          <div><strong>Bill To:</strong></div>
          <div>{{contact.company}}</div>
          <div>{{contact.firstName}} {{contact.lastName}}</div>
          <div>{{contact.address}}</div>
          <div>{{contact.city}}, {{contact.state}} {{contact.postalCode}}</div>
          <div>{{contact.email}}</div>
        </div>
        
        <div class="invoice-meta">
          <div class="invoice-meta-row">
            <div><strong>Invoice Date:</strong></div>
            <div>{{formatDate invoice.issue_date}}</div>
          </div>
          <div class="invoice-meta-row">
            <div><strong>Due Date:</strong></div>
            <div>{{formatDate invoice.due_date}}</div>
          </div>
          <div class="invoice-meta-row">
            <div><strong>Status:</strong></div>
            <div>{{invoice.status}}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th class="text-right">Quantity</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Discount</th>
              <th class="text-right">Tax Rate</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {{#each items}}
            <tr>
              <td>{{product.name}}</td>
              <td>{{description}}</td>
              <td class="text-right">{{quantity}}</td>
              <td class="text-right">{{formatCurrency unit_price ../invoice.currency}}</td>
              <td class="text-right">{{formatCurrency discount ../invoice.currency}}</td>
              <td class="text-right">{{tax_rate}}%</td>
              <td class="text-right">{{calculateRowTotal quantity unit_price discount tax_rate}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-row">
            <div>Subtotal:</div>
            <div>{{formatCurrency invoice.subtotal invoice.currency}}</div>
          </div>
          <div class="totals-row">
            <div>Tax:</div>
            <div>{{formatCurrency invoice.tax_amount invoice.currency}}</div>
          </div>
          <div class="totals-row">
            <div>Discount:</div>
            <div>{{formatCurrency invoice.discount_amount invoice.currency}}</div>
          </div>
          <div class="totals-row grand-total">
            <div>Total:</div>
            <div>{{formatCurrency invoice.total_amount invoice.currency}}</div>
          </div>
          <div class="totals-row">
            <div>Amount Paid:</div>
            <div>{{formatCurrency invoice.amount_paid invoice.currency}}</div>
          </div>
          <div class="totals-row grand-total">
            <div>Balance Due:</div>
            <div>{{formatCurrency (subtract invoice.total_amount invoice.amount_paid) invoice.currency}}</div>
          </div>
        </div>
        
        {{#if invoice.notes}}
        <div class="notes">
          <div><strong>Notes:</strong></div>
          <div>{{invoice.notes}}</div>
        </div>
        {{/if}}
        
        {{#if invoice.terms}}
        <div class="notes">
          <div><strong>Terms and Conditions:</strong></div>
          <div>{{invoice.terms}}</div>
        </div>
        {{/if}}
        
        <div class="footer">
          <p>Thank you for your business!</p>
        </div>
      </body>
      </html>
    `;
    fs.writeFileSync(templatePath, basicTemplate);
  }
}