import { apiRequest } from './client';

export type ApiDocument = {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  status: string;
  created_at: string;
};

export type ApiListResponse<T> = {
  items: T[];
  limit?: number;
  offset?: number;
};

export async function listDocuments() {
  return apiRequest<ApiListResponse<ApiDocument>>('/api/v1/documents/');
}

export async function uploadDocument(file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiRequest<ApiDocument>('/api/v1/documents/', {
    method: 'POST',
    body: form,
  });
}
