import type { Credentials } from "./types";

// Google Drive API constants
const API_VERSION = 'v3';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

/**
 * Service for interacting with Google Drive API
 */
export class GoogleDriveService {
  private credentials: Credentials | null = null;

  /**
   * Initialize with credentials
   */
  constructor(credentials?: Credentials) {
    if (credentials) {
      this.credentials = credentials;
    }
  }

  /**
   * Set or update credentials
   */
  setCredentials(credentials: Credentials): void {
    this.credentials = credentials;
  }

  /**
   * Get direct download URL for a Google Drive file
   * For video files that are publicly accessible
   *
   * @param fileId The ID of the file in Google Drive
   * @returns URL that can be used in video player
   */
  async getVideoFileUrl(fileId: string): Promise<string> {
    // For public files, we can use a direct link
    // This works for files that have been shared with "Anyone with the link"
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  /**
   * Get a list of video files from a specific folder
   * 
   * @param folderId Google Drive folder ID
   * @returns Array of files with id, name, and mimeType
   */
  async listVideoFilesInFolder(folderId: string): Promise<any[]> {
    if (!this.credentials) {
      throw new Error('Not authenticated with Google Drive');
    }

    const queryParams = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType contains 'video/' and trashed=false`,
      fields: 'files(id,name,mimeType,webViewLink,webContentLink)',
    });

    const response = await fetch(
      `${DRIVE_API_BASE}/${API_VERSION}/files?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.credentials.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  }

  /**
   * Get the streaming URL for a video file
   * This method works for both public and private files
   * 
   * @param fileId The ID of the file in Google Drive
   * @returns URL that can be used in video player
   */
  async getStreamingUrl(fileId: string): Promise<string> {
    if (!this.credentials) {
      // For public files, fall back to the public URL
      return this.getVideoFileUrl(fileId);
    }

    // For authenticated users, we can get better streaming URLs
    const response = await fetch(
      `${DRIVE_API_BASE}/${API_VERSION}/files/${fileId}?alt=media`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.credentials.token}`,
        },
      }
    );

    if (!response.ok) {
      // If authentication failed, try the public URL
      return this.getVideoFileUrl(fileId);
    }

    // Return the direct streaming URL
    // This URL includes the auth token and will only work for the current session
    return `${DRIVE_API_BASE}/${API_VERSION}/files/${fileId}?alt=media&access_token=${this.credentials.token}`;
  }

  /**
   * Check if a file is publicly accessible
   * 
   * @param fileId The Google Drive file ID
   * @returns True if the file is publicly accessible
   */
  async isFilePublic(fileId: string): Promise<boolean> {
    try {
      const response = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`, {
        method: 'HEAD',
      });
      
      return response.ok && !response.url.includes('confirm=');
    } catch (error) {
      return false;
    }
  }
}

// Create and export a singleton instance
export const googleDriveService = new GoogleDriveService();
