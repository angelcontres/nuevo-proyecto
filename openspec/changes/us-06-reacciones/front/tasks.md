# Tasks: US-06 — Reaccionar a Publicaciones (Likes)

**Change**: `2026-09-25-us-06-reacciones-likes`  
**Phase**: Sprint 2

---

## Phase 1: Implementation

### 1.1 Update feedApi Service

- [ ] Abrir `frontend/src/features/feed/services/feedApi.ts`
- [ ] Añadir la función asíncrona: `export const toggleLike = async (postId: string, userId: string) => { ... }` usando `axios.post`.

### 1.2 Update PostCard Component

- [ ] Abrir `frontend/src/features/feed/components/PostCard.tsx`
- [ ] Importar `Heart` de `lucide-react` y hook `useState` de `react`
- [ ] Inicializar los estados `isLiked` y `likesCount` con los valores provistos en `post.likedByMe` y `post.totalLikes`
- [ ] Crear el manejador asíncrono `handleLike`
  - Dentro de `handleLike`: establecer `isLiked(true)`, `setLikesCount(prev => prev + 1)`
  - Ejecutar `feedApi.toggleLike(...)`
  - En el bloque `catch`, revertir `isLiked` y decrementar el contador si falla la red
- [ ] Añadir en el JSX devuelto el bloque de interacciones con el ícono y el estilo condicional (`fill-red-500` si `isLiked` es true).

### 1.3 Verificación de Tipos y Construcción

- [ ] Ejecutar el comando real configurado: `cd frontend && npm run build` (que ejecuta `tsc && vite build`)
- [ ] Verificar que no existan errores de TS.

## Phase 2: Testing

### 2.1 Añadir runner de tests

- [ ] Tarea explícita: **Añadir runner de tests en frontend** (el proyecto no cuenta con uno). Configurar Vitest con `@testing-library/react`.
- [ ] Crear `frontend/src/features/feed/components/PostCard.test.tsx` (vacío como placeholder hasta definir framework formalmente en el proyecto global).

### 2.2 Pruebas manuales en Local

- [ ] Ejecutar el stack local: `docker compose up -d` en backend/db y `npm run dev` en el frontend (puerto 3000)
- [ ] Autenticar/simular usuario
- [ ] Hacer click en el botón "Like" de una publicación
- [ ] Validar que la request viaja por la consola de red del navegador y recibe un 200 OK
- [ ] Refrescar la página para validar persistencia final leída desde Neo4j

---

## Summary

La tarea se centra exclusivamente en React, utilizando hooks y promesas para dar la sensación de inmediatez. Se remueve la verificación de linter (ESLint) porque no existe en la configuración actual del proyecto. No hay Jest ni Cypress involucrados.
