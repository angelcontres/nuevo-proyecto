import React, { useState } from 'react';
import { Post, toggleLike, createPost } from '../services/api';

interface FeedProps {
  posts: Post[];
  currentUserId: string;
  onRefresh: () => void;
}

export const Feed: React.FC<FeedProps> = ({ posts, currentUserId, onRefresh }) => {
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTexto.trim()) return;
    setEnviando(true);
    try {
      await createPost(currentUserId, nuevoTexto, mediaUrl || undefined);
      setNuevoTexto('');
      setMediaUrl('');
      onRefresh();
    } catch (err) {
      console.error('Error al publicar:', err);
    } finally {
      setEnviando(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await toggleLike(postId, currentUserId);
      onRefresh();
    } catch (err) {
      console.error('Error al reaccionar:', err);
    }
  };

  return (
    <div>
      {/* Formulario de Nueva Publicación */}
      <div className="card">
        <h3>¿Qué estás pensando?</h3>
        <form onSubmit={handleSubmit} style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <textarea
            value={nuevoTexto}
            onChange={(e) => setNuevoTexto(e.target.value)}
            placeholder="Comparte una actualización con tu red social..."
            rows={3}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <input
            type="text"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="URL de imagen / MinIO (opcional)"
            style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <button type="submit" className="btn" disabled={enviando} style={{ alignSelf: 'flex-end' }}>
            {enviando ? 'Publicando...' : 'Publicar'}
          </button>
        </form>
      </div>

      {/* Listado del Feed Cronológico por Grafo */}
      <h3 style={{ marginBottom: '0.8rem', color: '#65676b' }}>Feed de Publicaciones (Grafo Social)</h3>
      {posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#65676b' }}>
          No hay publicaciones de tus amigos aún. ¡Sigue a otros usuarios para ver su contenido!
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1877f2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {post.autorUsername.charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>@{post.autorUsername}</strong>
                <div style={{ fontSize: '0.8rem', color: '#65676b' }}>{post.fechaCreacion}</div>
              </div>
            </div>
            <p style={{ margin: '0.5rem 0' }}>{post.texto}</p>
            {post.mediaUrl && (
              <img
                src={post.mediaUrl}
                alt="Contenido multimedia"
                style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '6px', margin: '0.5rem 0' }}
              />
            )}
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => handleLike(post.id)}
                className={`btn ${post.likedByMe ? '' : 'btn-secondary'}`}
              >
                👍 {post.totalLikes} Likes
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
