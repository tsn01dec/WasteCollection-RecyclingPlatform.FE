import { getApiBaseUrl, getToken } from '../lib/auth';

function keysToCamel(obj) {
  if (Array.isArray(obj)) {
    return obj.map((value) => keysToCamel(value));
  }
  if (obj !== null && typeof obj === 'object') {
    const result = {};
    Object.keys(obj).forEach((key) => {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      result[camelKey] = keysToCamel(obj[key]);
    });
    return result;
  }
  return obj;
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const isFormDataBody = options.body instanceof FormData;
  const headers = {
    ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    throw new Error(data?.message || `Lỗi ${response.status}: ${response.statusText}`);
  }

  return keysToCamel(data);
}

export async function getAllWasteReports() {
  const data = await apiFetch('/api/waste-reports/get-all');
  return Array.isArray(data) ? data : [];
}

export async function getWasteReportCategories() {
  const data = await apiFetch('/api/waste-reports/categories');
  return Array.isArray(data) ? data : [];
}

export async function createWasteReport(payload) {
  const formData = new FormData();
  formData.append('title', payload.title ?? '');
  formData.append('description', payload.description ?? '');
  formData.append('locationText', payload.locationText ?? '');
  if (payload.wardId) {
    formData.append('wardId', String(payload.wardId));
  }

  (payload.wasteCategoryIds ?? []).forEach((id, index) => {
    formData.append(`wasteCategoryIds[${index}]`, String(id));
  });
  (payload.estimatedWeightKgs ?? []).forEach((weight, index) => {
    formData.append(`estimatedWeightKgs[${index}]`, String(weight));
  });
  (payload.images ?? []).forEach((file) => {
    formData.append('images', file);
  });

  return apiFetch('/api/waste-reports', {
    method: 'POST',
    body: formData,
  });
}

export async function getMyWasteReports() {
  const data = await apiFetch('/api/waste-reports/my-reports');
  return Array.isArray(data) ? data : [];
}

export async function getWasteReportDetail(id) {
  if (id === undefined || id === null || String(id).trim() === '') {
    throw new Error('Thiếu mã báo cáo.');
  }
  return apiFetch(`/api/waste-reports/${encodeURIComponent(String(id).trim())}/detail-report`);
}

export async function getCollectedWasteReports() {
  const data = await apiFetch('/api/waste-reports/report-collected-status');
  return Array.isArray(data) ? data : [];
}

export async function cancelWasteReport(id, note) {
  if (id === undefined || id === null || String(id).trim() === '') {
    throw new Error('Thiếu mã báo cáo để hủy.');
  }

  return apiFetch(`/api/waste-reports/${encodeURIComponent(String(id).trim())}/cancel`, {
    method: 'POST',
    body: JSON.stringify({
      note: typeof note === 'string' ? note : '',
    }),
  });
}

export async function updateWasteReportStatus(id, status, note = '') {
  if (status === 'Cancelled') {
    return cancelWasteReport(id, note);
  }
  
  return apiFetch(`/api/waste-reports/${encodeURIComponent(String(id).trim())}/advance-status`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export async function assignWasteReportCollector(id, collectorId) {
  return apiFetch(`/api/waste-reports/${encodeURIComponent(String(id).trim())}/assign-collector`, {
    method: 'PATCH',
    body: JSON.stringify({ collectorId }),
  });
}

export async function updateWasteReport(id, payload) {
  if (id === undefined || id === null || String(id).trim() === '') {
    throw new Error('Thiếu mã báo cáo để cập nhật.');
  }

  const formData = new FormData();
  formData.append('title', payload?.title ?? '');
  formData.append('description', payload?.description ?? '');
  formData.append('locationText', payload?.locationText ?? '');
  if (payload?.wardId) {
    formData.append('wardId', String(payload.wardId));
  }

  (payload?.wasteCategoryIds ?? []).forEach((categoryId, index) => {
    formData.append(`wasteCategoryIds[${index}]`, String(categoryId));
  });
  (payload?.estimatedWeightKgs ?? []).forEach((weight, index) => {
    formData.append(`estimatedWeightKgs[${index}]`, String(weight));
  });
  (payload?.images ?? []).forEach((file) => {
    formData.append('images', file);
  });

  return apiFetch(`/api/waste-reports/${encodeURIComponent(String(id).trim())}`, {
    method: 'PUT',
    body: formData,
  });
}
