import dns from 'dns';
import { promisify } from 'util';

// Promisify DNS lookup
const resolveMx = promisify(dns.resolveMx);

// List of common free email providers
export const FREE_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'protonmail.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'live.com',
  'msn.com',
  'me.com',
  'inbox.com',
  'fastmail.com',
  'tutanota.com',
  'mail.ru',
  'proton.me',
  'pm.me'
];

// List of disposable email domains
// This is a small subset - in production, you might want to use a more comprehensive list or a service
export const DISPOSABLE_EMAIL_DOMAINS = [
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
  'guerrillamail.net',
  'sharklasers.com',
  'throwawaymail.com',
  '10minutemail.com',
  'yopmail.com',
  'trashmail.com',
  'mailnesia.com',
  'dispostable.com'
];

// Custom allowlist for specific domains that should be allowed despite being in the blocklist
export const ALLOWED_DOMAINS: string[] = [
  // Add specific domains that should be allowed here
  // Example: 'company-gmail.com'
];

// Custom blocklist for specific domains that should be blocked
export const BLOCKED_DOMAINS: string[] = [
  // Add specific domains that should be blocked here
];

/**
 * Checks if an email domain is a free email provider
 * @param domain The email domain to check
 * @returns True if the domain is a free email provider
 */
export function isFreeEmailDomain(domain: string): boolean {
  return FREE_EMAIL_DOMAINS.includes(domain.toLowerCase());
}

/**
 * Checks if an email domain is a disposable email provider
 * @param domain The email domain to check
 * @returns True if the domain is a disposable email provider
 */
export function isDisposableEmailDomain(domain: string): boolean {
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain.toLowerCase());
}

/**
 * Checks if an email domain is explicitly allowed
 * @param domain The email domain to check
 * @returns True if the domain is in the allowlist
 */
export function isAllowedDomain(domain: string): boolean {
  return ALLOWED_DOMAINS.includes(domain.toLowerCase());
}

/**
 * Checks if an email domain is explicitly blocked
 * @param domain The email domain to check
 * @returns True if the domain is in the blocklist
 */
export function isBlockedDomain(domain: string): boolean {
  return BLOCKED_DOMAINS.includes(domain.toLowerCase());
}

/**
 * Checks if a domain has valid MX records (can receive email)
 * @param domain The domain to check
 * @returns True if the domain has valid MX records
 */
export async function hasMxRecords(domain: string): Promise<boolean> {
  try {
    const records = await resolveMx(domain);
    return records && records.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Validates if an email is a work email
 * @param email The email to validate
 * @returns An object with validation result and message
 */
export async function isWorkEmail(email: string): Promise<{ isValid: boolean; message: string }> {
  if (!email || !email.includes('@')) {
    return { isValid: false, message: 'Invalid email format' };
  }

  const domain = email.split('@')[1].toLowerCase();

  // Check allowlist first
  if (isAllowedDomain(domain)) {
    return { isValid: true, message: 'Email domain is explicitly allowed' };
  }

  // Check blocklist
  if (isBlockedDomain(domain)) {
    return { isValid: false, message: 'Please use a valid work email address' };
  }

  // Check if it's a free email provider
  if (isFreeEmailDomain(domain)) {
    return { isValid: false, message: 'Please use a valid work email address, not a free email provider' };
  }

  // Check if it's a disposable email
  if (isDisposableEmailDomain(domain)) {
    return { isValid: false, message: 'Please use a valid work email address, not a disposable email' };
  }

  // Optional: Check if domain has valid MX records
  // This is more intensive and might slow down registration, so it's optional
  // const hasMx = await hasMxRecords(domain);
  // if (!hasMx) {
  //   return { isValid: false, message: 'Email domain cannot receive emails' };
  // }

  return { isValid: true, message: 'Valid work email' };
}

/**
 * Synchronous version of isWorkEmail that doesn't check MX records
 * @param email The email to validate
 * @returns An object with validation result and message
 */
export function isWorkEmailSync(email: string): { isValid: boolean; message: string } {
  if (!email || !email.includes('@')) {
    return { isValid: false, message: 'Invalid email format' };
  }

  const domain = email.split('@')[1].toLowerCase();

  // Check allowlist first
  if (isAllowedDomain(domain)) {
    return { isValid: true, message: 'Email domain is explicitly allowed' };
  }

  // Check blocklist
  if (isBlockedDomain(domain)) {
    return { isValid: false, message: 'Please use a valid work email address' };
  }

  // Check if it's a free email provider
  if (isFreeEmailDomain(domain)) {
    return { isValid: false, message: 'Please use a valid work email address, not a free email provider' };
  }

  // Check if it's a disposable email
  if (isDisposableEmailDomain(domain)) {
    return { isValid: false, message: 'Please use a valid work email address, not a disposable email' };
  }

  return { isValid: true, message: 'Valid work email' };
}

/**
 * Add a domain to the allowlist
 * @param domain The domain to add to the allowlist
 */
export function addToAllowlist(domain: string): void {
  const normalizedDomain = domain.toLowerCase();
  if (!ALLOWED_DOMAINS.includes(normalizedDomain)) {
    ALLOWED_DOMAINS.push(normalizedDomain);
  }
}

/**
 * Remove a domain from the allowlist
 * @param domain The domain to remove from the allowlist
 */
export function removeFromAllowlist(domain: string): void {
  const normalizedDomain = domain.toLowerCase();
  const index = ALLOWED_DOMAINS.indexOf(normalizedDomain);
  if (index !== -1) {
    ALLOWED_DOMAINS.splice(index, 1);
  }
}

/**
 * Add a domain to the blocklist
 * @param domain The domain to add to the blocklist
 */
export function addToBlocklist(domain: string): void {
  const normalizedDomain = domain.toLowerCase();
  if (!BLOCKED_DOMAINS.includes(normalizedDomain)) {
    BLOCKED_DOMAINS.push(normalizedDomain);
  }
}

/**
 * Remove a domain from the blocklist
 * @param domain The domain to remove from the blocklist
 */
export function removeFromBlocklist(domain: string): void {
  const normalizedDomain = domain.toLowerCase();
  const index = BLOCKED_DOMAINS.indexOf(normalizedDomain);
  if (index !== -1) {
    BLOCKED_DOMAINS.splice(index, 1);
  }
}