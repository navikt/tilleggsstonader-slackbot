FROM gcr.io/distroless/nodejs18-debian12

ADD ./build /app

WORKDIR /app

EXPOSE 3000
CMD ["--experimental-modules", "--es-module-specifier-resolution=node", "index.js"]