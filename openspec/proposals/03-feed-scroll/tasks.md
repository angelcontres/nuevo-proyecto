# Implementation Tasks

- [ ] 1. Backend: En `GrafoRepository.java`, crear el query Cypher con filtro de 14 días y paginación por `$cursor`.
- [ ] 2. Backend: En `FeedResource.java`, exponer GET `/api/feed?cursor=...`.
- [ ] 3. Frontend: Crear componente `Feed.tsx`.
- [ ] 4. Frontend: Implementar hook `useInfiniteScroll` acoplado a la respuesta de la API.
- [ ] 5. Frontend: Renderizar el estado "Loading" o "Estás al día" (empty state).
