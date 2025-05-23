import axios from 'axios';
import { log } from '../vite';

// Environment config
const environment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
const baseUrl = environment === 'production' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

// Generate authorization header (Base64 encoded)
const getAuthHeader = () => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');
  return `Basic ${auth}`;
};

// Generate access token
export const generateToken = async () => {
  try {
    const response = await axios({
      method: 'get',
      url: `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      headers: {
        Authorization: getAuthHeader(),
      },
    });
    
    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
    };
  } catch (error: any) {
    log(`Error generating MPESA token: ${error.message}`, 'mpesa');
    throw error;
  }
};

// Get timestamp in the format YYYYMMDDHHmmss
const getTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// Generate password (Base64(ShortCode+Passkey+Timestamp))
const generatePassword = (timestamp: string) => {
  const shortCode = process.env.MPESA_SHORTCODE || '';
  const passKey = process.env.MPESA_PASSKEY || '';
  const str = shortCode + passKey + timestamp;
  
  return Buffer.from(str).toString('base64');
};

// STK Push - Prompt the user to enter their MPESA PIN on their phone
export const stkPush = async (
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string = 'Payment'
) => {
  try {
    // Format the phone number (remove leading 0 or +254)
    const formattedPhone = phoneNumber.replace(/^(0|\+254)/, '254');
    const timestamp = getTimestamp();
    
    // Get access token
    const { accessToken } = await generateToken();
    
    // Make the STK Push request
    const response = await axios({
      method: 'post',
      url: `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: generatePassword(timestamp),
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/payments/mpesa/callback`,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc,
      },
    });
    
    return response.data;
  } catch (error: any) {
    log(`Error processing MPESA STK Push: ${error.message}`, 'mpesa');
    throw error;
  }
};

// Check transaction status
export const checkTransactionStatus = async (checkoutRequestId: string) => {
  try {
    const timestamp = getTimestamp();
    
    // Get access token
    const { accessToken } = await generateToken();
    
    const response = await axios({
      method: 'post',
      url: `${baseUrl}/mpesa/stkpushquery/v1/query`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: generatePassword(timestamp),
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
    });
    
    return response.data;
  } catch (error: any) {
    log(`Error checking MPESA transaction status: ${error.message}`, 'mpesa');
    throw error;
  }
};

// B2C Payment - Send money to customer
export const b2cPayment = async (
  phoneNumber: string,
  amount: number,
  occasion: string,
  remarks: string = 'Payment'
) => {
  try {
    // Format the phone number
    const formattedPhone = phoneNumber.replace(/^(0|\+254)/, '254');
    
    // Get access token
    const { accessToken } = await generateToken();
    
    const response = await axios({
      method: 'post',
      url: `${baseUrl}/mpesa/b2c/v1/paymentrequest`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        InitiatorName: process.env.MPESA_INITIATOR_NAME,
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
        CommandID: 'BusinessPayment',
        Amount: amount,
        PartyA: process.env.MPESA_SHORTCODE,
        PartyB: formattedPhone,
        Remarks: remarks,
        QueueTimeOutURL: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/payments/mpesa/timeout`,
        ResultURL: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/payments/mpesa/result`,
        Occasion: occasion,
      },
    });
    
    return response.data;
  } catch (error: any) {
    log(`Error processing MPESA B2C payment: ${error.message}`, 'mpesa');
    throw error;
  }
};

// C2B Register URLs
export const registerUrls = async () => {
  try {
    // Get access token
    const { accessToken } = await generateToken();
    
    const response = await axios({
      method: 'post',
      url: `${baseUrl}/mpesa/c2b/v1/registerurl`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        ShortCode: process.env.MPESA_SHORTCODE,
        ResponseType: 'Completed',
        ConfirmationURL: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/payments/mpesa/confirmation`,
        ValidationURL: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/payments/mpesa/validation`,
      },
    });
    
    return response.data;
  } catch (error: any) {
    log(`Error registering MPESA C2B URLs: ${error.message}`, 'mpesa');
    throw error;
  }
};

// C2B Simulate Transaction (for testing in sandbox)
export const simulateC2B = async (
  phoneNumber: string,
  amount: number,
  billRefNumber: string
) => {
  try {
    // Format the phone number
    const formattedPhone = phoneNumber.replace(/^(0|\+254)/, '254');
    
    // Get access token
    const { accessToken } = await generateToken();
    
    const response = await axios({
      method: 'post',
      url: `${baseUrl}/mpesa/c2b/v1/simulate`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        ShortCode: process.env.MPESA_SHORTCODE,
        CommandID: 'CustomerPayBillOnline',
        Amount: amount,
        Msisdn: formattedPhone,
        BillRefNumber: billRefNumber,
      },
    });
    
    return response.data;
  } catch (error: any) {
    log(`Error simulating MPESA C2B transaction: ${error.message}`, 'mpesa');
    throw error;
  }
};

// Reverse Transaction
export const reverseTransaction = async (
  transactionId: string,
  amount: number,
  remarks: string = 'Reversal'
) => {
  try {
    // Get access token
    const { accessToken } = await generateToken();
    
    const response = await axios({
      method: 'post',
      url: `${baseUrl}/mpesa/reversal/v1/request`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        Initiator: process.env.MPESA_INITIATOR_NAME,
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
        CommandID: 'TransactionReversal',
        TransactionID: transactionId,
        Amount: amount,
        ReceiverParty: process.env.MPESA_SHORTCODE,
        RecieverIdentifierType: '11', // Business shortcode
        ResultURL: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/payments/mpesa/reversal-result`,
        QueueTimeOutURL: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/payments/mpesa/reversal-timeout`,
        Remarks: remarks,
        Occasion: 'Reversal',
      },
    });
    
    return response.data;
  } catch (error: any) {
    log(`Error processing MPESA transaction reversal: ${error.message}`, 'mpesa');
    throw error;
  }
};

export const mpesaUtils = {
  generateToken,
  stkPush,
  checkTransactionStatus,
  b2cPayment,
  registerUrls,
  simulateC2B,
  reverseTransaction,
};