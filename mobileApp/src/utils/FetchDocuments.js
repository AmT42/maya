import apiClient from '../services/apiClient';

export const FetchDocuments = async ({ path } = { path: null }) => {
    try {
        const endpoint = '/user/documents';
        const url = path ? `${endpoint}?path=${encodeURIComponent(path.join('/'))}` : endpoint;
        const response = await apiClient.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching documents:", error);
        throw error;
    }
};
