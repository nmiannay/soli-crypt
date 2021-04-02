FROM node:14.15-alpine

RUN apk update && apk add --virtual build-dependencies \
    openssh \
    build-base \
    autoconf \
    automake \
    gcc \
    git

WORKDIR /usr/src/app

COPY . .

CMD [ "sh" ]
# docker run -it --rm --name my-running-script -v "$PWD":/usr/src/myapp -w /usr/src/myapp python:3