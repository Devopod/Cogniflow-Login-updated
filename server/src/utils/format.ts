/**
 * Format a number as currency
 * @param amount The amount to format
 * @param currency The currency code (e.g., 'USD', 'EUR')
 * @param locale The locale to use for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
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
export function formatDate(date: Date | string, format: 'short' | 'medium' | 'long' = 'short', locale: string = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'numeric' : format === 'medium' ? 'short' : 'long',
    day: 'numeric',
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
export function formatNumber(value: number, decimals: number = 2, locale: string = 'en-US'): string {
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
export function formatPercent(value: number, decimals: number = 2, locale: string = 'en-US'): string {
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
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
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
export function formatPhone(phone: string, countryCode: string = 'US'): string {
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
 * Truncate text to a specified length
 * @param text The text to truncate
 * @param length The maximum length (default: 100)
 * @param suffix The suffix to add when truncated (default: '...')
 * @returns Truncated text
 */
export function truncateText(text: string, length: number = 100, suffix: string = '...'): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + suffix;
}

/**
 * Convert a string to title case
 * @param text The text to convert
 * @returns Text in title case
 */
export function toTitleCase(text: string): string {
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
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0) result += `${minutes}m `;
  if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) result += `${remainingSeconds}s`;
  
  return result.trim();
}