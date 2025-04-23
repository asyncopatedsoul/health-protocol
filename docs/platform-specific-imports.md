# Platform-Specific Imports in Health Protocol App

This document explains how to handle platform-specific imports in a Svelte/Tauri app to support different build targets (web, desktop, mobile).

## Overview

The Health Protocol app uses a platform-specific data store abstraction that loads different implementations based on the current platform:

- **Desktop/Mobile**: Uses SQLite database via Tauri's SQL plugin
- **Web**: Uses localStorage for client-side persistence

## How It Works

1. **Interface Definition**: All data store implementations share the same interface (`DataStore`) defined in `src/data/types.ts`.

2. **Platform Detection**: The app detects the current platform using the `getPlatform()` function in `src/data/store-factory.ts`.

3. **Factory Pattern**: The `getDataStore()` function returns the appropriate data store implementation for the current platform.

4. **Usage**: The models layer in `src/data/models.svelte.ts` uses the abstracted data store without knowing the specific implementation.

## Extending for Other Platform-Specific Features

You can extend this pattern to other platform-specific features by using Vite's environment variables and dynamic imports.

### Using Vite Environment Variables

Vite provides access to environment variables at build time through the `import.meta.env` object. You can add custom env variables in your `vite.config.js`:

```javascript
// vite.config.js
export default defineConfig(async ({ command, mode }) => ({
  plugins: [sveltekit()],
  
  // Define platform-specific environment variables
  define: {
    'import.meta.env.IS_TAURI': JSON.stringify(!!process.env.TAURI_PLATFORM),
    'import.meta.env.IS_MOBILE': JSON.stringify(
      !!process.env.TAURI_PLATFORM && 
      (process.env.TAURI_PLATFORM === 'android' || process.env.TAURI_PLATFORM === 'ios')
    ),
    'import.meta.env.IS_DESKTOP': JSON.stringify(
      !!process.env.TAURI_PLATFORM && 
      (process.env.TAURI_PLATFORM === 'windows' || 
       process.env.TAURI_PLATFORM === 'macos' || 
       process.env.TAURI_PLATFORM === 'linux')
    ),
    'import.meta.env.IS_WEB': JSON.stringify(!process.env.TAURI_PLATFORM)
  },

  // Other vite config...
}));
```

### Dynamic Imports

You can then use dynamic imports to load platform-specific modules:

```javascript
// Example of platform-specific feature loader
async function loadNotificationSystem() {
  if (import.meta.env.IS_TAURI) {
    // Load Tauri-specific notification implementation
    const { TauriNotifications } = await import('./notifications/tauri-notifications.js');
    return new TauriNotifications();
  } else {
    // Load web-specific notification implementation
    const { WebNotifications } = await import('./notifications/web-notifications.js');
    return new WebNotifications();
  }
}
```

### Using File Name Extensions

Another approach is to use file extensions for platform-specific code:

```
src/
  features/
    auth/
      auth.web.ts      // Web implementation
      auth.desktop.ts  // Desktop implementation
      auth.mobile.ts   // Mobile implementation
      auth.ts          // Common interface and shared code
```

Then configure Vite to alias imports based on the platform:

```javascript
// vite.config.js
export default defineConfig(async ({ command, mode }) => ({
  // ...

  resolve: {
    alias: {
      // Determine platform suffix based on environment
      '@features': process.env.TAURI_PLATFORM 
        ? process.env.TAURI_PLATFORM === 'android' || process.env.TAURI_PLATFORM === 'ios'
          ? path.resolve(__dirname, 'src/features/*/mobile.ts')
          : path.resolve(__dirname, 'src/features/*/desktop.ts')
        : path.resolve(__dirname, 'src/features/*/web.ts')
    }
  }
  
  // ...
}));
```

Then import using:

```javascript
import { auth } from '@features/auth';
// This will import auth.web.ts, auth.desktop.ts, or auth.mobile.ts
// depending on the platform
```

## Current Implementation

Our current data store implementation includes:

1. `src/data/types.ts` - Common interfaces and types
2. `src/data/sqlite-store.ts` - SQLite implementation for desktop/mobile
3. `src/data/web-store.ts` - Web implementation using localStorage
4. `src/data/store-factory.ts` - Factory function to select the right implementation
5. `src/data/models.svelte.ts` - Data models that use the abstracted data store

## Best Practices

1. **Isolation**: Keep platform-specific code isolated and minimized
2. **Common Interfaces**: Always define common interfaces for platform-specific implementations
3. **Feature Detection**: Use feature detection rather than platform detection when possible
4. **Fallbacks**: Provide fallbacks for when features are unavailable
5. **Testing**: Test all implementations on their respective platforms