import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const CREDENTIALS_FILE = path.resolve(process.cwd(), 'credentials.json');

export class GoogleDriveSyncService {
  constructor() {
    this.driveClient = null;
    this.isAuthenticated = false;
  }

  // Initialize Drive client with service account credentials.json
  initAuth(customCredentials = null) {
    let creds = customCredentials;

    if (!creds && fs.existsSync(CREDENTIALS_FILE)) {
      try {
        creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
      } catch (err) {
        console.error("Error reading credentials.json:", err);
      }
    }

    if (creds) {
      try {
        const auth = new google.auth.GoogleAuth({
          credentials: creds,
          scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        this.driveClient = google.drive({ version: 'v3', auth });
        this.isAuthenticated = true;
        console.log("[GoogleDriveSync] Google Drive API client authenticated successfully.");
        return true;
      } catch (err) {
        console.error("[GoogleDriveSync] Auth error:", err);
        this.isAuthenticated = false;
        return false;
      }
    }
    return false;
  }

  // Check if credentials exist
  hasCredentials() {
    return this.isAuthenticated || fs.existsSync(CREDENTIALS_FILE);
  }

  // Get Service Account Client Email
  getAccountEmail() {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      try {
        const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
        return creds.client_email || creds.project_id || null;
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  // Disconnect Drive & clear credentials
  disconnect() {
    this.driveClient = null;
    this.isAuthenticated = false;
    if (fs.existsSync(CREDENTIALS_FILE)) {
      try {
        fs.unlinkSync(CREDENTIALS_FILE);
        console.log("[GoogleDriveSync] credentials.json deleted and Drive disconnected.");
      } catch (err) {
        console.error("Error removing credentials.json:", err);
      }
    }
    return true;
  }

  // Fetch and parse files recursively from a Google Drive Folder ID into memory
  async syncFolder(folderId, targetSubDir = '') {
    if (!this.driveClient) {
      const authSuccess = this.initAuth();
      if (!authSuccess) {
        throw new Error("Google Drive credentials.json not found. Please upload or configure your Service Account credentials.");
      }
    }

    const downloadedFiles = [];

    // List all files and subfolders inside the folder
    const res = await this.driveClient.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size, modifiedTime)',
      pageSize: 100,
    });

    const files = res.data.files || [];

    for (const file of files) {
      // If it's a subfolder, traverse recursively
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        const subFiles = await this.syncFolder(file.id, path.join(targetSubDir, file.name));
        downloadedFiles.push(...subFiles);
      } else {
        console.log(`[GoogleDriveSync] Reading & Parsing: ${file.name}`);
        
        let content = '';

        if (file.mimeType === 'application/vnd.google-apps.document') {
          // Export Google Doc as plain text
          const exportRes = await this.driveClient.files.export(
            { fileId: file.id, mimeType: 'text/plain' },
            { responseType: 'text' }
          );
          content = exportRes.data;
        } else {
          // Download PDF, Markdown, or binary media as arraybuffer
          const downloadRes = await this.driveClient.files.get(
            { fileId: file.id, alt: 'media' },
            { responseType: 'arraybuffer' }
          );
          
          if (file.mimeType === 'application/pdf' || file.name.endsWith('.pdf')) {
            try {
              const pdf = new PDFParse({ data: Buffer.from(downloadRes.data) });
              const result = await pdf.getText();
              content = result.text || '';
            } catch (err) {
              console.error(`[GoogleDriveSync] Failed to parse PDF ${file.name}:`, err);
              content = ''; 
            }
          } else {
            // Treat as text (e.g. markdown or plain text)
            content = Buffer.from(downloadRes.data).toString('utf8');
          }
        }

        downloadedFiles.push({
          id: file.id,
          name: file.name,
          title: file.name.replace(/\.(md|txt|pdf|gdoc)$/, ''),
          category: targetSubDir || 'General QA',
          filename: file.name,
          path: path.join(targetSubDir, file.name),
          content: content,
          mimeType: file.mimeType,
        });
      }
    }

    return downloadedFiles;
  }
}

export const driveSyncService = new GoogleDriveSyncService();
