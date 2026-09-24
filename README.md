```typescript
Desarrollado por:

- Paulo Orrala
- Carlos Patiño
- Angel Villon
```
```
```

# **Product Backlog & Planificación de Sistema \- Red Social**

Este documento consolida el análisis de requerimientos, la estimación consensuada en Story Points (Planning Poker), el plan de Sprints y los criterios de aceptación en formato BDD/Gherkin para el desarrollo de la plataforma.

## **1\. Resumen de Estimación y Consenso de Esfuerzo**

Se aplica la secuencia estándar de Fibonacci (![][image1]) para consolidar las votaciones de dificultad emitidas por el equipo de desarrollo:

| Req. Original | ID | Historia de Usuario | Votos Registrados | Consenso Final (SP) | Justificación Técnica |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **11** | **US-01** | Registro y Autenticación | \[1\] | **1 SP** | Hash seguro de contraseñas, validación de correo y persistencia básica de sesión (JWT). |
| **5, 6** | **US-02** | Creación y Perfil de Usuario | \[1\]\[2\], \[1\] | **2 SP** | CRUD de usuario, validaciones de campos y subida/almacenamiento de multimedia (avatar). |
| **3, 8** | **US-03** | Publicaciones (Texto \+ Imagen) | \[2\], \[2\]\[3\] | **3 SP** | Formulario multipart, compresión/subida a CDN/S3 y relación de autoría con publicaciones. |
| **4** | **US-04** | Interacciones (Likes y Comentarios) | \[3\]\[ \]\[ \] | **3 SP** | Manejo de integridad referencial, restricción única (user\_id, post\_id) para likes y árbol de comentarios. |
| **7, 10** | **US-05** | Feed con Scroll Infinito (Últimas 2 sem.) | \[4\]\[4\]\[5\], \[3\] | **5 SP** | Filtrado temporal indexado (created\_at \>= NOW() \- 14d), paginación por cursor y scroll infinito frontend. |
| **2** | **US-06** | Mensajería Directa 1 a 1 | \[4\] ![][image2] Fib. | **5 SP** | Arquitectura bidireccional (WebSockets), persistencia de historial de chat y estado de mensajes. |
| **1** | **US-07** | Notificaciones en Tiempo Real | \[3\]\[5\]\[5\] | **5 SP** | Arquitectura reactiva / bus de eventos para emitir alertas push/in-app ante interacciones y perfil. |

**Carga Total del Proyecto:** **24 Story Points (SP)**

## **2\. Planificación de Sprints (Roadmap Incremental)**

Suponiendo una velocidad sostenida de **6 a 8 Story Points por Sprint**:

\[ Sprint 1 (3 SP) \] ──► \[ Sprint 2 (6 SP) \] ──► \[ Sprint 3 (5 SP) \] ──► \[ Sprint 4 (10 SP / 2 Sprints) \]  
  Auth & Perfiles         Posts & Feedback        Feed & Scroll 14d         Chat 1a1 & Notificaciones

### **Sprint 1: Autenticación e Identidad Base (3 SP)**

* **Objetivo:** Disponer del entorno funcional, modelo de usuarios y control de sesiones.  
* **Historias:**  
  * **US-01:** Registro y Autenticación de Usuarios (1 SP)  
  * **US-02:** Configuración y Personalización de Perfil (2 SP)

### **Sprint 2: Motor de Contenido e Interacción (6 SP)**

* **Objetivo:** Permitir que los usuarios generen contenido multimedia y reaccionen entre sí.  
* **Historias:**  
  * **US-03:** Creación de Publicaciones con Texto e Imágenes (3 SP)  
  * **US-04:** Reacciones y Comentarios en Publicaciones (3 SP)

### **Sprint 3: Consumo y Optimización de Contenido (5 SP)**

* **Objetivo:** Brindar una experiencia fluida de lectura con limitación temporal y rendimiento optimizado.  
* **Historias:**  
  * **US-05:** Feed con Scroll Infinito y ventana de 14 días (5 SP)

### **Sprint 4: Comunicación en Tiempo Real (10 SP)**

*(Nota: Si se busca mantener estrictamente un máximo de 8 SP, puede dividirse en Sprint 4 para Chat y Sprint 5 para Notificaciones).*

* **Objetivo:** Conectar a los usuarios mediante mensajería directa y notificaciones reactivas instantáneas.  
* **Historias:**  
  * **US-06:** Mensajería Directa 1 a 1 (5 SP)  
  * **US-07:** Notificaciones en Vivo por Interacción (5 SP)

## **3\. Product Backlog Detallado**

### **US-01: Registro de Usuarios y Autenticación**

* **Descripción:** Como nuevo visitante, quiero registrarme en la plataforma con mi correo y una contraseña segura, para tener una cuenta propia en la red social.  
* **Prioridad MoSCoW:** Must Have  
* **Estimación:** 1 SP  
* **Criterios de Aceptación:**  
  1. El formulario valida formato válido de correo electrónico y contraseña de mínimo 8 caracteres.  
  2. No se permite duplicidad de correos en la base de datos (retorna HTTP 409 Conflict).  
  3. La contraseña se almacena encriptada utilizando algoritmos seguros (bcrypt o argon2).  
  4. Al completar el registro con éxito, el sistema emite el token de sesión y redirige al setup de perfil.

### **US-02: Creación y Configuración del Perfil**

* **Descripción:** Como usuario registrado, quiero editar mi información básica (nombre, bio y foto de perfil), para que otros miembros me reconozcan en la red.  
* **Prioridad MoSCoW:** Must Have  
* **Estimación:** 2 SP  
* **Criterios de Aceptación:**  
  1. Permite actualizar nombre visible, biografía corta y avatar.  
  2. La imagen se valida para formatos .jpg, .png y .webp con un peso máximo de 5MB.  
  3. La imagen se sube a un bucket/servicio cloud y se almacena únicamente la URL pública optimizada en BD.  
  4. Los datos actualizados se reflejan inmediatamente en la vista pública del perfil.

### **US-03: Creación de Publicaciones con Texto e Imágenes**

* **Descripción:** Como usuario activo, quiero crear publicaciones que incluyan texto y fotos, para compartir experiencias con otros usuarios.  
* **Prioridad MoSCoW:** Must Have  
* **Estimación:** 3 SP  
* **Criterios de Aceptación:**  
  1. Permite publicar solo texto, solo imagen o combinación de ambos.  
  2. El texto admite hasta un límite definido (ej. 1,000 caracteres) y valida que no se envíen posts vacíos.  
  3. Soporta subida múltiple de imágenes (hasta 4 por publicación) con redimensionamiento previo a la persistencia.  
  4. La publicación se asocia inequívocamente al user\_id de la sesión activa con marca de tiempo created\_at.

### **US-04: Reacciones y Comentarios**

* **Descripción:** Como usuario, quiero reaccionar ("Me gusta") y comentar las publicaciones de otros miembros, para interactuar activamente con la comunidad.  
* **Prioridad MoSCoW:** Should Have  
* **Estimación:** 3 SP  
* **Criterios de Aceptación:**  
  1. La reacción de "Me gusta" funciona como un toggle (dar y retirar like).  
  2. Restricción única en BD que impide a un usuario registrar más de un like simultáneo en un mismo post.  
  3. Los comentarios permiten texto plano, se persisten con fecha y se listan bajo el post correspondiente.  
  4. Los contadores totales de likes y comentarios se calculan de manera atómica o indexada.

### **US-05: Feed con Scroll Infinito (Ventana Temporal de 14 Días)**

* **Descripción:** Como usuario, quiero ver un feed cronológico con scroll infinito que contenga únicamente posts de las últimas 2 semanas, para mantenerme actualizado con contenido relevante y vigente.  
* **Prioridad MoSCoW:** Must Have  
* **Estimación:** 5 SP

#### **Criterios de Aceptación (Gherkin):**

Característica: Feed de publicaciones con ventana temporal de 14 días y scroll infinito

  Escenario: Carga inicial exitosa de publicaciones recientes  
    Dado que el usuario autenticado ingresa a la vista principal del feed  
    Y existen publicaciones creadas dentro de los últimos 14 días  
    Cuando la vista carga completamente  
    Entonces el sistema debe mostrar un lote inicial de 10 publicaciones  
    Y las publicaciones deben estar ordenadas cronológicamente de forma descendente (más recientes primero)  
    Y no debe mostrarse ninguna publicación con fecha de creación mayor a 14 días respecto al momento actual.

  Escenario: Carga incremental mediante scroll infinito (Cursor-based pagination)  
    Dado que el usuario ha visualizado el primer lote de 10 publicaciones  
    Cuando el usuario hace scroll y alcanza el 80% de la altura visible de la página  
    Entonces el cliente solicita el siguiente lote enviando como cursor la fecha/ID del último elemento cargado  
    Y el backend responde con el siguiente bloque de hasta 10 publicaciones  
    Y los nuevos elementos se anexan al final de la lista sin recargar la página ni perder la posición de scroll actual.

  Escenario: Fin del contenido dentro de la ventana de 14 días  
    Dado que el usuario ha hecho scroll continuo a través de todas las publicaciones disponibles  
    Cuando no existan más registros cuya fecha de creación esté dentro de los últimos 14 días  
    Entonces la petición de paginación retorna un resultado vacío  
    Y el cliente deja de emitir peticiones adicionales por scroll  
    Y se muestra un mensaje informativo indicando: "Estás al día. No hay más publicaciones recientes".

  Escenario: Feed sin actividad reciente  
    Dado que no existen publicaciones registradas en los últimos 14 días  
    Cuando el usuario ingresa al feed principal  
    Entonces el sistema debe mostrar un estado vacío (empty state)  
    Y debe mostrar un botón interactivo que invite a crear la primera publicación.

### **US-06: Mensajería Directa 1 a 1 en Tiempo Real**

* **Descripción:** Como usuario, quiero intercambiar mensajes de texto directos con otro usuario en tiempo real, para sostener conversaciones privadas.  
* **Prioridad MoSCoW:** Could Have  
* **Estimación:** 5 SP

#### **Criterios de Aceptación (Gherkin):**

Característica: Chat privado uno a uno mediante WebSockets

  Escenario: Envío y recepción de mensaje en tiempo real con ambos usuarios en línea  
    Dado que el "Usuario A" y el "Usuario B" tienen una sesión activa y el WebSocket conectado  
    Y el "Usuario B" se encuentra dentro del chat con el "Usuario A"  
    Cuando el "Usuario A" escribe "Hola, ¿cómo estás?" y presiona enviar  
    Entonces el mensaje se persiste en la base de datos con estado "entregado"  
    Y el servidor emite el evento WebSocket hacia el canal privado del "Usuario B"  
    Y el mensaje aparece en la pantalla del "Usuario B" con una latencia menor a 500 ms sin recargar la página.

  Escenario: Envío de mensaje a un destinatario desconectado (Offline)  
    Dado que el "Usuario B" no tiene una sesión activa (desconectado)  
    Cuando el "Usuario A" envía el mensaje "Quedo atento a tu respuesta"  
    Entonces el sistema persiste el mensaje en la base de datos con estado "pendiente"  
    Y confirma al "Usuario A" mediante un indicador visual que el mensaje fue recibido por el servidor  
    Y cuando el "Usuario B" inicie sesión posteriormente, el mensaje se listará en su historial de conversación.

  Escenario: Carga paginada de historial de conversación previa  
    Dado que dos usuarios tienen un historial acumulado de 80 mensajes  
    Cuando el "Usuario A" abre la conversación con el "Usuario B"  
    Entonces el sistema carga inicialmente los últimos 20 mensajes de la conversación  
    Y al hacer scroll hacia el extremo superior del chat, se solicitan los 20 mensajes anteriores de forma incremental.

  Escenario: Reconexión ante pérdida temporal de conectividad  
    Dado que el "Usuario A" sufre una desconexión de red mientras tiene el chat activo  
    Cuando intenta presionar enviar sobre un nuevo mensaje  
    Entonces el cliente muestra un indicador visual de reintento/error junto al mensaje  
    Y al restablecerse la red, el socket se reconecta automáticamente y despacha el mensaje en cola.

### **US-07: Notificaciones de Interacción en Tiempo Real**

* **Descripción:** Como autor de contenido o dueño de un perfil, quiero recibir avisos inmediatos cuando otros usuarios interactúen con mis publicaciones o perfil, para mantenerme al tanto de la actividad de mi comunidad.  
* **Prioridad MoSCoW:** Could Have  
* **Estimación:** 5 SP

#### **Criterios de Aceptación (Gherkin):**

Característica: Sistema reactivo de notificaciones push/in-app por eventos

  Escenario: Notificación instantánea por nuevo "Me gusta"  
    Dado que el "Usuario B" está navegando en la plataforma con sesión activa  
    Cuando el "Usuario A" da "Me gusta" a una publicación creada por el "Usuario B"  
    Entonces el backend dispara un evento de dominio "PostLikedEvent"  
    Y el servicio de notificaciones persiste el registro con el campo "is\_read \= false"  
    Y el "Usuario B" recibe una alerta flotante (toast) y se incrementa en 1 su contador de notificaciones no leídas en la barra de navegación.

  Escenario: Prevención de auto-notificación  
    Dado que el "Usuario A" interactúa comentando o reaccionando en su propia publicación  
    Cuando la acción se procesa y persiste exitosamente  
    Entonces el sistema no debe generar ninguna notificación ni evento hacia el propio "Usuario A".

  Escenario: Visualización y marcado de notificaciones como leídas  
    Dado que el usuario tiene 3 notificaciones no leídas marcadas en la campana de alertas  
    Cuando hace clic sobre el panel de notificaciones  
    Entonces se despliega el listado con las 3 alertas destacadas visualmente  
    Y al hacer clic sobre una notificación particular, el sistema actualiza su estado a "is\_read \= true"  
    Y el contador se decrementa automáticamente en 1  
    Y el sistema redirige al usuario mediante un deep link hacia la publicación o comentario correspondiente.

  Escenario: Agrupación de notificaciones masivas concurrentes (Debounce / Agregación)  
    Dado que 5 usuarios distintos reaccionan a una misma publicación del "Usuario B" en un intervalo menor a 60 segundos  
    Cuando el backend procesa los eventos  
    Entonces el centro de notificaciones debe agrupar los mensajes mostrando: "A \[Usuario X\], \[Usuario Y\] y a 3 personas más les gustó tu publicación"  
    Y evita enviar 5 notificaciones independientes consecutivas.

## **4\. Consideraciones Técnicas de Implementación**

1. **Estrategia para el Feed (US-05):**  
   * Indexar la columna de fecha en la tabla de publicaciones: CREATE INDEX idx\_posts\_created\_at ON posts (created\_at DESC);  
   * Consulta backend con paginación por cursor:  
     SELECT id, user\_id, content, media\_urls, created\_at  
     FROM posts  
     WHERE created\_at \>= NOW() \- INTERVAL '14 days'  
       AND created\_at \< :last\_seen\_cursor  
     ORDER BY created\_at DESC  
     LIMIT 10;

2. **Infraestructura WebSocket (US-06 y US-07):**  
   * Emplear canales dedicados autenticados por token JWT en el *handshake* inicial.  
   * Canales de chat: /user/{user\_id}/queue/messages  
   * Canales de notificaciones: /user/{user\_id}/queue/notifications

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFgAAAAZCAYAAAC1ken9AAAE1ElEQVR4Xu2Yz4scRRTHZ1gFfxIE1zX7o2tnVl0wgsHFH4eQkxFBxUOUCHryYP4AITmLNwWRPQZFchAxetBDjAcR8ZCLoggRRRNIJJrDokFhc0hM4vc7VTX9+nVVd9VML4LmA4/tevXqW69eV1f3bK9XoV9tXiOR5LolB/5H6Wr9QqcrSU/Xepqu9Nt0fL/92xbdAalTVBOrE/OnUh0/udrkIzMJTNQfDAa7tdMSiK7TX15efsUYc6goimfn5uZu1gGJSJ1HcX2DDmgD63gM456WvpXhcBt8O5NWokAuL9t8THRdwQ2AQW/A/oBdhl3Fgg5W4hLh5LDPRftd6sH2yjhJaKGY/x3Yp76N8a+6vPbIuDpVNYxZd/NL+7YSlADzh53z7cXFxRsLY97CDXxIxun5x+COPozknxkOhxhnzkxR4E0IvOjbKysrS/D9DDsLG8jYJhD7O4vBhbC9tLT0INoXYB+ieZ0Kj8J1YMxFV1huoCfgntFxbWDcd7omKO4c/O/12vKRNceA7aZS4MgdieAWclU+zmg/T5/XTFFE/DGO6bnkMXYX2pdgR3OOCs6J+MPan4KqyyZ0fir9fWrfVubTsKrmAueBsb/CLihfpcCWhoQcMgJnHncib9xzwj2iSSm/wGE1zH3OrYFH1CgIuvtC+TSSX+BwQh73GP0AO4Hj4g7d3waOhvuQy0tcHOx12dc8s8UdEadg6zwC8fckbFPHtYGjcxvGfeDyoG1C74WmLII9JlrgYHgrboG887t0XwoY94ux5/cxvid0f0k4Pzf/+bJtdqC9MRi/nMLjQszPz980WsuowAWfpo91DPGKQWUMjBQ4HyzC8E4b+2KZCrzs7oLOb7Aja2tr1+v+HIz9suAOXJP+YEEciP9E3KgZU744855ME93BebhH6jO+/XXfJPBFAr2j2ABXcP247s9BPFVP6b4QLDzir9gjwbKwsLDI9VHHn8NNN2hMVwU29nv4lG/Pzs7eQpMxOiHZxvx78ATcL1ws8mG3a9alvwljd9o30lctsM6iDvNG/Gk8RQult+/9Wfk0FpipYGfew8XrPkEf/QdQjDulE5pfyR2D4u3WBfS4HJg4P9NG8FeTKXfMfu9v0iFOZ0O4+sb++Kl8lzfpFPZz7HucwbfrPvgvyXxacYsLFpig7zIP+V7k49rYXzw4dwvuYGHFX+LM4yK58HEBJfxx4fo3/A7j7kH7NOxsURamUYeg74TceQP3VYOivNkrt29Ap7Kz2c+jaZ90Ov8G1rVD+ev4xyZgZ2DbfRyuj3MyUawKgfHevpBHBNp/wv7Wx4YH+k8yBn8/MvYmUeOkjqvrlIXhlTsrj1MHBXrf6RwZBznqOlUwdpk6sB9hb8POwy721J0I0h5RZXV19dZYgXPgCzC2IMKvBSziNdghrO+RByJfD206PfvWH+nwp7vu9MR0RH1mePxRh8dd7J89U1PYt2nwiEiFxRtgR+kdF6cf7KcOd6b25zKJTiifOmlRYwb22/br0pMp4IDGXizoy/p43W6m1CnJU7CEdDST6GaD3XvvtB/6BC+eu+1V6g4ukXGlznTUdVKz+RfpJsWYSsw/PVunHEFPqNtVmnv/P3RWh86EHLl6sfiYP53pFYKkyqbG1bEj4+PjPVvJ1s36DxMkUNxa70r+AAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAWCAYAAADNX8xBAAAA90lEQVR4Xp1RMQ7CMAxsByYGxFShtnHVL/QfDPyJLzD0LUwM7LyEnQlXbdL4HIeKk6I05/Pl4hbFRpRi96f4ywA2eEjDlMJAugETZezQICPNw0qQRqjjvaVqlQqsKioh2ISoz7wpASJ3Qu4vENEVOQDOSmeczl3XPdjsIlkBRYQnx1e0bXNmo1cQrX1ooP8aoqqqPZvd67puAsnDuzE58j7OOy6LpzevTzT8NfivJB5zIicT2cDhz/swDLspUd/3h6XggYnyufRfK7AFDfRTpzObPMm5Y6qukBOw0TLcny8wC4BI5x23tiKMREjYF1i8Agr9WSZYVV/zpx9sZC4EEQAAAABJRU5ErkJggg==>
