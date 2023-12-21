FROM navikt/node-express:16

ADD ./build /var/server/

RUN yarn

EXPOSE 3000
CMD ["node", "index.js"]