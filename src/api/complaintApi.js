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

/**
 * GET /api/feedback/my
 * Trả về danh sách khiếu nại của công dân đang đăng nhập.
 */
export async function getMyComplaints() {
  const data = await apiFetch('/api/feedback/my');
  return Array.isArray(data) ? data : [];
}

/**
 * GET /api/feedback/{id}
 * Chi tiết một khiếu nại (công dân chỉ xem được đơn của mình).
 */
export async function getComplaintDetail(id) {
  const safe = encodeURIComponent(String(id));
  return apiFetch(`/api/feedback/${safe}`);
}

/**
 * POST /api/feedback/reports/{reportId}
 * multipart/form-data: Reason, Description, EvidenceFiles (0..n)
 */
export async function createComplaintForReport(reportId, { reason, description, evidenceFiles = [] }) {
  const formData = new FormData();
  formData.append('Reason', reason ?? '');
  formData.append('Description', description ?? '');
  (evidenceFiles ?? []).forEach((file) => {
    if (file && file.size > 0) {
      formData.append('EvidenceFiles', file);
    }
  });

  return apiFetch(`/api/feedback/reports/${reportId}`, {
    method: 'POST',
    body: formData,
  });
}

/**
 * PUT /api/feedback/{id}/status
 * Cập nhật trạng thái khiếu nại (Administrator / RecyclingEnterprise).
 * Body JSON: { status, adminNote? } — ví dụ status: "Submitted" | "InReview" | "Resolved" | "Rejected"
 */
export async function updateComplaintStatus(id, { status, adminNote }) {
  const safe = encodeURIComponent(String(id));
  return apiFetch(`/api/feedback/${safe}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, adminNote }),
  });
}

/**
 * GET /api/feedback
 * Lấy danh sách tất cả khiếu nại (Administrator / RecyclingEnterprise).
 */
export async function getAllComplaints(status) {
  const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
  const data = await apiFetch(`/api/feedback${query}`);
  return Array.isArray(data) ? data : [];
}
