import React, { useState, useEffect } from 'react';
import { chatSocket, ChatMessage } from '../services/socket';

interface ChatWindowProps {
  currentUserId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ currentUserId }) => {
  const [destinatarioId, setDestinatarioId] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [mensajes, setMensajes] = useState<ChatMessage[]>([]);

  useEffect(() => {
    chatSocket.connect(currentUserId, (nuevoMensaje) => {
      setMensajes((prev) => [...prev, nuevoMensaje]);
    });

    return () => {
      chatSocket.disconnect();
    };
  }, [currentUserId]);

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim() || !destinatarioId.trim()) return;

    chatSocket.sendMessage(destinatarioId, mensaje);
    setMensajes((prev) => [
      ...prev,
      { emisorId: currentUserId, destinatarioId, contenido: mensaje }
    ]);
    setMensaje('');
  };

  return (
    <div className="card">
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem' }}>💬 Chat en Vivo (WebSockets)</h3>
      <div style={{ marginBottom: '0.5rem' }}>
        <input
          type="text"
          value={destinatarioId}
          onChange={(e) => setDestinatarioId(e.target.value)}
          placeholder="ID del usuario destinatario"
          style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ height: '180px', overflowY: 'auto', border: '1px solid #e4e6eb', borderRadius: '4px', padding: '0.5rem', marginBottom: '0.5rem', background: '#fafafa' }}>
        {mensajes.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', marginTop: '4rem' }}>
            No hay mensajes aún. ¡Inicia una conversación!
          </div>
        ) : (
          mensajes.map((m, idx) => (
            <div
              key={idx}
              style={{
                textAlign: m.emisorId === currentUserId ? 'right' : 'left',
                margin: '4px 0'
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  background: m.emisorId === currentUserId ? '#1877f2' : '#e4e6eb',
                  color: m.emisorId === currentUserId ? '#fff' : '#000',
                  fontSize: '0.85rem'
                }}
              >
                {m.contenido}
              </span>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleEnviar} style={{ display: 'flex', gap: '5px' }}>
        <input
          type="text"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Escribe un mensaje..."
          style={{ flex: 1, padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button type="submit" className="btn" style={{ padding: '0.4rem 0.8rem' }}>
          Enviar
        </button>
      </form>
    </div>
  );
};
