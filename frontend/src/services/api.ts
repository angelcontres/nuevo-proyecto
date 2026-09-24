import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export interface Post {
  id: string;
  texto: string;
  mediaUrl?: string;
  fechaCreacion: string;
  autorId: string;
  autorUsername: string;
  autorAvatar?: string;
  totalLikes: number;
  likedByMe: boolean;
}

export interface SugerenciaUsuario {
  id: string;
  username: string;
  nombre: string;
  avatar?: string;
  conexionesEnComun: number;
  seguidosEnComun: string[];
}

export const getFeed = async (userId: string): Promise<Post[]> => {
  const response = await api.get<Post[]>(`/feed/${userId}`);
  return response.data;
};

export const createPost = async (autorId: string, texto: string, mediaUrl?: string): Promise<void> => {
  await api.post('/posts', { autorId, texto, mediaUrl });
};

export const toggleLike = async (postId: string, userId: string): Promise<void> => {
  await api.post(`/posts/${postId}/like`, { userId });
};

export const getSugerencias = async (userId: string): Promise<SugerenciaUsuario[]> => {
  const response = await api.get<SugerenciaUsuario[]>(`/users/${userId}/sugerencias`);
  return response.data;
};

export const followUser = async (seguidorId: string, seguidoId: string): Promise<void> => {
  await api.post(`/users/${seguidorId}/follow/${seguidoId}`);
};

export const unfollowUser = async (seguidorId: string, seguidoId: string): Promise<void> => {
  await api.delete(`/users/${seguidorId}/follow/${seguidoId}`);
};

export default api;
