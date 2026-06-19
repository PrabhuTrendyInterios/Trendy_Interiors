const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://trendyinteriors-1.onrender.com');

export const CMS_BASE = `${API_BASE_URL}/api/cms`;

const getAuthHeaders = (includeJson = true) => {
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

const parseResponse = async (response) => {
  let body = {};

  try {
    body = await response.json();
  } catch (error) {
    body = {};
  }

  if (!response.ok) {
    const message =
      body.message ||
      body.error ||
      (Array.isArray(body.errors) ? body.errors.join(', ') : null) ||
      'Request failed';
    throw new Error(message);
  }

  return body;
};

export const cmsRequest = async (path, options = {}) => {
  const response = await fetch(`${CMS_BASE}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(options.body !== undefined),
      ...(options.headers || {}),
    },
  });

  return parseResponse(response);
};

export const cmsGet = (path) => cmsRequest(path);
export const cmsPost = (path, data) =>
  cmsRequest(path, { method: 'POST', body: JSON.stringify(data) });
export const cmsPut = (path, data) =>
  cmsRequest(path, { method: 'PUT', body: JSON.stringify(data) });
export const cmsDelete = (path) => cmsRequest(path, { method: 'DELETE' });

export const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
