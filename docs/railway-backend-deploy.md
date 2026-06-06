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

Check the backend:

```text
https://<backend-service>.up.railway.app/actuator/health
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
