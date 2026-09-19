import { defineRailway, postgres, preserve, project, service } from "railway/iac";

export default defineRailway(() => {
  const database = postgres("Postgres");
  const nangsoul_web = service("nangsoul-web", {
    build: "npm run build",
    start: "npm run start",
    healthcheck: "/api/health",
    healthcheckTimeout: 120,
    preDeploy: "npm run db:migrate",
    env: {
      DATABASE_URL: database.env.DATABASE_URL,
      MEMORIAL_ADMIN_PASSWORD: preserve(),
      MEMORIAL_ADMIN_SESSION_SECRET: preserve(),
      MEMORIAL_PUBLIC_ORIGIN: preserve(),
      MEMORIAL_RATE_LIMIT_SALT: preserve(),
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: preserve(),
      RAILPACK_NODE_VERSION: preserve(),
      TURNSTILE_SECRET_KEY: preserve(),
    },
  });
  return project("nangsoul-memorial", {
    resources: [database, nangsoul_web],
  });
});
