# 🧾 Enhanced Invoice Functionality Setup Guide

This guide will help you set up the complete invoice functionality with customer details visibility and production-ready email sending.

## 🚀 Quick Start

### 1. Install Dependencies

Run the installation script:

```bash
node install-dependencies.js
```

Or install manually:

```bash
npm install resend@^2.0.0 nodemailer@^6.9.0 @types/nodemailer@^6.4.0
npm install -D @types/node@^20.0.0
```

### 2. Configure Environment Variables

Update your `.env` file with the following configuration:

```env
# Database
DATABASE_URL=your_actual_database_url

# Node Environment
NODE_ENV=production

# Port
PORT=5000

# Session Secret (change this!)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Email Configuration - Resend (Primary - Recommended)
RESEND_API_KEY=re_your_actual_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
COMPANY_EMAIL=support@yourdomain.com

# Email Configuration - SMTP Fallback
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application URL
APP_URL=https://your-app-domain.com

# OpenAI API Key (for AI features)
OPENAI_API_KEY=your-openai-api-key

# Stripe Keys (for payment features)
STRIPE_SECRET_KEY=sk_your_actual_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_your_actual_stripe_publishable_key
```

### 3. Email Provider Setup Options

#### Option A: Resend (Recommended for Production)

1. Go to [Resend](https://resend.com) and create an account
2. Verify your domain
3. Get your API key
4. Set `RESEND_API_KEY` in your `.env` file
5. Set `FROM_EMAIL` to an email from your verified domain

#### Option B: SMTP (Gmail Example)

1. Enable 2-factor authentication on your Gmail account
2. Generate an app password
3. Set the following in your `.env`:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   ```

#### Option C: Development Mode

Leave email credentials empty - the system will use mock mode and log emails to the console.

## 🔧 Features Implemented

### ✅ Customer Details Visibility

- **Invoice List**: Shows customer name and company for each invoice
- **Invoice Detail**: Complete customer information including:
  - Name and company
  - Email and phone
  - Complete address
  - Automatic customer assignment for invoices without customers

### ✅ Enhanced Email Functionality

- **Multiple Providers**: Resend (primary), SMTP (fallback), Mock (development)
- **Production Ready**: Error handling, retries, and fallback mechanisms
- **Beautiful Templates**: Professional HTML email templates with:
  - Company branding
  - Invoice details
  - Payment links
  - Custom messages
  - Responsive design

### ✅ Advanced Features

- **PDF Attachments**: Automatic invoice PDF generation and attachment
- **Payment Reminders**: Gentle, firm, and final reminder templates
- **Activity Logging**: Track all email activities
- **WebSocket Notifications**: Real-time updates when emails are sent
- **Error Recovery**: Graceful handling of missing customer data

## 🎯 How to Use

### Creating and Sending Invoices

1. **Create Invoice**:
   - Go to Finance > Invoices > New Invoice
   - Select or create a customer
   - Add line items
   - Save as draft

2. **Send Invoice**:
   - Open the invoice detail page
   - Click "Send Email" button
   - Customize the email message if needed
   - Email will be sent with PDF attachment

3. **Track Status**:
   - View real-time status updates
   - Check activity log
   - See email sent confirmation

### Customer Management

- **Auto-Assignment**: Invoices without customers get default customers automatically
- **Complete Profiles**: Full customer information display
- **Email Validation**: Ensures customers have valid email addresses

## 🔍 Testing

### Development Testing

1. Start your application
2. Create a test invoice
3. Send email - will show in console logs:
   ```
   📧 MOCK EMAIL (Development Mode):
     To: customer@example.com
     Subject: Invoice INV-001 from Your Company
     HTML Length: 1234
     Attachments: 1
     ✅ Mock email "sent" successfully
   ```

### Production Testing

1. Configure real email credentials
2. Create a test invoice to your own email
3. Check email delivery and PDF attachment
4. Verify payment links work correctly

## 🐛 Troubleshooting

### Email Not Sending

1. **Check Configuration**:
   ```bash
   # Test email provider status
   curl http://localhost:5000/api/email/status
   ```

2. **Check Logs**:
   - Look for email service initialization messages
   - Check for authentication errors
   - Verify environment variables are loaded

3. **Common Issues**:
   - **Resend**: Domain not verified, invalid API key
   - **SMTP**: Incorrect credentials, 2FA not enabled, app password not used
   - **General**: Missing environment variables, network issues

### Customer Details Not Showing

1. **Check Database**:
   - Verify contacts table has data
   - Check invoice.contact_id is not null
   - Run database migration if needed

2. **Frontend Issues**:
   - Clear browser cache
   - Check network tab for API errors
   - Verify invoice API returns contact data

### PDF Generation Issues

1. **Check Dependencies**: Ensure PDF service is running
2. **Memory Issues**: PDF generation requires sufficient memory
3. **Permissions**: Check file write permissions

## 📊 Monitoring

### Email Status Dashboard

The system provides real-time email status:

- **Provider**: Current email service (Resend/SMTP/Mock)
- **Status**: Connected/Disconnected/Error
- **Statistics**: Emails sent, failed, pending

### Activity Logging

All email activities are logged:

- Email sent/failed events
- PDF generation status
- Customer interactions
- Error details

## 🔄 Migration from Old System

If upgrading from a previous version:

1. **Database**: Run any pending migrations
2. **Environment**: Update `.env` with new email variables
3. **Dependencies**: Install new packages
4. **Testing**: Verify all existing invoices display correctly

## 🛡️ Security Considerations

1. **API Keys**: Store securely, rotate regularly
2. **Email Content**: Sanitize all user input
3. **Customer Data**: Ensure GDPR compliance
4. **Rate Limiting**: Configure email sending limits

## 📞 Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with mock mode first, then production
4. Check the troubleshooting section above

## 🚀 Production Deployment

### Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Email provider tested and working
- [ ] Database migrations run
- [ ] Dependencies installed
- [ ] SSL certificate configured
- [ ] Domain verified (for Resend)

### Performance Optimization

- Configure email rate limiting
- Set up monitoring and alerting
- Enable caching for customer data
- Optimize PDF generation

---

🎉 **You're all set!** Your invoice system now has complete customer visibility and production-ready email functionality.