import { getApiBaseUrl, getToken } from '../lib/auth';

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

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi kết nối API báo cáo rác');
  }
  return data;
}
const processNotification = (apiNotif) => ({
    id: apiNotif.id,
    title: apiNotif.title,
    message: apiNotif.body,
    type: getFrontendType(apiNotif.type),
    relatedReportId: apiNotif.relatedReportId,
    isRead: apiNotif.isRead,
    createdAtUtc: apiNotif.createdAtUtc,
    time: formatTimeAgo(apiNotif.createdAtUtc), // Helper property for UI
});

const getFrontendType = (backendType) => {
    switch (backendType) {
        case 'ReportCreated':
        case 'CollectorAssigned':
            return 'info';
        case 'CollectorAccepted':
        case 'ReportCollected':
            return 'success';
        case 'ReportCancelled':
            return 'warning';
        default:
            return 'info';
    }
};

const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return `${seconds} giây trước`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
};

const notificationApi = {
    getNotifications: async (limit = 50) => {
        const responseData = await apiFetch(`/api/notifications?limit=${limit}`);
        return responseData.map(processNotification);
    },

    getUnreadCount: async () => {
        const responseData = await apiFetch('/api/notifications/unread-count');
        return responseData.count;
    },

    markAsRead: async (id) => {
        const responseData = await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
        return responseData;
    },

    markAllAsRead: async () => {
        const responseData = await apiFetch('/api/notifications/read-all', { method: 'PATCH' });
        return responseData;
    }
};

export default notificationApi;
