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
DB_URL=jdbc:postgresql://<railway-postgres-host>:<railway-postgres-port>/<railway-postgres-db>?sslmode=require&stringtype=unspecified
DB_USERNAME=<railway-postgres-user>
DB_PASSWORD=<railway-postgres-password>
MAIL_USERNAME=<smtp-user>
MAIL_PASSWORD=<smtp-app-password>
APP_CORS_ALLOWED_ORIGINS=https://<vercel-frontend-domain>
```

Do not set `SERVER_PORT` on Railway unless you need a local override. Railway provides `PORT`, and the app reads it automatically.

## 3. Import Database

Import the SQL files in this order:

```powershell
psql "<railway-postgres-url>" -f CafeWork.sql
psql "<railway-postgres-url>" -f UpdateDBSeat.sql
```

If `psql` is not installed locally, use Railway's database query console or install PostgreSQL client tools.

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
