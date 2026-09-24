# Frontend React - Red Social Distribuida

Single Page Application (SPA) construida con **React 18 + TypeScript + Vite**, empaquetada con **Nginx** para producción y dotada de un **Service Worker** para soporte de notificaciones **Web Push (VAPID)**.

## Características

- **Feed Dinámico:** Renderizado de publicaciones basado en el grafo de seguimiento social.
- **Sugerencias Inteligentes:** Conexiones sugeridas a 2 saltos de distancia calculadas en Neo4j.
- **Chat en Vivo:** Comunicación bidireccional inmediata mediante WebSockets sin sobrecarga de sondeo.
- **Web Push Notifications:** Recepción de alertas nativas en segundo plano mediante Service Worker (`public/sw.js`).

## Ejecución Local

```bash
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:3000` con proxy inverso configurado hacia el backend Quarkus en el puerto `8080`.
