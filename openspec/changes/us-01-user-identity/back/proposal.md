# Proposal: US-01 (TUX-52) — Registro, sesión y perfil con avatar en MinIO [BACK]

**Change**: `2026-09-26-us-01-user-identity`
**Ticket**: TUX-52 (US-01)
**Layer**: back

## Intent

Este change aborda la parte de **back** de la historia US-01. Aunque el desarrollador lo trabaje de forma fullstack, este documento aísla los requerimientos de la capa para respetar la arquitectura.

Implementar JWT stateless, registro de usuario, subida de avatar a MinIO y persistencia en Neo4j.
