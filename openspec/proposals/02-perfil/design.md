# Design: Gestión de Perfil

## Flujo de Carga de Imagen
1. Frontend usa `<input type="file">`.
2. Se envía form-data al backend Quarkus.
3. Quarkus valida tamaño (< 5MB) y formato.
4. Quarkus delega a `S3StorageService` (MinIO).
5. Se obtiene URL pública, se hace un UPDATE sobre el nodo `Usuario` en Neo4j.
