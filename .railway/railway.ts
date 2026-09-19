import { defineRailway, preserve, project, service } from "railway/iac";

// Last resort for a per-service CaC repo. Prefer one .railway file for the
// project and drop this if you later combine services into that file.
export const partial = "nangsoul-web";

export default defineRailway(() => {
  const nangsoul_web = service("nangsoul-web", {
    build: "npm run build",
    start: "npm run start",
    healthcheck: "/api/health",
    healthcheckTimeout: 120,
    preDeploy: "npm run db:migrate",
    env: {
      DATABASE_URL: preserve(),
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
    resources: [nangsoul_web],
  });
});
