import { format, parseISO, isValid } from "date-fns";
import { CONSTANTS } from "@/constants";

// Date utilities
export const dateUtils = {
  format: (date: string | Date, formatString: string = CONSTANTS.ui.dateFormats.display): string => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(dateObj)) return 'Invalid Date';
      return format(dateObj, formatString);
    } catch {
      return 'Invalid Date';
    }
  },

  formatDateTime: (date: string | Date): string => {
    return dateUtils.format(date, CONSTANTS.ui.dateFormats.datetime);
  },

  formatTime: (date: string | Date): string => {
    return dateUtils.format(date, CONSTANTS.ui.dateFormats.time);
  },

  isToday: (date: string | Date): boolean => {
    const today = new Date();
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(today, 'yyyy-MM-dd') === format(dateObj, 'yyyy-MM-dd');
  },

  isThisWeek: (date: string | Date): boolean => {
    const today = new Date();
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return dateObj >= weekStart && dateObj <= weekEnd;
  },

  isThisMonth: (date: string | Date): boolean => {
    const today = new Date();
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(today, 'yyyy-MM') === format(dateObj, 'yyyy-MM');
  },

  getRelativeTime: (date: string | Date): string => {
    const now = new Date();
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInMinutes > 0) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  },
};

// Currency utilities
export const currencyUtils = {
  format: (amount: number, currency: string = CONSTANTS.ui.currency.code): string => {
    return new Intl.NumberFormat(CONSTANTS.ui.currency.locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },

  formatCompact: (amount: number): string => {
    return new Intl.NumberFormat(CONSTANTS.ui.currency.locale, {
      style: 'currency',
      currency: CONSTANTS.ui.currency.code,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  },

  parse: (value: string): number => {
    const cleaned = value.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
  },
};

// String utilities
export const stringUtils = {
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  capitalizeWords: (str: string): string => {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  truncate: (str: string, length: number, suffix: string = '...'): string => {
    if (str.length <= length) return str;
    return str.substring(0, length) + suffix;
  },

  slugify: (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  generateId: (): string => {
    return Math.random().toString(36).substr(2, 9);
  },

  formatPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  },
};

// Array utilities
export const arrayUtils = {
  groupBy: <T, K extends keyof any>(array: T[], key: (item: T) => K): Record<K, T[]> => {
    return array.reduce((groups, item) => {
      const group = key(item);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  },

  sortBy: <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  },

  unique: <T>(array: T[]): T[] => {
    return [...new Set(array)];
  },

  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
};

// Object utilities
export const objectUtils = {
  pick: <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  omit: <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  },

  isEmpty: (obj: any): boolean => {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
    return Object.keys(obj).length === 0;
  },

  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (obj instanceof Array) return obj.map(item => objectUtils.deepClone(item)) as any;
    if (typeof obj === 'object') {
      const clonedObj = {} as any;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = objectUtils.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
    return obj;
  },
};

// Validation utilities
export const validationUtils = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone);
  },

  isValidDate: (date: string): boolean => {
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  },

  isStrongPassword: (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },
};

// Storage utilities
export const storageUtils = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch {
      return defaultValue || null;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// File utilities
export const fileUtils = {
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  isValidFileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },

  isValidFileSize: (file: File, maxSize: number): boolean => {
    return file.size <= maxSize;
  },

  getFileExtension: (filename: string): string => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  },
};

// Color utilities
export const colorUtils = {
  getStatusColor: (status: string): string => {
    const statusColors: Record<string, string> = {
      new: 'blue',
      contacted: 'yellow',
      converted: 'green',
      closed: 'gray',
      lost: 'red',
      'in-progress': 'blue',
      'photos-taken': 'purple',
      'awaiting-approval': 'yellow',
      completed: 'green',
      billed: 'orange',
      pending: 'gray',
      assigned: 'blue',
      'picked-up': 'yellow',
      received: 'purple',
      'in-service': 'orange',
    };
    return statusColors[status] || 'gray';
  },

  getContrastColor: (hexColor: string): string => {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
  },
};

// Export all utilities
export const utils = {
  date: dateUtils,
  currency: currencyUtils,
  string: stringUtils,
  array: arrayUtils,
  object: objectUtils,
  validation: validationUtils,
  storage: storageUtils,
  file: fileUtils,
  color: colorUtils,
};
