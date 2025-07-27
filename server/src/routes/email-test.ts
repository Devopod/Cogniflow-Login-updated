import { Router } from 'express';
import { getEmailProviderStatus, testEmailConnection } from '../services/email';

const router = Router();

// Test email configuration
router.get('/test', async (req, res) => {
  try {
    const status = getEmailProviderStatus();
    const testResult = await testEmailConnection();
    
    res.json({
      status,
      testResult,
      message: 'Email configuration test completed'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to test email configuration',
      details: error.message
    });
  }
});

// Send test email
router.post('/send-test', async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const { sendEmail } = await import('../services/email');
    
    const result = await sendEmail({
      to,
      subject: subject || 'Test Email from CogniFlow ERP',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from your CogniFlow ERP system.</p>
        <p><strong>Message:</strong> ${message || 'No message provided'}</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p><em>If you received this email, your email configuration is working correctly!</em></p>
      `,
      text: `
        Test Email
        
        This is a test email from your CogniFlow ERP system.
        
        Message: ${message || 'No message provided'}
        Sent at: ${new Date().toLocaleString()}
        
        If you received this email, your email configuration is working correctly!
      `
    });

    res.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      message: result.success ? 'Test email sent successfully' : 'Failed to send test email'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to send test email',
      details: error.message
    });
  }
});

export default router; 