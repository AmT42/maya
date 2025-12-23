import { API_BASE_URL } from '../config/apiConfig';

const normalizeStoragePath = (filePath) => {
  if (!filePath) {
    return '';
  }
  return filePath.replace(/^\/?storage\//, '').replace(/^\/+/, '');
};

export const buildStorageUrl = (filePath) => {
  const normalizedPath = normalizeStoragePath(filePath);
  if (!normalizedPath) {
    return '';
  }
  return `${API_BASE_URL}/storage/${encodeURI(normalizedPath)}`;
};
