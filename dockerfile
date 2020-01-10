FROM node:alpine

RUN mkdir /src 
WORKDIR /src

COPY . /src

RUN npm install
RUN npm update

EXPOSE 3000

#ENV AWS_ACCESS_KEY_ID ""
#ENV AWS_SECRET_ACCESS_KEY ""
#ENV AWS_DEFAULT_REGION "us-west-2"

ENTRYPOINT [ "node", "./app/bin/www" ]
