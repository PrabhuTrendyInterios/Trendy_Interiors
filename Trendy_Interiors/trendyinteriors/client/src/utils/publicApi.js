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
