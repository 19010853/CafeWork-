# Docker Database Sharing

This project runs PostgreSQL in Docker for local development. The database is available on:

- Host: `localhost`
- Port: `5400`
- Database: `CafeWork`
- User: `postgres`
- Password: `postgres`

## Recommended Approach

Use versioned SQL seed files as the source of truth for sample data:

- `CafeWork.sql`
- `UpdateDBSeat.sql`

When another developer clones the repository and starts the database for the first time, Docker imports these files automatically through `/docker-entrypoint-initdb.d`.

```bash
docker compose up -d cafework-postgres
bash scripts/dev.sh
```

Then open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8081/api/cafes`

## Where The Data Lives

The PostgreSQL container runs the database engine, but the actual database files are stored in a Docker volume:

```text
cafework-_cafework_pgdata
```

That volume is local to each developer's machine. It does not travel with the repository, and it is not included when someone pulls the `postgres:17` Docker image.

Important: PostgreSQL only runs the SQL files in `/docker-entrypoint-initdb.d` when the data volume is empty. If the volume already exists, Docker starts PostgreSQL with the existing data and skips the init SQL files.

## Reset And Re-import Seed Data

Use this when you want to rebuild the local database from `CafeWork.sql` and `UpdateDBSeat.sql`.

```bash
docker compose down -v
docker compose up -d cafework-postgres
```

This deletes the local Docker volume for this Compose project, then creates a fresh one and imports the SQL files again.

## Verify The Import

```bash
docker exec cafework-postgres psql -U postgres -d CafeWork -c "\dt"
docker exec cafework-postgres psql -U postgres -d CafeWork -c "select count(*) from cafes;"
docker exec cafework-postgres psql -U postgres -d CafeWork -c "select count(*) from seats;"
```

Expected sample counts currently:

- `cafes`: `10`
- `seats`: `300`

## Sharing Updated Development Data

If you changed data while using the app and want another developer to get the same state, export a new dump from the running Docker database:

```bash
docker exec cafework-postgres pg_dump -U postgres -d CafeWork > CafeWork.latest.sql
```

Then share that dump with the team. For small sample data, it can be committed after review. For large or sensitive data, do not commit it to the repository; share it through a private storage location instead.

To restore from a shared dump, reset the volume first, then import the dump:

```bash
docker compose down -v
docker compose up -d cafework-postgres
docker exec -i cafework-postgres psql -U postgres -d CafeWork < CafeWork.latest.sql
```

If the dump already contains schema and data, use it instead of the default seed files or make sure the target database is empty before restoring.

## Should We Use A Docker Image For The Data?

Not as the main approach.

Docker images are good for packaging runtime environments, services, and application code. They are not a good source of truth for PostgreSQL data that changes during development, because the live database state is stored in Docker volumes.

If you build a custom PostgreSQL image, it should only package seed SQL files into `/docker-entrypoint-initdb.d`. Even then, those files are imported only when the volume is created for the first time.

Use this priority order:

1. Keep stable sample data as SQL files in the repository.
2. Use `pg_dump` files for shared development snapshots.
3. Use private storage for large, production-like, or sensitive dumps.
4. Avoid treating Docker images as portable database volumes.

## Common Commands

Start the database:

```bash
docker compose up -d cafework-postgres
```

Start the full local app:

```bash
bash scripts/dev.sh
```

Stop the database:

```bash
docker compose down
```

Reset and re-import the database:

```bash
docker compose down -v
docker compose up -d cafework-postgres
```
