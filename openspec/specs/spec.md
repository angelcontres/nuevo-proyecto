# System Source of Truth

## Capabilities
1. **Authentication:** The system SHALL authenticate users using JWT and bcrypt-hashed passwords.
2. **Social Graph:** The system SHALL model all data using a property graph (Neo4j). Nodes: `Usuario`, `Post`. Relationships: `CREO`, `LIKE`, `COMENTO`.
3. **Media Storage:** The system SHALL store media assets in MinIO and persist only URLs in the graph.

## Gherkin Scenarios
*(Los escenarios estables se consolidan aquí una vez que un Proposal es archivado)*
