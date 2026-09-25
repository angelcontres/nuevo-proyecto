# Change Proposal: Gestión de Perfil de Usuario

## The Why
Los usuarios necesitan personalizar su identidad pública para fomentar la interacción social.

## The What
Permitir actualizar el nombre, la biografía y subir una foto de perfil (avatar). Las imágenes se suben a MinIO (S3) y la URL pública se persiste en el nodo `Usuario` en Neo4j.
