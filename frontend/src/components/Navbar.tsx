import React from 'react';

interface NavbarProps {
  currentUsername: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUsername }) => {
  return (
    <header style={{ background: '#ffffff', borderBottom: '1px solid #ddd', padding: '0.8rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h1 style={{ fontSize: '1.25rem', color: '#1877f2', fontWeight: 800 }}>🌐 Red Social Distribuida</h1>
        <span style={{ fontSize: '0.8rem', background: '#e7f3ff', color: '#1877f2', padding: '2px 8px', borderRadius: '12px' }}>
          Neo4j + Quarkus + MinIO
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span>Usuario: <strong>@{currentUsername}</strong></span>
      </div>
    </header>
  );
};
