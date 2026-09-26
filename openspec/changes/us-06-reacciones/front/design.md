# Design: US-06 — Reaccionar a Publicaciones (Likes)

**Change**: `2026-09-25-us-06-reacciones-likes`  
**Status**: DESIGN  

---

## Overview

Agrega el botón de "Me Gusta" en la tarjeta de publicación (`PostCard.tsx`). Utiliza React hooks (`useState`) para manejar el estado optimista mientras axios se comunica con la API Quarkus.

---

## D1: Estado Optimista — useState

**Decision**: Utilizar un estado interno en el componente `PostCard` (`isLiked`, `likesCount`) inicializado por los props (`post.likedByMe`, `post.totalLikes`).

**Why**: 
- Permite feedback instantáneo.
- React renderiza el componente rápidamente sin afectar el resto del `FeedList`.
- Almacenar este estado globalmente en un contexto sería overkill para algo tan localizado.

---

## D2: Icono — Lucide React

**Decision**: Usar `Heart` de `lucide-react`.

**Why**: 
- Ya está disponible en el ecosistema definido en el contexto del proyecto.
- Permite usar clases Tailwind (`fill-red-500 text-red-500`) cuando `isLiked` es verdadero.

---

## D3: Idempotencia

**Decision**: Deshabilitar temporalmente el botón (isLiking) hasta que responda la API, y confiar en el endpoint MERGE de Neo4j (que no duplica aristas).

**Why**: 
- Evita spam visual.
- El backend maneja intentos repetidos con seguridad por el MERGE.

---

## Affected Components

### PostCard Component

**File**: `frontend/src/features/feed/components/PostCard.tsx`

**Change**: En el template del componente, debajo del body del post, agregar:
```tsx
<div className="flex items-center mt-4">
  <button 
    onClick={handleLike} 
    disabled={isLiking || isLiked} 
    className="flex items-center space-x-2 text-gray-500 hover:text-red-500"
  >
    <Heart className={isLiked ? 'fill-red-500 text-red-500' : ''} />
    <span>{likesCount}</span>
  </button>
</div>
```

---

### feedApi Service

**File**: `frontend/src/features/feed/services/feedApi.ts`

**Change**: Exportar función `toggleLike(postId: string, userId: string)`. Llama vía `axios.post` a `/api/posts/${postId}/like`.

---

## Verification Checklist

- [ ] `PostCard.tsx` renderiza el botón Heart
- [ ] La clase Tailwind roja se aplica cuando `likedByMe` es verdadero
- [ ] Función `toggleLike` maneja la petición asíncrona correctamente
- [ ] Los estados revierten correctamente si hay error 500 en Axios
- [ ] No existen dependencias de Jest, Karma ni Cypress.

---

## No Breaking Changes

**Backward Compatibility**:
- No cambia la estructura de props fundamental (solo lee nuevos booleanos).
- Funciona perfectamente junto a las nuevas features sin romper las existentes.
