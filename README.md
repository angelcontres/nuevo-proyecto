```typescript
Desarrollado por:

- Paulo Orrala
- Carlos Patiño
- Angel Villon
```

// Prueba de conexion con kanban de linearapp

# **Red Social Distribuida \- Especificación de Arquitectura, Backlog y Ejecución**

Guía integral para el diseño, implementación, justificación técnica y despliegue del sistema distribuido conforme a los requerimientos de la actividad práctica.

## **1\. Diagrama y Flujo de la Arquitectura Distribuida**

                    ┌─────────────────────────┐
                    │      React Frontend     │
                    │   (SPA \+ ServiceWorker) │
                    └────────────┬────────────┘
                                 │
             HTTP REST (JSON)    │    WebSocket (WSS)
             Operaciones CRUD    │    Chat Bidireccional
                                 │
                    ┌────────────▼────────────┐
                    │  Quarkus Backend (Java) │
                    │   (Orquestador Lógico)  │
                    └───┬─────────────┬───────┘
                        │             │
       Cypher (Bolt:7687)│             │ S3 API (HTTP:9000)
       Grafo Social     │             │ Binarios Multimedia
                        │             │
                ┌───────▼──────┐    ┌─▼──────────────┐
                │    Neo4j     │    │  MinIO (S3)    │
                │ Base Grafos  │    │ Object Storage │
                └──────────────┘    └────────────────┘
                        │
                  Web Push (VAPID)
                        │
                ┌───────▼──────────────┐
                │ Navegador de Usuario │
                │   (OS Notification)  │
                └──────────────────────┘

### **Justificación de Tecnologías y Mecanismos de Comunicación**

| Necesidad del Sistema             | Mecanismo Implementado    | ¿Por qué esta tecnología?                                                                                         | ¿Qué problema resuelve?                                                                                                   |
| :-------------------------------- | :------------------------ | :---------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **Operaciones Transaccionales**   | **REST / HTTP**           | Protocolo sin estado (_stateless_), semántica estándar (GET, POST, DELETE).                                       | Creación de cuentas, inicio de sesión, publicación y seguimiento sin sobrecoste de canal abierto.                         |
| **Chat en Vivo 1 a 1**            | **WebSockets**            | Conexión bidireccional TCP dúplex persistente con bajísima latencia.                                              | Elimina la sobrecarga de cabeceras HTTP y el consumo ineficiente de CPU del _polling_ periódico.                          |
| **Alertas fuera de la app**       | **Web Push (VAPID)**      | Estándar W3C soportado por el sistema operativo mediante _Service Workers_.                                       | Permite notificar a los usuarios aunque tengan la pestaña cerrada o la aplicación en segundo plano.                       |
| **Grafo Social y Recomendación**  | **Neo4j (Cypher)**        | _Index-free adjacency_: cada nodo almacena punteros directos a sus relaciones adyacentes (![][image1] por salto). | Evita costosos ![][image2] relacionales recursivos al consultar feeds, amigos en común o sugerencias de múltiples saltos. |
| **Multimedia de Publicaciones**   | **MinIO (S3 Compatible)** | Almacenamiento desacoplado orientado a objetos con metadata.                                                      | Mantiene la base de datos de grafos liviana, delegando la persistencia de binarios pesados a un sistema escalable.        |
| **Despliegue y Reproducibilidad** | **Docker & Compose**      | Empaquetado inmutable y redes virtuales puente (_bridge_).                                                        | Garantiza que la topología distribuida arranque con un solo comando sin discrepancias de entorno.                         |

## **2\. Modelo de Grafos en Neo4j**

### **Nodos y Propiedades**

- (:Usuario {id, username, email, nombre, avatarUrl, pushSubscriptionJson})
- (:Post {id, texto, mediaUrl, fechaCreacion})

### **Relaciones**

- (:Usuario)-\[:SIGUE {desde: timestamp}\]-\>(:Usuario)
- (:Usuario)-\[:PUBLICA\]-\>(:Post)
- (:Usuario)-\[:REACCIONA {tipo: 'LIKE', fecha: timestamp}\]-\>(:Post)

## **3\. Las 5 Consultas Cypher Obligatorias (No Triviales)**

### **1\. Feed Cronológico Filtrado por Grafo Social (2 Saltos)**

Obtiene únicamente las publicaciones creadas por los usuarios que el solicitante sigue:

MATCH (u:Usuario {id: \$userId})-\[:SIGUE\]-\>(amigo:Usuario)-\[:PUBLICA\]-\>(p:Post)  
OPTIONAL MATCH (p)\<-\[r:REACCIONA\]-(:Usuario)  
RETURN p.id AS id,  
p.texto AS texto,  
p.mediaUrl AS mediaUrl,  
p.fechaCreacion AS fecha,  
amigo.id AS autorId,  
amigo.username AS autorUsername,  
amigo.avatarUrl AS autorAvatar,  
count(r) AS totalLikes,  
EXISTS((u)-\[:REACCIONA\]-\>(p)) AS likedByMe  
ORDER BY p.fechaCreacion DESC  
LIMIT 20;

### **2\. Algoritmo de Sugerencia de Usuarios (Red Social de Segundo Nivel)**

Calcula recomendaciones basadas en conexiones mutuas ("amigos de amigos" que aún no sigue):

MATCH (u:Usuario {id: \$userId})-\[:SIGUE\]-\>(intermedio:Usuario)-\[:SIGUE\]-\>(sugerido:Usuario)  
WHERE u \<\> sugerido AND NOT (u)-\[:SIGUE\]-\>(sugerido)  
RETURN sugerido.id AS id,  
sugerido.username AS username,  
sugerido.nombre AS nombre,  
sugerido.avatarUrl AS avatar,  
count(intermedio) AS conexionesEnComun,  
collect(intermedio.username) AS seguidosEnComun  
ORDER BY conexionesEnComun DESC  
LIMIT 5;

### **3\. Seguidores y Conexiones en Común entre Dos Perfiles**

Identifica la intersección de seguimiento entre dos perfiles analizados:

MATCH (u1:Usuario {id: \\(userA})\<-\[:SIGUE\]-(comun:Usuario)-\[:SIGUE\]-\>(u2:Usuario {id:\\)userB})  
RETURN comun.id AS id,  
comun.username AS username,  
comun.nombre AS nombre,  
comun.avatarUrl AS avatar;

### **4\. Grado de Separación y Camino Más Corto (Shortest Path)**

Calcula la cadena de conexiones mínimas que unen a dos usuarios distantes:

MATCH p \= shortestPath((origen:Usuario {id: \\(origenId})-\[:SIGUE\*..6\]-\>(destino:Usuario {id:\\)destinoId}))  
WHERE origen \<\> destino  
RETURN \[n IN nodes(p) | n.username\] AS rutaConexion,  
length(p) AS saltosTotales;

### **5\. Tendencias en la Red Extendida (Posts con más interacción a 1 y 2 saltos)**

Detecta publicaciones populares generadas dentro de la red cercana del usuario:

MATCH (u:Usuario {id: \$userId})-\[:SIGUE\*1..2\]-\>(autor:Usuario)-\[:PUBLICA\]-\>(p:Post)  
WHERE p.fechaCreacion \>= datetime() \- duration('P7D')  
MATCH (reactor:Usuario)-\[:REACCIONA\]-\>(p)  
RETURN p.id AS id,  
p.texto AS texto,  
autor.username AS autor,  
count(reactor) AS totalReacciones  
ORDER BY totalReacciones DESC  
LIMIT 10;

## **4\. Product Backlog y Consenso de Estimación**

Consenso de Planning Poker aplicando la secuencia Fibonacci (![][image3]) y mapeo a historias de usuario:

| ID        | Épica     | Historia de Usuario                     | Consenso | Criterio de Aceptación Principal                                                               |
| :-------- | :-------- | :-------------------------------------- | :------- | :--------------------------------------------------------------------------------------------- |
| **US-01** | Identidad | Registro, login y perfil con foto       | **2 SP** | Autenticación JWT, subida de avatar a MinIO y persistencia de nodo (:Usuario) en Neo4j.        |
| **US-02** | Grafo     | Seguir, dejar de seguir y consultar red | **2 SP** | Creación/destrucción atómica de la relación \[:SIGUE\].                                        |
| **US-03** | Grafo     | Sugerencia inteligente de contactos     | **3 SP** | Implementación de Cypher recursivo de 2do grado ponderado por amigos mutuos.                   |
| **US-04** | Contenido | Crear publicación con multimedia S3     | **3 SP** | Separación estricta: binario a MinIO, URL y metadata a nodo (:Post) con relación \[:PUBLICA\]. |
| **US-05** | Feed      | Feed generado por grafo social          | **5 SP** | Recorrido (u)-\[:SIGUE\]-\>()-\[:PUBLICA\]-\>(p) ordenado cronológicamente.                    |
| **US-06** | Contenido | Reaccionar a publicaciones (Likes)      | **2 SP** | Gestión idempotente de la relación \[:REACCIONA {tipo: 'LIKE'}\].                              |
| **US-07** | Chat      | Mensajería instantánea 1 a 1            | **5 SP** | Comunicación bidireccional mediante WebSocket en Quarkus sin polling.                          |
| **US-08** | Alertas   | Notificaciones Web Push al publicar     | **5 SP** | Disparo de eventos hacia la suscripción del Service Worker del navegador ante nuevos posts.    |

## **5\. Especificaciones en Formato Gherkin (Historias Complejas)**

### **US-05: Feed Basado en Grafo Social**

Característica: Generación del feed a partir de relaciones de seguimiento

Escenario: Usuario visualiza publicaciones de sus seguidos  
Dado que el usuario "Carlos" sigue a "Beatriz" en el grafo  
Y "Beatriz" ha publicado un post hace 1 hora  
Y "David" (a quien "Carlos" NO sigue) ha publicado un post hace 5 minutos  
Cuando "Carlos" solicita su feed principal  
Entonces la consulta Cypher recorre (:Usuario {username: 'Carlos'})-\[:SIGUE\]-\>()-\[:PUBLICA\]-\>(:Post)  
Y el feed muestra la publicación de "Beatriz"  
Y la publicación de "David" es excluida del resultado.

### **US-07: Chat en Tiempo Real por WebSockets**

Característica: Mensajería bidireccional en tiempo real

Escenario: Envío instantáneo de mensaje entre usuarios conectados  
Dado que "Usuario 1" y "Usuario 2" tienen una sesión WebSocket abierta en Quarkus  
Cuando "Usuario 1" transmite un paquete de texto dirigido a "Usuario 2"  
Entonces el socket enruta el mensaje directamente a la sesión activa del destinatario  
Y el mensaje aparece en la pantalla del "Usuario 2" sin que este realice peticiones HTTP de sondeo (polling).

### **US-08: Notificación Web Push ante Nueva Publicación**

Característica: Notificación fuera del navegador con Web Push

Escenario: Notificar a un seguidor cuando se genera contenido nuevo  
Dado que "Anthony" sigue a "Carlos" en el grafo social  
Y "Anthony" tiene suscripción Web Push activa registrada en su nodo  
Cuando "Carlos" crea una nueva publicación vía REST  
Entonces el backend detecta los seguidores suscritos mediante Cypher  
Y Quarkus envía la carga útil cifrada con llaves VAPID al servicio Push del navegador  
Y el Service Worker de "Anthony" despliega una notificación nativa del sistema operativo.

## **6\. Infraestructura de Contenedores (docker-compose.yml)**

Guarda este archivo en la raíz del proyecto para orquestar la arquitectura completa:

version: '3.8'

services:  
\# Base de Datos de Grafos  
neo4j:  
image: neo4j:5.20-community  
container\_name: redsocial-neo4j  
ports:  
\- "7474:7474" \# Web Browser UI  
\- "7687:7687" \# Protocolo Bolt  
environment:  
\- NEO4J\_AUTH=neo4j/password123  
\- NEO4J\_PLUGINS=\["apoc"\]  
volumes:  
\- neo4j\_data:/data  
networks:  
\- red-distribuida  
healthcheck:  
test: \["CMD", "cypher-shell", "-u", "neo4j", "-p", "password123", "RETURN 1"\]  
interval: 10s  
timeout: 5s  
retries: 5

\# Object Storage compatible con S3  
minio:  
image: minio/minio:RELEASE.2024-05-10T01-41-38Z  
container\_name: redsocial-minio  
ports:  
\- "9000:9000" \# API S3  
\- "9001:9001" \# Consola Web  
environment:  
\- MINIO\_ROOT\_USER=minioadmin  
\- MINIO\_ROOT\_PASSWORD=minioadmin  
command: server /data \--console-address ":9001"  
volumes:  
\- minio\_data:/data  
networks:  
\- red-distribuida

\# Inicializador automático del Bucket en MinIO  
minio-init:  
image: minio/mc:latest  
depends\_on:  
\- minio  
networks:  
\- red-distribuida  
entrypoint: \>  
/bin/sh \-c "  
/usr/bin/mc alias set local <http://minio:9000> minioadmin minioadmin;  
/usr/bin/mc mb local/redsocial-media \--ignore-existing;  
/usr/bin/mc anonymous set download local/redsocial-media;  
exit 0;  
"

\# Backend Quarkus (Java)  
backend:  
build:  
context: ./backend  
dockerfile: Dockerfile.jvm  
container\_name: redsocial-backend  
ports:  
\- "8080:8080"  
environment:  
\- QUARKUS\_NEO4J\_URI=bolt://neo4j:7687  
\- QUARKUS\_NEO4J\_AUTHENTICATION\_USERNAME=neo4j  
\- QUARKUS\_NEO4J\_AUTHENTICATION\_PASSWORD=password123  
\- S3\_ENDPOINT=<http://minio:9000>  
\- S3\_BUCKET=redsocial-media  
\- S3\_ACCESS\_KEY=minioadmin  
\- S3\_SECRET\_KEY=minioadmin  
\- VAPID\_PUBLIC\_KEY=BGw-ejemploClavePublicaVAPID...  
\- VAPID\_PRIVATE\_KEY=ejemploClavePrivadaVAPID...  
\- VAPID\_SUBJECT=mailto:<admin@redsocial.edu.ec>  
depends\_on:  
neo4j:  
condition: service\_healthy  
minio:  
condition: service\_started  
networks:  
\- red-distribuida

\# Frontend React  
frontend:  
build:  
context: ./frontend  
dockerfile: Dockerfile  
container\_name: redsocial-frontend  
ports:  
\- "3000:80"  
depends\_on:  
\- backend  
networks:  
\- red-distribuida

networks:  
red-distribuida:  
driver: bridge

volumes:  
neo4j\_data:  
minio\_data:

## **7\. Instrucciones para Levantar el Entorno**

### **Paso 1: Generar Llaves VAPID para Web Push**

Ejecuta en tu terminal para obtener el par de claves públicas y privadas:

npx web-push generate-vapid-keys

Copia los valores e ingrésalos en las variables de entorno de Quarkus (VAPID\_PUBLIC\_KEY y VAPID\_PRIVATE\_KEY).

### **Paso 2: Despliegue con Docker Compose**

Desde la carpeta raíz del proyecto, ejecuta:

docker compose up \--build \-d

### **Paso 3: Verificación de Servicios**

- **Frontend React:** <http://localhost:3000>
- **Backend Quarkus:** <http://localhost:8080> (Consola Dev: <http://localhost:8080/q/dev>)
- **Neo4j Browser:** <http://localhost:7474> (Usuario: neo4j, Contraseña: password123)
- **MinIO Console:** <http://localhost:9001> (Usuario: minioadmin, Contraseña: minioadmin)

[image1]: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAWCAYAAACsR+4DAAAC1ElEQVR4Xr1WO2gUURSdIQYUREFdJezOezu72yjYONhpI7FIYRMEC0sLrf0gClZWgoUEq8UmhQhiIViIYiGpRNtACpsogYC9RVCznvs+M/fd+QbEA4+ZOfe+886777MbRS2IJSEQxtuy/yP2amWv+f8I7cPKCrf3KCPWWt9SSr3G8wPaAxYqXhmDnCnlyliBcj8C71ed4aC1uoDEDZh6h+e14XD4SGn9A+8vB4PBEZnvQBPZQnzCqOI1MgZu93q9gwEJjEajwxhjLcuyeRkzIFF0XkfSPXzOyTj4zzA4i8SI6HcA/d6kaXpC8KdJD22G9hvtG9oCz7GIo8RqfB2Px0kQItckQM6DgIH1gQqeQ84v5FznUXBPYXiHcxbefxxppe5iJWqMWSC2ifaJc7QMD9HxDwa/WLcpEcuQ9xPtGeed4BfOSShjrK5iFoi90nyCbsYzPK+yvBIgfknbqq5ynjgaWO4pjtCYzLPfiC25rWKBSm058VFOVgA59ykPbUXwxC1zTkJWTFoj+BXJDwiMkXDhNEfpVG27yp70HImQGInyXAlprArwsaB4jptxB2P5BPZ57lijsaJ/81JaUCwwT4MFa1ux+ZGzTHnYX0+4cFgx2atAt4q1GguBu+W4tvfbGl0rPAZuP2K7uA4WC7ZssIsx2uPwsZ36+xDiN8iYMleFhZd2l+cMbcPHJMzEzKmsRxdjiC2RVk5k2Zl5EFOl9PckSc56HmKnUtz2dD1MJpNDxJVrYQR3MbHnkgfmqNrQuQyN98jbQbtD5uzJC7cM+Ju5MR6gZYHIIplEW+n3+0dZ2MDmy0OhX/ibv8p4PUo6m2gfA7IZhUAoZb/qfivb4dVir7FOFQ5S6iArUFUxArbAedqr9qt8quvg82h/o/+VINgdxQyrnm4LNPwf8ygt4VSZfl2n04CqJaX/UxjkMb7zC7gZ+YTeNvzPq0L7DNozukHq/AWfKbw8dTTLQQAAAABJRU5ErkJggg==
[image2]: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAAXCAYAAABEQGxzAAADtklEQVR4Xs1WPWhUQRB+RyKoiCgaxbvL7Xt3hxAipDgUBG3EQkGsBe0stEhloWilhYVgFbQJEVEQEexCQDBISolFLAyKGEhASRFEFAxqIOc3t7N5s/P2nTHcoR8M73a++dmdnTfvouifoKAVAc16EPAKqAQcq58pspqNIT/DBuEHWn/YsGWq1fxG86wPbeLFcbxD6wjaRa7hc8IYcxfyDnKv0WhsEnQGpVJpV8QhXJxisbg1tbBArH1O2MdDrVbb0zYXgu6G8yykqWRM2xLq9fp2cCOQTzjULTzPQ55DvlYqlVPantEbiE+yII0Qb7PiVyVPkLyidP1bSZ9C5svlcilg0YMNX0bS9+DrPhVF4M5REjwHfSaNAu4Ib+amMMgA/Fljb77Z399/QO+0gtuD/rRS+xA3NUGV0jwdhhIkSWI0R4B+L/i3kDtRphYW4C7xgU5KvTY2tgOGsfEm9nJd0a3CQKpa7wGOFygZDI9rjm6ENzKeptfbaMV4AJtvONyQ5vjAc7JgemjQGvwAZJYUVBzKC/sz0hC6R2IdBhmRs2s3AWrFMcgqDQJJ6KPZA1W+oygNqSdwu62YQLvJOMa22xStKQ7tCc9nzpY6CTc349aRrosDHJfpilONrRhdOQUNbcTCxsNEKsPmI+QzZEAZUXx6P2lzmVaRO0K+afl+UCHJz5lxJ00EzyFVvOnQVJlkzut7HZBalZO/wu+dmsfNzfE7kXk/JeD/Wh4a65ecP+E1dZItbuBMEWupL8lpXuq5BRaYy1RdgpKw3YjVpNlsnAq1mx61GcBmqq+vb5tYD3PcYV7PhN5zgUKEKz6IhNQOVzRrbAs1ZZIQDLcGffQChXPfoUVNSNDNBsaxNxxMzhT2wH25Qi+u5gzfkG2jMOiwvOElzRESO+GIn9ScBOyGzFonpGWB7jD7v4BcWyOY/ElktVrdT2tKVrHfj8dY9nrGUXrlcsLJG4D/IfBf4ji5imWPoNZgvO9P4P4sCijafa10MNwBNHyshuNwYBrPW2iNjV6kNa76qHOWoP9O4N9Axp2PBPRL5J///6rg/oEs+hPOP1iSxK0Ps6cUMDwcMu0G5W3ID+7Hh3h3PuB5jLjc2kWtg09zwCd4jkJ+QZbpv522JRjbJq1ukBKrL3+OHXWLB+gSyJzWEwo1tBvIUQS/EapszsEKsI/JjwTVHgz5dgN2P3bq/gX8Mds5dCvuH9G9dHmR8/QW7dkuwCXsVOL8OLmMT+SadQydyhcuXZt4YSqs/R/gdvYbnFMROAr4wSIAAAAASUVORK5CYII=
[image3]: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFgAAAAZCAYAAAC1ken9AAAE1ElEQVR4Xu2Yz4scRRTHZ1gFfxIE1zX7o2tnVl0wgsHFH4eQkxFBxUOUCHryYP4AITmLNwWRPQZFchAxetBDjAcR8ZCLoggRRRNIJJrDokFhc0hM4vc7VTX9+nVVd9VML4LmA4/tevXqW69eV1f3bK9XoV9tXiOR5LolB/5H6Wr9QqcrSU/Xepqu9Nt0fL/92xbdAalTVBOrE/OnUh0/udrkIzMJTNQfDAa7tdMSiK7TX15efsUYc6goimfn5uZu1gGJSJ1HcX2DDmgD63gM456WvpXhcBt8O5NWokAuL9t8THRdwQ2AQW/A/oBdhl3Fgg5W4hLh5LDPRftd6sH2yjhJaKGY/x3Yp76N8a+6vPbIuDpVNYxZd/NL+7YSlADzh53z7cXFxRsLY97CDXxIxun5x+COPozknxkOhxhnzkxR4E0IvOjbKysrS/D9DDsLG8jYJhD7O4vBhbC9tLT0INoXYB+ieZ0Kj8J1YMxFV1huoCfgntFxbWDcd7omKO4c/O/12vKRNceA7aZS4MgdieAWclU+zmg/T5/XTFFE/DGO6bnkMXYX2pdgR3OOCs6J+MPan4KqyyZ0fir9fWrfVubTsKrmAueBsb/CLihfpcCWhoQcMgJnHncib9xzwj2iSSm/wGE1zH3OrYFH1CgIuvtC+TSSX+BwQh73GP0AO4Hj4g7d3waOhvuQy0tcHOx12dc8s8UdEadg6zwC8fckbFPHtYGjcxvGfeDyoG1C74WmLII9JlrgYHgrboG887t0XwoY94ux5/cxvid0f0k4Pzf/+bJtdqC9MRi/nMLjQszPz980WsuowAWfpo91DPGKQWUMjBQ4HyzC8E4b+2KZCrzs7oLOb7Aja2tr1+v+HIz9suAOXJP+YEEciP9E3KgZU744855ME93BebhH6jO+/XXfJPBFAr2j2ABXcP247s9BPFVP6b4QLDzir9gjwbKwsLDI9VHHn8NNN2hMVwU29nv4lG/Pzs7eQpMxOiHZxvx78ATcL1ws8mG3a9alvwljd9o30lctsM6iDvNG/Gk8RQult+/9Wfk0FpipYGfew8XrPkEf/QdQjDulE5pfyR2D4u3WBfS4HJg4P9NG8FeTKXfMfu9v0iFOZ0O4+sb++Kl8lzfpFPZz7HucwbfrPvgvyXxacYsLFpig7zIP+V7k49rYXzw4dwvuYGHFX+LM4yK58HEBJfxx4fo3/A7j7kH7NOxsURamUYeg74TceQP3VYOivNkrt29Ap7Kz2c+jaZ90Ov8G1rVD+ev4xyZgZ2DbfRyuj3MyUawKgfHevpBHBNp/wv7Wx4YH+k8yBn8/MvYmUeOkjqvrlIXhlTsrj1MHBXrf6RwZBznqOlUwdpk6sB9hb8POwy721J0I0h5RZXV19dZYgXPgCzC2IMKvBSziNdghrO+RByJfD206PfvWH+nwp7vu9MR0RH1mePxRh8dd7J89U1PYt2nwiEiFxRtgR+kdF6cf7KcOd6b25zKJTiifOmlRYwb22/br0pMp4IDGXizoy/p43W6m1CnJU7CEdDST6GaD3XvvtB/6BC+eu+1V6g4ukXGlznTUdVKz+RfpJsWYSsw/PVunHEFPqNtVmnv/P3RWh86EHLl6sfiYP53pFYKkyqbG1bEj4+PjPVvJ1s36DxMkUNxa70r+AAAAAElFTkSuQmCC

