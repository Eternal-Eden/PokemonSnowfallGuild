/**
 * Error handling Hook
 * Provides error handling functionality for React components
 */

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Error handling Hook options
 */
export interface ErrorHandlerOptions {
  onError?: (error: Error) => void;
  autoRecover?: boolean;
  recoverDelay?: number;
  maxRetries?: number;
}

/**
 * Error handling Hook return value
 */
export interface ErrorHandlerReturn {
  errors: Error[];
  hasError: boolean;
  lastError: Error | null;
  handleError: (error: Error) => void;
  clearErrors: () => void;
  clearError: (index: number) => void;
  retryLastError: () => void;
}

/**
 * Error handling Hook
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}): ErrorHandlerReturn {
  const [errors, setErrors] = useState<Error[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Handle error
  const handleError = useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error);

    // Add to local error list
    setErrors(prev => [...prev, error]);

    // Call global error handler
    if (options.onError) {
      options.onError(error);
    }

    // Call custom error handling callback
    // Additional error handling logic can be added here
  }, [options.onError]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
    setRetryCount(0);
  }, []);

  // Clear specific error
  const clearError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Retry last error
  const retryLastError = useCallback(() => {
    if (errors.length > 0) {
      const lastError = errors[errors.length - 1];
      
      // Trigger retry event
      console.log('Retrying last error:', lastError);
      
      // Here you can add specific retry logic
      // For example, re-execute the failed operation
      
      // If retry is successful, clear the error
      // This is just an example, actual implementation depends on specific needs
      setTimeout(() => {
        // Clear the error
        setErrors(prev => prev.slice(0, -1));
        setRetryCount(prev => prev + 1);
      }, 1000);
    }
  }, [errors]);

  // Listen for global error events
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // Only handle errors related to current component
      const error = new Error(event.message);
      
      // Avoid duplicate additions
      setErrors(prev => {
        const isDuplicate = prev.some(e => e.message === error.message);
        if (isDuplicate) {
          return prev;
        }
        return [...prev, error];
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(event.reason?.message || 'Unhandled Promise Rejection');
      handleError(error);
    };

    // Auto recovery
    if (options.autoRecover && errors.length > 0) {
      retryTimeoutRef.current = setTimeout(() => {
        if (retryCount < (options.maxRetries || 3)) {
          retryLastError();
        }
      }, options.recoverDelay || 5000);
    }

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [errors, retryCount, options.autoRecover, options.recoverDelay, options.maxRetries, handleError, retryLastError]);

  return {
    errors,
    hasError: errors.length > 0,
    lastError: errors.length > 0 ? errors[errors.length - 1] : null,
    handleError,
    clearErrors,
    clearError,
    retryLastError
  };
}

/**
 * Standardize error object
 */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  
  if (typeof error === 'string') {
    return new Error(error);
  }
  
  if (error && typeof error === 'object') {
    const obj = error as any;
    if (obj.message) {
      return new Error(obj.message);
    }
    if (obj.error) {
      return normalizeError(obj.error);
    }
  }
  
  return new Error('Unknown error occurred');
}

/**
 * Error classification
 */
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  TIMEOUT = 'timeout',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network connection failed, please check network settings';
  }
  
  if (message.includes('unauthorized') || message.includes('401')) {
    return 'Login expired, please log in again';
  }
  
  if (message.includes('forbidden') || message.includes('403')) {
    return 'No permission to perform this operation';
  }
  
  if (message.includes('not found') || message.includes('404')) {
    return 'Requested resource not found';
  }
  
  if (message.includes('timeout')) {
    return 'Request timeout, please try again later';
  }
  
  if (message.includes('500') || message.includes('server')) {
    return 'Server error, please try again later';
  }
  
  return message || 'Operation failed, please try again later';
}