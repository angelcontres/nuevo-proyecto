# Design: Feed con Scroll Infinito

## Consulta Neo4j
```cypher
MATCH (u:Usuario)-[:CREO]->(p:Post)
WHERE p.createdAt >= datetime() - duration('P14D')
  AND p.createdAt < $cursor
RETURN p, u
ORDER BY p.createdAt DESC
LIMIT 10
```

## Frontend
Uso de `IntersectionObserver` o librería como `react-infinite-scroll-component` para disparar el fetch del siguiente lote.
