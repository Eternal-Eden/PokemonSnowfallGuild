/**
 * Loading state management Hook
 * Provides loading state management functionality for React components
 */

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Loading Hook options
 */
export interface LoadingOptions {
  initialLoading?: boolean;
  autoStart?: boolean;
  timeout?: number;
  onStart?: () => void;
  onStop?: () => void;
  onTimeout?: () => void;
}

/**
 * Loading Hook return value
 */
export interface LoadingReturn {
  isLoading: boolean;
  progress: number;
  message: string;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  updateProgress: (progress: number) => void;
  updateMessage: (message: string) => void;
}

/**
 * Loading state management Hook
 */
export function useLoading(options: LoadingOptions = {}): LoadingReturn {
  const [isLoading, setIsLoading] = useState(options.initialLoading || false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const { timeout, onStart, onStop, onTimeout, autoStart } = options;

  // Generate unique ID
  const generateId = useCallback(() => {
    return `loading_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  // Start loading
  const startLoading = useCallback((loadingMessage?: string) => {
    const id = generateId();
    setLoadingId(id);
    setIsLoading(true);
    setProgress(0);
    setMessage(loadingMessage || '');
    
    onStart?.();
    
    // Set timeout
    if (timeout) {
      timeoutRef.current = setTimeout(() => {
        stopLoading();
        onTimeout?.();
      }, timeout);
    }
  }, [generateId, timeout, onStart, onTimeout]);

  // Stop loading
  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setProgress(100);
    setLoadingId(null);
    onStop?.();
  }, [onStop]);

  // Update progress
  const updateProgress = useCallback((newProgress: number) => {
    setProgress(Math.max(0, Math.min(100, newProgress)));
  }, []);

  // Update message
  const updateMessage = useCallback((newMessage: string) => {
    setMessage(newMessage);
  }, []);

  // Listen for loading state changes
  useEffect(() => {
    if (isLoading) {
      console.log('Loading started:', { loadingId, message });
    } else {
      console.log('Loading stopped:', { loadingId });
    }
  }, [isLoading, loadingId, message]);

  // Initialize state
  useEffect(() => {
    if (autoStart) {
      startLoading();
    }
  }, [autoStart, startLoading]);

  // Auto start
  useEffect(() => {
    if (autoStart) {
      startLoading();
    }
  }, [autoStart, startLoading]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    progress,
    message,
    startLoading,
    stopLoading,
    updateProgress,
    updateMessage
  };
}

/**
 * Global Loading state Hook
 */
export function useGlobalLoading() {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');

  const startGlobalLoading = useCallback((message?: string) => {
    setLoadingCount(prev => prev + 1);
    setGlobalLoading(true);
    if (message) {
      setLoadingMessage(message);
    }
  }, []);

  const stopGlobalLoading = useCallback(() => {
    setLoadingCount(prev => {
      const newCount = Math.max(0, prev - 1);
      if (newCount === 0) {
        setGlobalLoading(false);
        setLoadingMessage('');
      }
      return newCount;
    });
  }, []);

  // Initialize state
  useEffect(() => {
    const handleGlobalLoadingStart = (event: CustomEvent) => {
      startGlobalLoading(event.detail?.message);
    };

    const handleGlobalLoadingStop = () => {
      stopGlobalLoading();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('global-loading-start', handleGlobalLoadingStart as EventListener);
      window.addEventListener('global-loading-stop', handleGlobalLoadingStop);

      return () => {
        window.removeEventListener('global-loading-start', handleGlobalLoadingStart as EventListener);
        window.removeEventListener('global-loading-stop', handleGlobalLoadingStop);
      };
    }
  }, [startGlobalLoading, stopGlobalLoading]);

  return {
    isLoading: globalLoading,
    loadingCount,
    message: loadingMessage,
    startLoading: startGlobalLoading,
    stopLoading: stopGlobalLoading
  };
}

/**
 * Async operation Loading Hook
 */
export function useAsyncLoading<T = any>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (
    asyncFunction: () => Promise<T>,
    options: { message?: string; onSuccess?: (data: T) => void; onError?: (error: Error) => void } = {}
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (options.message) {
        console.log('Async operation started:', options.message);
      }

      const result = await asyncFunction();
      setData(result);
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    isLoading,
    error,
    data,
    execute,
    reset
  };
}

/**
 * Button Loading Hook
 */
export function useButtonLoading() {
  const [loadingButtons, setLoadingButtons] = useState<Set<string>>(new Set());

  const setButtonLoading = useCallback((buttonId: string, loading: boolean) => {
    setLoadingButtons(prev => {
      const newSet = new Set(prev);
      if (loading) {
        newSet.add(buttonId);
      } else {
        newSet.delete(buttonId);
      }
      return newSet;
    });
  }, []);

  const isButtonLoading = useCallback((buttonId: string) => {
    return loadingButtons.has(buttonId);
  }, [loadingButtons]);

  const executeWithButtonLoading = useCallback(async (
    buttonId: string,
    asyncFunction: () => Promise<void>
  ) => {
    try {
      setButtonLoading(buttonId, true);
      await asyncFunction();
    } finally {
      setButtonLoading(buttonId, false);
    }
  }, [setButtonLoading]);

  return {
    isButtonLoading,
    setButtonLoading,
    executeWithButtonLoading
  };
}

/**
 * Form Loading Hook
 */
export function useFormLoading() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const submitForm = useCallback(async (
    submitFunction: () => Promise<void>,
    options: {
      onSuccess?: () => void;
      onError?: (error: Error) => void;
      successMessage?: string;
      resetOnSuccess?: boolean;
    } = {}
  ) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      console.log('Form submission started');

      await submitFunction();

      setSubmitSuccess(true);
      
      // Trigger success notification
      if (options.successMessage) {
        console.log('Form submitted successfully:', options.successMessage);
      }

      if (options.onSuccess) {
        options.onSuccess();
      }

      // Reset success state after delay
      if (options.resetOnSuccess !== false) {
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setSubmitError(error.message);
      
      // Trigger error notification
      console.error('Form submission failed:', error.message);

      if (options.onError) {
        options.onError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const resetForm = useCallback(() => {
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    submitForm,
    resetForm
  };
}