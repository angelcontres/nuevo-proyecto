# Specifications: US-06 — Reaccionar a Publicaciones (Likes)

## Domain: post-reactions (NEW)

### Requirement: Acción de Reaccionar (Me Gusta)
El usuario DEBE poder reaccionar a una publicación directamente desde el muro usando un botón de corazón.

- Scenario: Click en Like Optimista — GIVEN que el usuario ve una publicación en su feed
  WHEN el usuario da clic en el ícono del corazón
  THEN el ícono se torna rojo inmediatamente
  AND el contador numérico adyacente suma 1 sin esperar confirmación del servidor
**Acceptance**

- Scenario: Reversión ante fallo de red — GIVEN que el usuario da clic en el corazón
  AND el backend Quarkus está caído o responde 500
  WHEN falla la llamada a `/api/posts/{postId}/like`
  THEN la interfaz revierte el estado: el ícono pierde su color rojo y el contador resta 1
**Acceptance**

- Scenario: Estado Inicial Preexistente — GIVEN una publicación a la que el usuario ya había reaccionado en el pasado
  WHEN el `PostCard` renderiza
  THEN el ícono de corazón aparece rojo por defecto
  AND el botón se encuentra visual o funcionalmente deshabilitado para evitar peticiones duplicadas (el comportamiento del nodo Neo4j es idempotente)
**Acceptance**
