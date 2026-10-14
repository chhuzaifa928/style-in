'use client';

// Thin client-side fetch helper for admin API calls with consistent error
// handling. All requests are same-origin so the SameSite cookie + origin
// checks on the server authenticate & protect them.

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function apiGet<T>(url: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const json = await res.json();
    if (res.status === 401) {
      window.location.href = '/admin/login';
    }
    return json;
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function apiSend<T>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (res.status === 401) {
      window.location.href = '/admin/login';
    }
    return json;
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function uploadFiles(
  files: FileList | File[],
): Promise<ApiResult<{ files: { url: string; filename: string }[] }>> {
  try {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('files', f));
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const json = await res.json();
    if (res.status === 401) window.location.href = '/admin/login';
    return json;
  } catch {
    return { ok: false, error: 'Upload failed' };
  }
}
