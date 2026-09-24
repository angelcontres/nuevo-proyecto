# Flujo de Trabajo Git - GitFlow Lite

Este proyecto utiliza un modelo estandarizado **GitFlow Lite (Develop-centric)**, optimizado para equipos ágiles con entregas rápidas y sin la sobrecarga de múltiples ramas intermedias.

---

## 1. Topología de Ramas

```mermaid
gitGraph
   commit id: "init"
   commit id: "base-project"
   branch feature/US-01-auth
   checkout feature/US-01-auth
   commit id: "feat: jwt login"
   commit id: "feat: user entity"
   checkout develop
   merge feature/US-01-auth id: "merge US-01"
   branch feature/US-07-chat
   checkout feature/US-07-chat
   commit id: "feat: websocket handler"
   checkout develop
   merge feature/US-07-chat id: "merge US-07"
   branch fix/cors-policy
   checkout fix/cors-policy
   commit id: "fix: allow origin 3000"
   checkout develop
   merge fix/cors-policy id: "merge fix"
```

### Ramas Principales:
* **`develop` (Rama Principal / Default):**
  - Es la rama troncal y predeterminada del repositorio en GitHub.
  - Contiene el código fuente integrado y en estado funcional permanente.
  - **Regla:** Ningún integrante debe hacer push directo sin revisión (vía Pull Request o merge controlado).

### Ramas Secundarias (Corta duración):
* **`feature/<nombre-o-id>`:** Para desarrollo de nuevas funcionalidades o historias de usuario del backlog.
  - *Ejemplos:* `feature/US-01-auth`, `feature/US-05-feed-cypher`, `feature/tailwind-ui`.
* **`fix/<descripcion>`:** Para corrección de bugs o defectos detectados en `develop`.
  - *Ejemplos:* `fix/cors-websocket`, `fix/minio-upload-limit`.
* **`docs/<descripcion>`:** Para actualización exclusiva de especificaciones o diagramas.
  - *Ejemplos:* `docs/c4-model-update`, `docs/readme-instructions`.
* **`refactor/<descripcion>`:** Para mejoras estructurales de código sin alterar funcionalidades.

---

## 2. Ciclo de Vida del Trabajo Paso a Paso

### Paso 1: Actualizar `develop` local
Siempre asegúrate de tener la última versión de la rama principal antes de empezar:
```bash
git checkout develop
git pull origin develop
```

### Paso 2: Crear tu rama de trabajo
Crea tu rama a partir de `develop` siguiendo el estándar de nomenclatura:
```bash
git checkout -b feature/US-01-registro-usuario
```

### Paso 3: Realizar cambios con Conventional Commits
Usa mensajes atómicos y descriptivos siguiendo la convención:
- `feat:` Nueva funcionalidad para el usuario.
- `fix:` Corrección de un error.
- `docs:` Cambios solo en documentación.
- `refactor:` Reestructuración de código sin cambiar comportamiento.
- `chore:` Tareas de configuración, dependencias o tooling.
- `test:` Inclusión o ajuste de pruebas automatizadas.

```bash
git add .
git commit -m "feat(auth): implement JWT token generation in Quarkus"
```

### Paso 4: Publicar tu rama en GitHub
```bash
git push -u origin feature/US-01-registro-usuario
```

### Paso 5: Abrir un Pull Request (PR) hacia `develop`
1. Ve a GitHub y abre un Pull Request dirigido a la rama base `develop`.
2. Completa la plantilla del PR (descripción, tareas completadas y capturas de prueba).
3. Solicita revisión a tus compañeros de equipo (**Paulo, Carlos o Angel**).

### Paso 6: Fusión e Integración
Una vez aprobado el PR:
1. Se fusiona hacia `develop`.
2. Se elimina la rama `feature` en remoto y en local para mantener el repositorio limpio:
   ```bash
   git checkout develop
   git pull origin develop
   git branch -d feature/US-01-registro-usuario
   ```

---

## 3. Resumen de Comandos Rápidos

| Acción | Comando |
| :--- | :--- |
| Iniciar nueva tarea | `git checkout develop && git pull && git checkout -b feature/<nombre>` |
| Guardar avance | `git add . && git commit -m "feat(<modulo>): <descripcion>"` |
| Subir a GitHub | `git push -u origin feature/<nombre>` |
| Sincronizar cambios de develop en mi rama | `git checkout feature/<nombre> && git merge develop` |
| Volver a develop actualizado | `git checkout develop && git pull origin develop` |
