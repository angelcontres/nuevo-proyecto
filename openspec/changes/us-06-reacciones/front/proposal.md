# Proposal: US-06 — Reaccionar a Publicaciones (Likes)

**Change**: `2026-09-25-us-06-reacciones-likes`  
**Scope**: Frontend (React + Vite + Tailwind)  
**Phase**: Sprint 2  
**Ticket**: TUX-56 (US-06)

---

## Intent

Permitir a los usuarios interactuar con las publicaciones en el feed (`frontend/src/features/feed/components/FeedList.tsx`) dando "Me gusta" (Like). Al hacer clic en el botón de Like, el contador debe incrementar optimísticamente en la UI y disparar la petición REST hacia el backend de Quarkus.

**User Flow**:
1. El usuario navega por su feed cronológico
2. El usuario hace clic en el botón de Like (ícono de corazón) de una publicación
3. El ícono se vuelve rojo (corazón lleno) y el contador aumenta en 1 instantáneamente
4. La petición REST asíncrona confirma en el backend la relación `[:REACCIONA]` en Neo4j

---

## Scope

### In Scope

**Component**: `PostCard.tsx` (`frontend/src/features/feed/components/PostCard.tsx`)
**Service**: `feedApi.ts` (`frontend/src/features/feed/services/feedApi.ts`)

**Template/UI Changes**: 
- Agregar el botón de interacciones debajo de la imagen/texto en `PostCard` usando `lucide-react` (ícono `Heart`)
- Manejo de estado local en el componente (`likedByMe`, `totalLikes`)

**Behavior**:
- Click en el botón dispara la API `toggleLike`
- Reacción optimista en la interfaz para no esperar la latencia de la red
- Si la API falla (ej: error 500), se revierte el estado optimista y se muestra un toast/error discreto

### Out of Scope

- Otros tipos de reacciones (Me divierte, Me enoja, etc). Solo se implementa el Like estándar.
- Animaciones complejas o micro-interacciones (Lottie). Un cambio de color CSS basta.

---

## Technical Context

### Current Implementation

Actualmente el componente `PostCard` solo renderiza `texto`, `mediaUrl` y autor. No existe la sección de interacciones.

### After Change

Se añadirá el manejador de click que invoca a `feedApi.toggleLike(postId)` y actualiza el estado interno derivado de los props iniciales que retorna `GET /api/feed`.

---

## Database Changes
(Se manejan en el ticket de Backend, ninguna migración necesaria aquí; Neo4j MERGE)

---

## Deliverables

1. Componente actualizado `PostCard.tsx`
2. Servicio API `feedApi.ts` con endpoint `POST /api/posts/{postId}/like`
3. Definir tarea pendiente para añadir runner de tests (Vitest) y realizar los assertions de renderizado

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Fallo de red deja el contador desincronizado | Falso positivo visual | Revertir el estado optimista en el bloque `catch` del handler |
| Múltiples clicks rápidos | Carga excesiva a API | Deshabilitar el botón durante la petición en curso o usar debounce en la función onClick |

---

## Success Criteria

- [ ] Click en corazón incrementa el contador de likes y lo pinta rojo
- [ ] Segundo click no hace un "unlike" (el backend es idempotente para el like actual, ver especificación)
- [ ] Petición REST hacia `POST /api/posts/{id}/like` se envía con el cuerpo correcto
- [ ] La UI no se bloquea esperando la respuesta (actualización optimista)
