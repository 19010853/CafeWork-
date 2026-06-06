# Railway Backend Deploy

This guide connects the Vercel frontend to a public Spring Boot backend on Railway.

## 1. Create Railway Services

1. Sign in to Railway with GitHub.
2. Create a new project from the forked repository: `19010853/CafeWork-`.
3. Create the backend service from the repository root so Railway uses the root `Dockerfile`.
4. Add a PostgreSQL service in the same Railway project.
5. In the backend service, generate a public domain. It will look like:

```text
https://<backend-service>.up.railway.app
```

The repository includes `railway.toml` to force Railway to build with the root `Dockerfile` and to use `/actuator/health/liveness` as the service healthcheck. The liveness endpoint only confirms that the app process has started; database connectivity is checked separately through readiness or API requests. In the deployment logs, the build should show Dockerfile steps such as:

```text
[internal] load build definition from Dockerfile
```

If Railway logs a command like `mvn ... -Pproduction`, the service is still using Railpack/buildpack settings or an old deployment. Check the service source branch and redeploy the latest `Bamia-Update` commit.

## 2. Backend Variables

Set these variables on the Railway backend service:

```env
DB_URL=jdbc:postgresql://<railway-postgres-host>:<railway-postgres-port>/<railway-postgres-db>?stringtype=unspecified
DB_USERNAME=<railway-postgres-user>
DB_PASSWORD=<railway-postgres-password>
MAIL_USERNAME=<smtp-user>
MAIL_PASSWORD=<smtp-app-password>
APP_CORS_ALLOWED_ORIGINS=https://cafe-work.vercel.app,https://*.vercel.app
```

`APP_CORS_ALLOWED_ORIGINS` supports comma-separated origin patterns. Keep `https://*.vercel.app` when you want Vercel preview deployments to call the Railway backend.

Use the PostgreSQL service values from Railway's `Connect` or `Variables` tab:

```text
PGHOST
PGPORT
PGDATABASE
PGUSER
PGPASSWORD
```

For a backend service in the same Railway project, prefer the private/internal host. For example:

```env
DB_URL=jdbc:postgresql://postgres.railway.internal:5432/railway?stringtype=unspecified
DB_USERNAME=<PGUSER>
DB_PASSWORD=<PGPASSWORD>
```

Only use `sslmode=require` when the URL points to Railway's public TCP proxy host:

```env
DB_URL=jdbc:postgresql://<public-host>:<public-port>/<database>?sslmode=require&stringtype=unspecified
```

Do not add Railway's suggested local variables. Remove these if they were added:

```env
SERVER_PORT=8081
DB_URL=jdbc:postgresql://localhost:5400/CafeWork?stringtype=unspecified
DB_USERNAME=postgres
DB_PASSWORD=postgres
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Railway provides `PORT`, and the app reads it automatically. The backend service should use Railway PostgreSQL variables, not local Docker PostgreSQL values.

## 3. Import Database

Import the SQL files in this order:

```powershell
psql "<railway-postgres-url>" -f CafeWork.sql
psql "<railway-postgres-url>" -f UpdateDBSeat.sql
```

If `psql` is not installed locally, use Railway's database query console or install PostgreSQL client tools.

Do not paste SQL into the backend service `CafeWork-` console. That console is a Linux shell inside the app container, so `select ...` will be interpreted as a bash command. Open the Railway PostgreSQL service instead, then use its query/data console or a `psql` connection string from the PostgreSQL service `Connect` tab.

If `/actuator/health/readiness` is `UP` but `/api/cafes` returns `500`, the database connection is alive but the schema or seed data may be incomplete. Check the Railway backend HTTP/deploy logs for `PSQLException`, `SQLGrammarException`, `relation ... does not exist`, or `column ... does not exist`, then verify the main tables:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

select count(*) from cafes;
select count(*) from cafe_images;
select count(*) from reviews;
select count(*) from seats;
```

`UpdateDBSeat.sql` is safe to run again for the seeded cafes; it inserts missing seats and skips existing cafe/seat-number pairs.

## 4. Update Vercel Frontend

In the Vercel project settings, update the frontend environment variable:

```env
VITE_API_BASE_URL=https://<backend-service>.up.railway.app/api
```

Redeploy the Vercel production deployment after changing this value.

## 5. Verify

Check that the backend process is live:

```text
https://<backend-service>.up.railway.app/actuator/health/liveness
```

After Railway PostgreSQL variables are set and the SQL files are imported, check database readiness and API data:

```text
https://<backend-service>.up.railway.app/actuator/health/readiness
https://<backend-service>.up.railway.app/api/cafes
```

Check the frontend browser console and Network tab. Requests should go to:

```text
https://<backend-service>.up.railway.app/api/...
```

They should no longer go to:

```text
http://localhost:8081/api/...
```

## Security Notes

- Do not commit `.env`, `.env.local`, `.env.production`, or `.vercel`.
- Rotate any SMTP app password or Vercel token that was copied into logs, screenshots, chats, or shared files.
