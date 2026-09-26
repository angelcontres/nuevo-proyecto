# Tasks: US-02 — Seguir, dejar de seguir y consultar red social [BACK]

- [ ] Crear `GestionarGrafoSocialUseCase` y `UserGraphResource`.
- [ ] Cypher: `MERGE (a:Usuario {id: $u1})-[:SIGUE]->(b:Usuario {id: $u2})`.
- [ ] Cypher: `MATCH (a)-[r:SIGUE]->(b) DELETE r`.

## Verificación
- [ ] Validar con la compilación estricta.
- [ ] Asegurar conexión exitosa con la capa opuesta (pruebas manuales locales).
