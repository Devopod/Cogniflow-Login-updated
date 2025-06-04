/**
 * Format a number as currency
 * @param amount The amount to format
 * @param currency The currency code (e.g., 'USD', 'EUR')
 * @param locale The locale to use for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
  if (amount === null || amount === undefined) return '';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date as a string
 * @param date The date to format
 * @param format The format to use (default: 'short')
 * @param locale The locale to use for formatting (default: 'en-US')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null | undefined, format: 'short' | 'medium' | 'long' = 'short', locale: string = 'en-US'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'numeric' : format === 'medium' ? 'short' : 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Format a date and time as a string
 * @param date The date to format
 * @param format The format to use (default: 'short')
 * @param locale The locale to use for formatting (default: 'en-US')
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string | null | undefined, format: 'short' | 'medium' | 'long' = 'short', locale: string = 'en-US'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'numeric' : format === 'medium' ? 'short' : 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };
  
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Format a number with specified decimal places
 * @param value The number to format
 * @param decimals The number of decimal places (default: 2)
 * @param locale The locale to use for formatting (default: 'en-US')
 * @returns Formatted number string
 */
export function formatNumber(value: number | null | undefined, decimals: number = 2, locale: string = 'en-US'): string {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a percentage
 * @param value The value to format as percentage (e.g., 0.25 for 25%)
 * @param decimals The number of decimal places (default: 2)
 * @param locale The locale to use for formatting (default: 'en-US')
 * @returns Formatted percentage string
 */
export function formatPercent(value: number | null | undefined, decimals: number = 2, locale: string = 'en-US'): string {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a file size
 * @param bytes The size in bytes
 * @param decimals The number of decimal places (default: 2)
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number | null | undefined, decimals: number = 2): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format a phone number
 * @param phone The phone number to format
 * @param countryCode The country code (default: 'US')
 * @returns Formatted phone number
 */
export function formatPhone(phone: string | null | undefined, countryCode: string = 'US'): string {
  if (!phone) return '';
  
  // This is a simple implementation - for production, consider using a library like libphonenumber-js
  if (countryCode === 'US') {
    // Format as (XXX) XXX-XXXX
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  // Return as-is if no formatting applied
  return phone;
}

/**
 * Format a payment status with appropriate styling
 * @param status The payment status
 * @returns Object with text and color for the status
 */
export function formatPaymentStatus(status: string | null | undefined): { text: string, color: string } {
  if (!status) return { text: 'Unknown', color: 'gray' };
  
  switch (status.toLowerCase()) {
    case 'paid':
      return { text: 'Paid', color: 'green' };
    case 'unpaid':
      return { text: 'Unpaid', color: 'red' };
    case 'partial payment':
      return { text: 'Partial Payment', color: 'orange' };
    case 'overdue':
      return { text: 'Overdue', color: 'red' };
    case 'refunded':
      return { text: 'Refunded', color: 'purple' };
    case 'void':
      return { text: 'Void', color: 'gray' };
    default:
      return { text: status, color: 'gray' };
  }
}

/**
 * Format a payment method for display
 * @param method The payment method
 * @returns Formatted payment method string
 */
export function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return '';
  
  const methodMap: Record<string, string> = {
    'credit_card': 'Credit Card',
    'debit_card': 'Debit Card',
    'bank_transfer': 'Bank Transfer',
    'cash': 'Cash',
    'check': 'Check',
    'paypal': 'PayPal',
    'stripe': 'Stripe',
    'razorpay': 'Razorpay',
    'mpesa': 'M-PESA',
    'ach': 'ACH',
    'wire': 'Wire Transfer',
  };
  
  return methodMap[method.toLowerCase()] || method;
}

/**
 * Truncate text to a specified length
 * @param text The text to truncate
 * @param length The maximum length (default: 100)
 * @param suffix The suffix to add when truncated (default: '...')
 * @returns Truncated text
 */
export function truncateText(text: string | null | undefined, length: number = 100, suffix: string = '...'): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + suffix;
}

/**
 * Convert a string to title case
 * @param text The text to convert
 * @returns Text in title case
 */
export function toTitleCase(text: string | null | undefined): string {
  if (!text) return '';
  
  return text.replace(
    /\w\S*/g,
    (word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()
  );
}

/**
 * Format a duration in seconds to a human-readable string
 * @param seconds The duration in seconds
 * @returns Formatted duration string (e.g., "2h 30m")
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0) result += `${minutes}m `;
  if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) result += `${remainingSeconds}s`;
  
  return result.trim();
}

/**
 * Format a relative time (e.g., "2 days ago")
 * @param date The date to format
 * @param locale The locale to use for formatting (default: 'en-US')
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date | string | null | undefined, locale: string = 'en-US'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
}