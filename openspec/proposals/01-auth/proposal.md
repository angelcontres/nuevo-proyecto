# Change Proposal: Registro y Autenticación de Usuarios

## The Why
El sistema actual necesita un mecanismo seguro para identificar a los usuarios en la red social. Sin esto, no hay propiedad de los nodos `Post` ni de las relaciones `LIKE` en Neo4j.

## The What
Implementar el registro de usuarios con email y contraseña, hasheo seguro (bcrypt/argon2), y emisión de tokens JWT para mantener la sesión stateless.
