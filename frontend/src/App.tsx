import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Feed } from './components/Feed';
import { UserSuggestions } from './components/UserSuggestions';
import { ChatWindow } from './components/ChatWindow';
import { getFeed, getSugerencias, Post, SugerenciaUsuario } from './services/api';

export const App: React.FC = () => {
  const [currentUserId] = useState<string>('carlos-patino');
  const [currentUsername] = useState<string>('carlos');
  const [posts, setPosts] = useState<Post[]>([]);
  const [sugerencias, setSugerencias] = useState<SugerenciaUsuario[]>([]);

  const loadData = async () => {
    try {
      const [feedData, sugData] = await Promise.all([
        getFeed(currentUserId).catch(() => []),
        getSugerencias(currentUserId).catch(() => [])
      ]);
      setPosts(feedData);
      setSugerencias(sugData);
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUserId]);

  return (
    <div>
      <Navbar currentUsername={currentUsername} />
      <main className="container" style={{ marginTop: '1.5rem' }}>
        <div className="grid-layout">
          <div>
            <Feed
              posts={posts}
              currentUserId={currentUserId}
              onRefresh={loadData}
            />
          </div>
          <div>
            <UserSuggestions
              sugerencias={sugerencias}
              currentUserId={currentUserId}
              onFollowUpdated={loadData}
            />
            <ChatWindow currentUserId={currentUserId} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
