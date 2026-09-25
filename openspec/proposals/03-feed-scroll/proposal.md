# Change Proposal: Feed de Publicaciones (14 días)

## The Why
Los usuarios necesitan consumir el contenido de forma fluida. Cargar todos los posts de golpe colapsaría el cliente y el backend.

## The What
Implementar un endpoint en Quarkus que traiga subgrafos de Posts (últimos 14 días), ordenados por fecha, en lotes de 10, usando el nodo temporal como cursor. El frontend consumirá esto con un IntersectionObserver.
