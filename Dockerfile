FROM gcr.io/distroless/nodejs20-debian12

COPY build/index.js /app/index.js

WORKDIR /app

EXPOSE 3000
CMD ["index.js"]