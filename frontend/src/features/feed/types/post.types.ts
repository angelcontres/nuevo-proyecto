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

export interface CreatePostPayload {
  autorId: string;
  texto: string;
  mediaUrl?: string;
  autorUsername?: string;
}
