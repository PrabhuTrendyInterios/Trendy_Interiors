export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://trendyinteriors-1.onrender.com');

export const publicGet = async (path) => {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data;
};

export const publicPost = async (path, payload) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data;
};

const authRequest = async (path, options = {}) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  if (options.body !== undefined && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data;
};

export const authGet = (path) => authRequest(path, { method: 'GET' });
export const authPost = (path, data) => authRequest(path, { method: 'POST', body: JSON.stringify(data) });
export const authPut = (path, data) => authRequest(path, { method: 'PUT', body: JSON.stringify(data) });
export const authPatch = (path, data) =>
  authRequest(path, { method: 'PATCH', body: data !== undefined ? JSON.stringify(data) : undefined });
export const authDelete = (path) => authRequest(path, { method: 'DELETE' });

export const getProjectCover = (project) =>
  project?.coverImageUrl || project?.image || '';

export const getProjectGallery = (project) => {
  const gallery = project?.galleryImages || project?.images || [];
  const cover = getProjectCover(project);
  if (gallery.length > 0) return gallery;
  return cover ? [cover] : [];
};

export const getMemberImage = (member) => member?.imageUrl || member?.image || '';

export const getMemberContact = (member) => member?.contact || member?.mobilePhone || '';

export const normalizeProjectForDisplay = (project) => ({
  ...project,
  image: getProjectCover(project),
  images: getProjectGallery(project),
});

export const normalizeMemberForDisplay = (member) => ({
  ...member,
  image: getMemberImage(member),
  mobilePhone: getMemberContact(member),
});
