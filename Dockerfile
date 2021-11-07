FROM node:14.15-alpine

RUN apk update && apk add --virtual build-dependencies \
    openssh \
    build-base \
    autoconf \
    automake \
    gcc \
    git

WORKDIR /usr/src/app
ADD ./package.json .
ADD ./yarn.lock .
RUN yarn install

ADD aliases.sh /etc/profile.d/
ADD . .

ENTRYPOINT [ "/bin/sh", "-l", "-c" ]
