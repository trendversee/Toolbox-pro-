export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
}

const APP_FOLDER_NAME = 'ToolBox Pro Projects & Backups';

/**
 * Finds or creates the dedicated ToolBox Pro folder in Google Drive
 */
export async function getOrCreateAppFolder(accessToken: string): Promise<string> {
  const query = encodeURIComponent(`name = '${APP_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;

  const res = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to query Google Drive folder');
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: APP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Directory for files and full backups exported from ToolBox Pro',
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Drive folder');
  }

  const createdFolder = await createRes.json();
  return createdFolder.id;
}

/**
 * Uploads a file (text, JSON, Blob, ArrayBuffer) to Google Drive using multipart upload
 */
export async function uploadFileToDrive({
  accessToken,
  name,
  mimeType,
  content,
  folderId,
}: {
  accessToken: string;
  name: string;
  mimeType: string;
  content: string | Blob | ArrayBuffer;
  folderId?: string;
}): Promise<DriveFileItem> {
  const targetFolder = folderId || (await getOrCreateAppFolder(accessToken));

  const metadata = {
    name,
    mimeType,
    parents: targetFolder ? [targetFolder] : undefined,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  let bodyContent: string | Blob;

  if (typeof content === 'string') {
    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to upload file to Google Drive');
    }

    return await res.json();
  } else {
    // Blob or ArrayBuffer
    const blobContent = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' });

    const form = new FormData();
    form.append('metadata', metadataBlob);
    form.append('file', blobContent);

    // Using multipart/related fetch
    const preHeader = delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) + delimiter + `Content-Type: ${mimeType}\r\n\r\n`;
    const preBlob = new Blob([preHeader], { type: 'text/plain' });
    const postBlob = new Blob([closeDelimiter], { type: 'text/plain' });
    const fullBlob = new Blob([preBlob, blobContent, postBlob], { type: `multipart/related; boundary=${boundary}` });

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: fullBlob,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to upload binary file to Google Drive');
    }

    return await res.json();
  }
}

/**
 * Lists files in Google Drive (specifically in the app folder or all created files)
 */
export async function listDriveFiles(accessToken: string, folderId?: string): Promise<DriveFileItem[]> {
  try {
    const targetFolder = folderId || (await getOrCreateAppFolder(accessToken));
    const query = encodeURIComponent(`'${targetFolder}' in parents and trashed = false`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,iconLink,thumbnailLink)&orderBy=modifiedTime desc&pageSize=50`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to list Google Drive files');
    }

    const data = await res.json();
    return data.files || [];
  } catch (error: any) {
    console.error('List Drive Files error:', error);
    throw error;
  }
}

/**
 * Deletes a file from Google Drive (Requires user confirmation prior to calling)
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to delete file from Google Drive');
  }
}

/**
 * Saves a full comprehensive project backup to Google Drive
 */
export async function saveFullProjectBackupToDrive(accessToken: string, customMetadata?: Record<string, any>): Promise<DriveFileItem> {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-');
  const fileName = `ToolBoxPro_Full_Project_Backup_${dateStr}.json`;

  // Collect current localStorage entries for user state and configurations
  const storedItems: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      try {
        storedItems[key] = JSON.parse(localStorage.getItem(key) || 'null');
      } catch {
        storedItems[key] = localStorage.getItem(key);
      }
    }
  }

  const backupPayload = {
    application: 'ToolBox Pro',
    version: '2.0.0',
    backupTimestamp: now.toISOString(),
    exportDateFormatted: now.toLocaleString(),
    deviceInfo: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
    },
    localState: storedItems,
    customData: customMetadata || {},
    toolsSummary: {
      totalSuites: 12,
      cloudSyncEnabled: true,
      backupType: 'Full Project Workspace & Configurations',
    },
  };

  const jsonContent = JSON.stringify(backupPayload, null, 2);

  return await uploadFileToDrive({
    accessToken,
    name: fileName,
    mimeType: 'application/json',
    content: jsonContent,
  });
}
