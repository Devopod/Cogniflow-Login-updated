#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🚀 Installing required dependencies for enhanced invoice functionality...\n');

const dependencies = [
  'resend@^2.0.0',
  'nodemailer@^6.9.0',
  '@types/nodemailer@^6.4.0'
];

const devDependencies = [
  '@types/node@^20.0.0'
];

try {
  console.log('📦 Installing production dependencies...');
  execSync(`npm install ${dependencies.join(' ')}`, { stdio: 'inherit' });
  
  console.log('\n📦 Installing dev dependencies...');
  execSync(`npm install -D ${devDependencies.join(' ')}`, { stdio: 'inherit' });
  
  console.log('\n✅ All dependencies installed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Update your .env file with proper email configuration:');
  console.log('   - For Resend: Set RESEND_API_KEY (recommended for production)');
  console.log('   - For SMTP: Set SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_PORT');
  console.log('   - Set FROM_EMAIL and COMPANY_EMAIL');
  console.log('   - Set APP_URL to your application URL');
  console.log('\n2. Test the email functionality:');
  console.log('   - Create an invoice');
  console.log('   - Send email (will use mock mode if no email provider configured)');
  console.log('\n3. For production:');
  console.log('   - Get a Resend API key from https://resend.com');
  console.log('   - Or configure SMTP with your email provider');
  
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}