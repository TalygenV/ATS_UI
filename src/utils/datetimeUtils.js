/**
 * UTC DateTime Utility Functions for Frontend
 * 
 * This module provides utilities for handling datetime operations in UTC
 * to ensure consistency with the backend API.
 */

/**
 * Formats a UTC datetime string to a localized date string
 * @param {string} dateString - UTC ISO datetime string from API
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return 'N/A';
  
  try {
    // Parse the UTC ISO string - it's already in UTC from the API
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };

    return date.toLocaleDateString('en-US', defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Formats a UTC datetime string to a localized datetime string
 * @param {string} dateString - UTC ISO datetime string from API
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(dateString, options = {}) {
  if (!dateString) return 'N/A';
  
  try {
    // Parse the UTC ISO string - it's already in UTC from the API
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };

    return date.toLocaleString('en-US', defaultOptions);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid Date';
  }
}

/**
 * Formats a UTC datetime string to a localized time string
 * @param {string} dateString - UTC ISO datetime string from API
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted time string
 */
export function formatTime(dateString, options = {}) {
  if (!dateString) return 'N/A';
  
  try {
    // Parse the UTC ISO string - it's already in UTC from the API
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Time';
    }

    const defaultOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };

    return date.toLocaleTimeString('en-US', defaultOptions);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
}

/**
 * Formats a date range from start and end dates
 * @param {string} startDate - UTC ISO datetime string
 * @param {string} endDate - UTC ISO datetime string or 'Present'
 * @returns {string} Formatted date range string
 */
export function formatDateRange(startDate, endDate) {
  if (!startDate) return 'N/A';
  
  try {
    const start = new Date(startDate);
    const end = endDate === 'Present' ? new Date() : new Date(endDate);
    
    if (isNaN(start.getTime()) || (!endDate === 'Present' && isNaN(end.getTime()))) {
      return 'Invalid Date Range';
    }

    const startFormatted = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const endFormatted = endDate === 'Present' 
      ? 'Present' 
      : end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    return `${startFormatted} - ${endFormatted}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return 'Invalid Date Range';
  }
}

/**
 * Converts a local date/time to UTC ISO string for API submission
 * @param {Date|string} date - Date object or date string
 * @returns {string} UTC ISO string
 */
export function toUTCISOString(date) {
  if (!date) return null;
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return null;
    }

    return dateObj.toISOString();
  } catch (error) {
    console.error('Error converting to UTC ISO string:', error);
    return null;
  }
}

/**
 * Creates a UTC date from local date components
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {number} day - Day
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {Date} Date object
 */
export function createUTCDate(year, month, day, hour = 0, minute = 0) {
  try {
    // Create date in UTC
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  } catch (error) {
    console.error('Error creating UTC date:', error);
    return null;
  }
}

/**
 * Gets current UTC datetime as ISO string
 * @returns {string} Current UTC ISO string
 */
export function getCurrentUTCISOString() {
  return new Date().toISOString();
}

/**
 * Checks if a date is in the past (compared to now)
 * @param {string} dateString - UTC ISO datetime string
 * @returns {boolean} True if date is in the past
 */
export function isPastDate(dateString) {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    return date < new Date();
  } catch (error) {
    console.error('Error checking if date is past:', error);
    return false;
  }
}

/**
 * Checks if a date is in the future (compared to now)
 * @param {string} dateString - UTC ISO datetime string
 * @returns {boolean} True if date is in the future
 */
export function isFutureDate(dateString) {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    return date > new Date();
  } catch (error) {
    console.error('Error checking if date is future:', error);
    return false;
  }
}

/**
 * Formats a time slot time (for display in slot lists)
 * @param {string} dateString - UTC ISO datetime string
 * @returns {string} Formatted time string
 */
export function formatSlotTime(dateString) {
  return formatTime(dateString, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

