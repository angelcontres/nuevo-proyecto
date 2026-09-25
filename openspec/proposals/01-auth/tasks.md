# Implementation Tasks

- [ ] 1. Backend: Agregar dependencia `quarkus-smallrye-jwt` y `jbcrypt` en `pom.xml`.
- [ ] 2. Backend: Actualizar modelo `Usuario` en Neo4j para incluir `email` y `passwordHash`.
- [ ] 3. Backend: Crear índice único en Neo4j para `Usuario(email)`.
- [ ] 4. Backend: Implementar `AuthResource.java` con endpoint POST `/api/auth/register`.
- [ ] 5. Backend: Implementar endpoint POST `/api/auth/login` que valide el hash y genere el JWT.
- [ ] 6. Frontend: Configurar cliente Axios con interceptor para enviar el header `Authorization: Bearer <token>`.
- [ ] 7. Frontend: Crear página `Register.tsx` con validaciones (email formato, password min 8 chars).
- [ ] 8. Frontend: Crear página `Login.tsx` y contexto de sesión (AuthContext).
