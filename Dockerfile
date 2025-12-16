FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:22-slim

COPY build/index.js /app/index.js

WORKDIR /app

EXPOSE 3000
CMD ["index.js"]