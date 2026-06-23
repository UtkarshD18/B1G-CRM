# Build Verification Report

**Date:** 2026-06-23  
**Status:** SUCCESS — Build & Containers Verified  

## 1. Backend & Container State
Docker compose was verified to verify that the backend and PostgreSQL database are running healthily.

### Command: `docker compose ps`
```
NAME                IMAGE                COMMAND                  SERVICE    CREATED          STATUS                    PORTS
b1gcrm-app-1        b1gcrm-app           "docker-entrypoint.s…"   app        26 minutes ago   Up 25 minutes (healthy)   0.0.0.0:3010->3010/tcp, [::]:3010->3010/tcp
b1gcrm-postgres-1   postgres:16-alpine   "docker-entrypoint.s…"   postgres   2 days ago       Up 3 hours (healthy)      0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp
```

### Command: `docker compose up -d`
```
[+] up 1/2
 ⠋ Container b1gcrm-postgres-1 Waiting                                      0.0s
 ✔ Container b1gcrm-app-1      Running                                      0.0s
 ⠙ Container b1gcrm-postgres-1 Waiting                                      0.1s
 ✔ Container b1gcrm-app-1      Running                                      0.0s
 ⠹ Container b1gcrm-postgres-1 Waiting                                      0.2s
 ✔ Container b1gcrm-app-1      Running                                      0.0s
 ⠸ Container b1gcrm-postgres-1 Waiting                                      0.3s
 ✔ Container b1gcrm-app-1      Running                                      0.0s
 ⠼ Container b1gcrm-postgres-1 Waiting                                      0.4s
 ✔ Container b1gcrm-app-1      Running                                      0.0s
[+] up 2/2
 ✔ Container b1gcrm-postgres-1 Healthy                                      0.5s
 ✔ Container b1gcrm-app-1      Running                                      0.0s
```

## 2. Frontend Client Build
The React frontend build was validated.

### Command: `npm install --legacy-peer-deps`
```
up to date, audited 703 packages in 1s
94 packages are looking for funding
  run `npm fund` for details
20 vulnerabilities (17 moderate, 3 high)
```

### Command: `npm run build`
```
> client@0.0.0 build
> vite build
vite v8.0.16 building client environment for production...
transforming (6) index.html
✓ 266 modules transformed.
rendering chunks (1)...

computing gzip size...
dist/index.html                   0.45 kB │ gzip:   0.29 kB
dist/assets/index-2CcHXtvt.css   38.59 kB │ gzip:   7.69 kB
dist/assets/index-Bth81SCU.js   786.81 kB │ gzip: 216.75 kB
[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 372ms
```

## Conclusion
Vite build succeeds without fatal errors. Both local development dependencies and Docker container instances are completely functional.
