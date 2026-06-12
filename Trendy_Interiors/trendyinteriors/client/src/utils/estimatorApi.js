import { API_BASE_URL, publicGet } from './publicApi';

export { API_BASE_URL };

export const fetchEstimatorRooms = () => publicGet('/api/cms/rooms?status=active');

export const fetchGlobalAddons = () => publicGet('/api/cms/global-addons?active=true');

export const slugifyRoomName = (name = '') =>
  String(name)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');

const DEFAULT_ROOM_IMAGE =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80';

export const normalizeEstimatorRoom = (room) => ({
  _id: room._id,
  id: slugifyRoomName(room.name),
  name: room.name,
  description: room.description || '',
  image: room.imageUrl || DEFAULT_ROOM_IMAGE,
  pricePerSqFt: Number(room.pricePerSqFt) || 0,
  dimensions: (room.dimensions || []).map((dim) => ({
    id: dim._id || dim.name,
    name: dim.name,
    label: dim.name,
    length: Number(dim.length) || 0,
    width: Number(dim.width) || 0,
    height: Number(dim.height) || 0,
  })),
  layouts: (room.layouts || []).map((layout) => ({
    label: layout.name,
    name: layout.name,
    image: layout.imageUrl || '',
    price: Number(layout.fixedPrice) || 0,
    description: layout.description || '',
  })),
  addons: (room.addons || []).map((addon) => ({
    label: addon.name,
    name: addon.name,
    image: addon.imageUrl || '',
    price: Number(addon.price) || 0,
    description: addon.description || '',
  })),
});

export const findRoomByName = (roomsCatalog = [], roomName = '') =>
  roomsCatalog.find((room) => room.name === roomName) || null;

export const formatGlobalAddonForCard = (addon) => ({
  id: addon._id,
  _id: addon._id,
  name: addon.name,
  description: addon.description || '',
  image: addon.imageUrl || '',
  price: Number(addon.price) || 0,
  priceHint: addon.price
    ? `From ₹${Number(addon.price).toLocaleString('en-IN')}`
    : 'Premium selection',
});

export const buildRoomInstances = (rooms = {}) =>
  Object.entries(rooms).flatMap(([roomName, count]) =>
    Array.from({ length: Number(count) || 0 }, (_, index) => ({
      id: `${roomName}-${index + 1}`,
      roomName,
      label: Number(count) > 1 ? `${roomName} ${index + 1}` : roomName,
    })),
  );
