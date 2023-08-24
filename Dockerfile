FROM navikt/node-express:16

ADD ./ /var/server/

RUN yarn

EXPOSE 3000
CMD ["yarn", "start"] 