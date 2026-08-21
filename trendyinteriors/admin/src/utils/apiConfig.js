/**
 * Central API Configuration for Admin App
 * All API calls should use this configuration
 */

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://trendyinteriors-1.onrender.com');

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    VERIFY_RESET_OTP: `${API_BASE_URL}/api/auth/verify-reset-otp`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
    SEND_CHANGE_PASSWORD_OTP: `${API_BASE_URL}/api/auth/send-change-password-otp`,
    CHANGE_PASSWORD_WITH_OTP: `${API_BASE_URL}/api/auth/change-password-with-otp`
  },
  CMS: `${API_BASE_URL}/api/cms`,
  PROJECTS: `${API_BASE_URL}/api/projects`,
  TEAM_MEMBERS: `${API_BASE_URL}/api/team-members`,
  SERVICES: `${API_BASE_URL}/api/services`,
  DESIGNS: `${API_BASE_URL}/api/designs`,
  CONTACTS: `${API_BASE_URL}/api/contacts`,
  ROOMS: `${API_BASE_URL}/api/rooms`,
  TESTIMONIALS: `${API_BASE_URL}/api/testimonials`,
  ESTIMATES: `${API_BASE_URL}/api/estimates`,
  MEETINGS: `${API_BASE_URL}/api/meetings`,
  SETTINGS: `${API_BASE_URL}/api/settings`,
  GLOBAL_ADDONS: `${API_BASE_URL}/api/global-addons`,
  CHATBOT: `${API_BASE_URL}/api/chatbot`
};

export const getAuthHeaders = (includeJson = true) => {
  const token = localStorage.getItem('token');
  const headers = {};

  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export default API_CONFIG;
