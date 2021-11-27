FROM node:14.15-alpine

# Handy folder to share file with host
RUN mkdir /mount
VOLUME /mount

RUN apk update && apk add --virtual build-dependencies \
    openssh \
    build-base \
    autoconf \
    automake \
    gcc

WORKDIR /usr/src/app
ADD ./package.json .
ADD ./yarn.lock .
RUN yarn install

ADD . .

ENTRYPOINT [ "yarn", "run"]
