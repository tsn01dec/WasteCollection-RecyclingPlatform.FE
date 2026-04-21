import { getApiBaseUrl, getToken } from '../lib/auth';

function keysToCamel(obj) {
  if (Array.isArray(obj)) return obj.map(keysToCamel);
  if (obj !== null && typeof obj === 'object') {
    const result = {};
    Object.keys(obj).forEach(key => {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      result[camelKey] = keysToCamel(obj[key]);
    });
    return result;
  }
  return obj;
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) return null;

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

/** Lấy toàn bộ danh mục rác (bao gồm cả inactive, dành cho Admin) */
export async function getAllWasteCategories() {
  const data = await apiFetch('/api/waste-categories');
  return Array.isArray(data) ? data : [];
}

/** Lấy chi tiết 1 danh mục theo id */
export async function getWasteCategoryById(id) {
  return apiFetch(`/api/waste-categories/${id}`);
}

/** Tạo danh mục mới */
export async function createWasteCategory(payload) {
  return apiFetch('/api/waste-categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Cập nhật tỷ lệ tích điểm cho danh mục
 * @param {number} id - ID danh mục
 * @param {number} pointsPerKg - điểm / kg (FE tính: pointsPer0_1kg * 10)
 */
export async function updateWasteCategoryPoints(id, pointsPerKg) {
  return apiFetch(`/api/waste-categories/${id}/points`, {
    method: 'PATCH',
    body: JSON.stringify({ pointsPerKg }),
  });
}

/** Bật/tắt trạng thái active của danh mục */
export async function toggleWasteCategoryActive(id) {
  return apiFetch(`/api/waste-categories/${id}/toggle-active`, {
    method: 'PATCH',
  });
}
