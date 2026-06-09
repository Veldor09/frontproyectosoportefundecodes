import API from './api';

export interface FileUploadResponse {
  url: string;
  name: string;
  size: number;
  mimeType: string;
  message: string;
}

export interface FileInfo {
  name: string;
  size: number;
  created: string;
  modified: string;
}

export async function uploadFile(file: File): Promise<FileUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await API.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error al subir archivo: ${error.message}`);
    } else {
      throw new Error('Error desconocido al subir archivo');
    }
  }
}

export async function deleteFile(url: string): Promise<{ message: string }> {
  try {
    const response = await API.delete('/files/delete', {
      data: { url }
    });
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error al eliminar archivo: ${error.message}`);
    } else {
      throw new Error('Error desconocido al eliminar archivo');
    }
  }
}

export async function getFileInfo(filename: string): Promise<FileInfo> {
  try {
    const response = await API.get(`/files/info/${filename}`);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error al obtener info del archivo: ${error.message}`);
    } else {
      throw new Error('Error desconocido al obtener info del archivo');
    }
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType === 'text/plain') return '📃';
  return '📎';
}