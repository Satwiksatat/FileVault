import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
  getProfile: () => api.get('/api/auth/me'),
  updateProfile: (userData) => api.put('/api/auth/profile', userData),
  changePassword: (passwordData) => api.post('/api/auth/change-password', passwordData),
  logout: () => api.post('/api/auth/logout'),
};

// Files API calls
export const filesAPI = {
  getFiles: (params) => api.get('/api/files', { params }),
  uploadFile: (file, groupId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (groupId) {
      formData.append('group_id', groupId);
    }
    return api.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  downloadFile: (fileId) => api.get(`/api/files/${fileId}/download`, { responseType: 'blob' }),
  deleteFile: (fileId) => api.delete(`/api/files/${fileId}`),
  getFileInfo: (fileId) => api.get(`/api/files/${fileId}`),
};

// Groups API calls
export const groupsAPI = {
  getGroups: () => api.get('/api/groups'),
  createGroup: (groupData) => api.post('/api/groups', groupData),
  updateGroup: (groupId, groupData) => api.put(`/api/groups/${groupId}`, groupData),
  deleteGroup: (groupId) => api.delete(`/api/groups/${groupId}`),
  getGroupMembers: (groupId) => api.get(`/api/groups/${groupId}/members`),
  addMember: (groupId, userId) => api.post(`/api/groups/${groupId}/members`, { user_id: userId }),
  removeMember: (groupId, userId) => api.delete(`/api/groups/${groupId}/members/${userId}`),
};

export default api; 