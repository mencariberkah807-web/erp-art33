# Database Foundation

PostgreSQL is the relational source of truth for the application.

Phase 00 establishes only the connection boundary and environment contract. Business schema, migrations, and seeds are introduced in the approved database phase.

Migration requirements:

- ordered and explicit files
- scoped to the approved phase
- reviewable before execution
- reversible where practical
- no silent data migration
