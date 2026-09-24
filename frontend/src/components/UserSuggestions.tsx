import React from 'react';
import { SugerenciaUsuario, followUser } from '../services/api';

interface UserSuggestionsProps {
  sugerencias: SugerenciaUsuario[];
  currentUserId: string;
  onFollowUpdated: () => void;
}

export const UserSuggestions: React.FC<UserSuggestionsProps> = ({ sugerencias, currentUserId, onFollowUpdated }) => {
  const handleFollow = async (targetId: string) => {
    try {
      await followUser(currentUserId, targetId);
      onFollowUpdated();
    } catch (err) {
      console.error('Error al seguir usuario:', err);
    }
  };

  return (
    <div className="card">
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', color: '#050505' }}>
        Sugerencias de Amigos
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#65676b', marginBottom: '1rem' }}>
        Calculadas con Cypher en 2º grado de separación.
      </p>

      {sugerencias.length === 0 ? (
        <p style={{ fontSize: '0.9rem', color: '#65676b' }}>No hay sugerencias en este momento.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {sugerencias.map((sug) => (
            <div key={sug.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>@{sug.username}</strong>
                <div style={{ fontSize: '0.75rem', color: '#65676b' }}>
                  {sug.conexionesEnComun} conexión(es) en común
                </div>
              </div>
              <button onClick={() => handleFollow(sug.id)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                Seguir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
