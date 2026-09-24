# Configuración de Docker y Entorno

Este directorio contiene utilidades y documentación de despliegue para la arquitectura distribuida.

## Servicios Orquestados

1. **Neo4j (`redsocial-neo4j`):**
   - Puerto HTTP/Browser: `7474`
   - Puerto Bolt: `7687`
   - Credenciales: `neo4j` / `password123`
   - Plugins: APOC

2. **MinIO (`redsocial-minio`):**
   - Puerto API S3: `9000`
   - Puerto Consola Web: `9001`
   - Credenciales: `minioadmin` / `minioadmin`
   - Bucket: `redsocial-media`

3. **Backend Quarkus (`redsocial-backend`):**
   - Puerto REST/WebSocket: `8080`
   - Dev UI: `http://localhost:8080/q/dev`

4. **Frontend React (`redsocial-frontend`):**
   - Puerto Web: `3000`

## Comandos Útiles

```bash
# Levantar todos los servicios en segundo plano y reconstruir imágenes
docker compose up --build -d

# Ver registros en tiempo real
docker compose logs -f

# Detener todos los contenedores y remover volúmenes de datos
docker compose down -v
```
