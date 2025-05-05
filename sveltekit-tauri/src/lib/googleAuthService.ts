import { googleDriveService } from './googleDriveService';
import { browser } from '$app/environment';
import type { Credentials } from './types';

// Configuration
const GOOGLE_CLIENT_ID = '259278640793-40shultnr3ibgg6lf5h8e3m4hpripvg9.apps.googleusercontent.com';
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const REDIRECT_URI = 'http://localhost:5173/auth/google/callback';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const STORAGE_KEY = 'google_auth_credentials';

/**
 * Service for handling Google authentication
 */
export class GoogleAuthService {
  private credentials: Credentials | null = null;

  constructor() {
    // Try to load credentials from session storage
    this.loadCredentials();
  }

  /**
   * Initialize the Google auth flow
   */
  initiateAuthFlow(): void {
    if (!browser) return;

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: `${DRIVE_SCOPE} profile email`,
      access_type: 'offline',
      prompt: 'consent',
    });

    // Redirect to Google's OAuth consent page
    window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
  }

  /**
   * Complete the OAuth flow by exchanging code for tokens
   * 
   * @param code Authorization code from Google callback
   * @returns Credentials if successful
   */
  async handleAuthCallback(code: string): Promise<Credentials> {
    // Exchange authorization code for access and refresh tokens
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();

    // Create credentials object
    const credentials: Credentials = {
      token: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
      tokenType: data.token_type,
      scope: data.scope,
    };

    // Save credentials
    this.credentials = credentials;
    this.saveCredentials(credentials);

    // Update Google Drive service with new credentials
    googleDriveService.setCredentials(credentials);

    return credentials;
  }

  /**
   * Refresh the access token using the refresh token
   * 
   * @returns New credentials if successful
   */
  async refreshTokens(): Promise<Credentials | null> {
    if (!this.credentials?.refreshToken) {
      return null;
    }

    try {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          refresh_token: this.credentials.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const data = await response.json();

      // Create updated credentials
      const newCredentials: Credentials = {
        ...this.credentials,
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
      };

      // Save updated credentials
      this.credentials = newCredentials;
      this.saveCredentials(newCredentials);

      // Update Google Drive service with new credentials
      googleDriveService.setCredentials(newCredentials);

      return newCredentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Get current credentials, refreshing if necessary
   * 
   * @returns Valid credentials or null if not authenticated
   */
  async getCredentials(): Promise<Credentials | null> {
    if (!this.credentials) {
      return null;
    }

    // Check if token is expired and needs refresh
    if (this.credentials.expiresAt < Date.now()) {
      return this.refreshTokens();
    }

    return this.credentials;
  }

  /**
   * Check if user is authenticated with Google
   * 
   * @returns True if authenticated
   */
  isAuthenticated(): boolean {
    return !!this.credentials;
  }

  /**
   * Sign out from Google
   */
  signOut(): void {
    this.credentials = null;
    if (browser) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Save credentials to session storage
   */
  private saveCredentials(credentials: Credentials): void {
    if (browser) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
    }
  }

  /**
   * Load credentials from session storage
   */
  private loadCredentials(): void {
    if (browser) {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          this.credentials = JSON.parse(stored);
          googleDriveService.setCredentials(this.credentials);
        } catch (error) {
          console.error('Error parsing stored credentials:', error);
        }
      }
    }
  }
}

// Create and export a singleton instance
export const googleAuthService = new GoogleAuthService();
