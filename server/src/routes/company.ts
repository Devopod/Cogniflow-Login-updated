import express from 'express';
import { db } from '../../db';
import { companies, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Use the isAuthenticated middleware from the main routes file

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/company');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

// Handle multiple file uploads
const uploadFields = upload.fields([
  { name: 'addressProofDocument', maxCount: 1 },
  { name: 'bankDocument', maxCount: 1 },
  { name: 'signatoryPhoto', maxCount: 1 },
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'partnershipAgreement', maxCount: 1 },
  { name: 'proofOfAppointment', maxCount: 1 },
  { name: 'taxRegistrationCertificate', maxCount: 1 },
  { name: 'logo', maxCount: 1 }
]);

// Check company status
router.get('/status', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Set cache headers (60 seconds)
    res.setHeader('Cache-Control', 'private, max-age=60');
    
    // Get user with company information
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.companyId) {
      return res.json({ hasCompany: false });
    }
    
    // Get company details
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, user.companyId)
    });
    
    if (!company) {
      return res.json({ hasCompany: false });
    }
    
    return res.json({
      hasCompany: true,
      companyId: company.id,
      companyName: company.legalName,
      setupComplete: company.setupComplete
    });
  } catch (error) {
    console.error('Error checking company status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Register a new company
router.post('/register', uploadFields, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Get the uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Parse JSON fields from form data
    const principalBusinessAddress = req.body.principalBusinessAddress ? 
      JSON.parse(req.body.principalBusinessAddress) : null;
    
    const signatoryContact = req.body.signatoryContact ? 
      JSON.parse(req.body.signatoryContact) : null;
    
    // Create company record
    const [company] = await db.insert(companies).values({
      legalName: req.body.legalName,
      businessType: req.body.businessType,
      email: req.body.email,
      phone: req.body.phone,
      industryType: req.body.industryType,
      country: req.body.country,
      taxIdNumber: req.body.taxIdNumber || null,
      taxRegistrationStatus: req.body.taxRegistrationStatus || null,
      principalBusinessAddress: principalBusinessAddress,
      additionalBusinessAddresses: [],
      addressProofType: req.body.addressProofType || null,
      addressProofDocument: files?.addressProofDocument ? files.addressProofDocument[0].filename : null,
      bankName: req.body.bankName || null,
      accountNumber: req.body.accountNumber || null,
      routingCode: req.body.routingCode || null,
      bankAddress: req.body.bankAddress || null,
      bankDocument: files?.bankDocument ? files.bankDocument[0].filename : null,
      signatoryName: req.body.signatoryName || null,
      signatoryDesignation: req.body.signatoryDesignation || null,
      signatoryTaxId: req.body.signatoryTaxId || null,
      signatoryIdentificationNumber: req.body.signatoryIdentificationNumber || null,
      signatoryPhoto: files?.signatoryPhoto ? files.signatoryPhoto[0].filename : null,
      signatoryContact: signatoryContact,
      businessRegistrationNumber: req.body.businessRegistrationNumber || null,
      registrationCertificate: files?.registrationCertificate ? files.registrationCertificate[0].filename : null,
      partnershipAgreement: files?.partnershipAgreement ? files.partnershipAgreement[0].filename : null,
      proofOfAppointment: files?.proofOfAppointment ? files.proofOfAppointment[0].filename : null,
      taxRegistrationCertificate: files?.taxRegistrationCertificate ? files.taxRegistrationCertificate[0].filename : null,
      logo: files?.logo ? files.logo[0].filename : null,
      businessSize: req.body.businessSize || null,
      preferredLanguage: req.body.preferredLanguage || 'English',
      currency: req.body.currency || 'USD',
      timeZone: req.body.timeZone || null,
      setupComplete: true,
    }).returning();
    
    // Update user with company ID
    await db.update(users)
      .set({ companyId: company.id })
      .where(eq(users.id, userId));
    
    return res.status(201).json({
      message: 'Company registered successfully',
      companyId: company.id,
      companyName: company.legalName
    });
  } catch (error) {
    console.error('Error registering company:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;