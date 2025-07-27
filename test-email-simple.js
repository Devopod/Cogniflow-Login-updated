// Simple email test script
// Run this with: node test-email-simple.js

import { Resend } from 'resend';

const resend = new Resend('re_c46D7G1C_CK4L7C1qPxqxLJGwBPfuMdMB');

async function sendTestEmail() {
  try {
    console.log('📧 Sending test email...');
    
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'yashwanthkummagiri@gmail.com',
      subject: 'Test Email from CogniFlow ERP',
      html: `
        <h2>Test Email</h2>
        <p>This is a simple test email to verify email delivery.</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>From:</strong> CogniFlow ERP System</p>
        <hr>
        <p><em>If you received this email, your email configuration is working!</em></p>
      `,
      text: `
        Test Email
        
        This is a simple test email to verify email delivery.
        
        Sent at: ${new Date().toLocaleString()}
        From: CogniFlow ERP System
        
        If you received this email, your email configuration is working!
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.data?.id);
    console.log('Check your email (including spam folder)');
    
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}

sendTestEmail(); 