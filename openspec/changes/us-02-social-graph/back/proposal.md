# Proposal: US-02 (TUX-53) — Seguir, dejar de seguir y consultar red social [BACK]

**Change**: `2026-09-26-us-02-social-graph`
**Ticket**: TUX-53 (US-02)
**Layer**: back

## Intent

Este change aborda la parte de **back** de la historia US-02. Aunque el desarrollador lo trabaje de forma fullstack, este documento aísla los requerimientos de la capa para respetar la arquitectura.

Implementar endpoints para crear y eliminar relaciones `[:SIGUE]` entre nodos `(:Usuario)` en Neo4j.
