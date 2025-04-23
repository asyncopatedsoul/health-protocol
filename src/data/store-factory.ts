import { DataStore } from './types';
import { SQLiteStore } from './sqlite-store';
import { WebStore } from './web-store';

let dataStore: DataStore | null = null;

/**
 * Check if we're running in a Tauri environment (desktop or mobile)
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && 
         'Tauri' in window && 
         typeof (window as any).__TAURI__ !== 'undefined';
}

/**
 * Determine the current platform
 */
export function getPlatform(): 'web' | 'desktop' | 'mobile' {
  if (!isTauriEnvironment()) {
    return 'web';
  }
  
  // In a Tauri environment, check for mobile-specific indicators
  // This logic may need to be adjusted based on how Tauri identifies mobile platforms
  // More info: https://tauri.app/v1/guides/features/multiplatform/
  if (
    typeof navigator !== 'undefined' && 
    (navigator.userAgent.includes('Android') || 
     navigator.userAgent.includes('iPhone') || 
     navigator.userAgent.includes('iPad'))
  ) {
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * Create and return the appropriate data store for the current platform
 */
export async function getDataStore(): Promise<DataStore> {
  if (!dataStore) {
    const platform = getPlatform();
    
    console.log(`Initializing data store for platform: ${platform}`);
    
    // Create the appropriate data store implementation based on platform
    switch (platform) {
      case 'web':
        dataStore = new WebStore();
        break;
      case 'desktop':
      case 'mobile':
        dataStore = new SQLiteStore();
        break;
      default:
        // Fallback to WebStore if platform cannot be determined
        console.warn('Unknown platform, using WebStore as fallback');
        dataStore = new WebStore();
    }
    
    // Initialize the data store
    await dataStore.initialize();
  }
  
  return dataStore;
}

/**
 * Reset the data store instance
 * Useful for testing or when you need to reinitialize the store
 */
export function resetDataStore(): void {
  dataStore = null;
}
