FROM alpine:latest

RUN apk update
RUN apk add --no-cache php7-cli php7-json bash wget

# add files
RUN mkdir /var/www
ADD install.sh /var/www
RUN cd /var/www/ && chmod +x install.sh && ./install.sh

EXPOSE 8080
WORKDIR /var/www/keeweb-local-server
ENTRYPOINT ["php", "-S", "0.0.0.0:8080"]
