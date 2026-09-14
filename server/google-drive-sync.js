import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const KNOWLEDGE_DIR = path.resolve(process.cwd(), 'QA-Knowledge');
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

  // Fetch and download files recursively from a Google Drive Folder ID
  async syncFolder(folderId, targetSubDir = '') {
    if (!this.driveClient) {
      const authSuccess = this.initAuth();
      if (!authSuccess) {
        throw new Error("Google Drive credentials.json not found. Please upload or configure your Service Account credentials.");
      }
    }

    const currentTargetDir = path.join(KNOWLEDGE_DIR, targetSubDir);
    if (!fs.existsSync(currentTargetDir)) {
      fs.mkdirSync(currentTargetDir, { recursive: true });
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
        // Download file
        const sanitizedFileName = file.name.replace(/[/\\?%*:|"<>]/g, '-');
        const destPath = path.join(currentTargetDir, sanitizedFileName);
        
        console.log(`[GoogleDriveSync] Downloading: ${file.name} -> ${destPath}`);

        if (file.mimeType === 'application/vnd.google-apps.document') {
          // Export Google Doc as plain text
          const exportRes = await this.driveClient.files.export(
            { fileId: file.id, mimeType: 'text/plain' },
            { responseType: 'text' }
          );
          fs.writeFileSync(destPath.replace(/\.gdoc$/, '.txt'), exportRes.data);
        } else {
          // Download PDF, Markdown, or binary media
          const destStream = fs.createWriteStream(destPath);
          const downloadRes = await this.driveClient.files.get(
            { fileId: file.id, alt: 'media' },
            { responseType: 'stream' }
          );

          await new Promise((resolve, reject) => {
            downloadRes.data
              .pipe(destStream)
              .on('finish', resolve)
              .on('error', reject);
          });
        }

        downloadedFiles.push({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          savedPath: destPath
        });
      }
    }

    return downloadedFiles;
  }
}

export const driveSyncService = new GoogleDriveSyncService();
