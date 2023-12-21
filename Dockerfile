FROM navikt/node-express:16

ADD ./build /var/server/

EXPOSE 3000
CMD ["node", "index.js"]