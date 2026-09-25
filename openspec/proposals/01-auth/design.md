# Design: Registro y Autenticación

## Arquitectura
- **Frontend (React/Vite):** Formularios de login y registro gestionados con React Hook Form. El token JWT se almacena de forma segura en memoria o HttpOnly cookie (para este iteración usaremos localStorage/sessionStorage o estado en memoria).
- **Backend (Quarkus):** Endpoint JAX-RS público `/api/auth/register` y `/api/auth/login`.
- **Base de Datos (Neo4j):** Nodo `Usuario` con propiedades `email` (único) y `passwordHash`.

## Seguridad
- Contraseñas hasheadas (bcrypt).
- JWT firmado con llave privada.
