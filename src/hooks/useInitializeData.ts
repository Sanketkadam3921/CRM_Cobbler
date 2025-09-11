import { useEffect } from 'react';
import { initializeData } from '@/utils/localStorage';

/**
 * Hook to initialize localStorage data on app startup
 * This ensures sample data is loaded only once when the app first runs
 */
export const useInitializeData = () => {
  useEffect(() => {
    // Initialize data on app startup
    initializeData();
  }, []);
};
