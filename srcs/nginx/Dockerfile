########################################
# STAGE 1 : BUILD ModSecurity + Nginx 1.30.3 + module
########################################
FROM debian:bookworm AS builder

ENV DEBIAN_FRONTEND=noninteractive
ARG NGINX_VERSION=1.30.3

RUN apt update && apt install -y \
    git g++ make automake autoconf libtool pkg-config \
    libpcre2-dev libxml2-dev libyajl-dev \
    libcurl4-openssl-dev libgeoip-dev \
    liblmdb-dev libssl-dev doxygen zlib1g-dev \
    ca-certificates curl wget

# 1) Compiler ModSecurity v3
RUN git clone --depth 1 https://github.com/owasp-modsecurity/ModSecurity /modsec
WORKDIR /modsec
RUN git submodule update --init --recursive
RUN ./build.sh && ./configure && make && make install

# 2) Télécharger Nginx 1.30.3 (source)
WORKDIR /
RUN curl -sSL http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz | tar xz

# 3) Télécharger le module ModSecurity pour Nginx
RUN git clone --depth 1 https://github.com/SpiderLabs/ModSecurity-nginx /modsec-nginx

# 4) Compiler Nginx + module ModSecurity
WORKDIR /nginx-${NGINX_VERSION}
RUN ./configure \
    --with-compat \
    --with-http_ssl_module \
    --with-http_v2_module \
    --add-dynamic-module=/modsec-nginx \
    --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --modules-path=/etc/nginx/modules \
    --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log


RUN make && make install


########################################
# STAGE 2 : IMAGE FINALE
########################################
FROM debian:bookworm

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt install -y \
    libpcre2-8-0 libxml2 libyajl2 libcurl4 \
    libgeoip1 liblmdb0 libssl3 zlib1g git \
    ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

# Copier Nginx compilé
COPY --from=builder /usr/sbin/nginx /usr/sbin/nginx
COPY --from=builder /etc/nginx /etc/nginx
COPY --from=builder /etc/nginx/modules /etc/nginx/modules

# Copier ModSecurity compilé
COPY --from=builder /usr/local/modsecurity/ /usr/local/modsecurity/


# Installer CRS
RUN git clone --depth 1 https://github.com/coreruleset/coreruleset /tmp/crs && \
    mkdir -p /etc/nginx/crs && \
    cp /tmp/crs/crs-setup.conf.example /etc/nginx/crs/crs-setup.conf && \
    cp -r /tmp/crs/rules /etc/nginx/crs/ && \
    rm -rf /tmp/crs

# Copier tes configs
COPY nginx.conf /etc/nginx/nginx.conf
COPY modsecurity.conf /etc/nginx/modsecurity.conf

# certificat
COPY ./ft_transcendence-key.pem /etc/ssl/private/rootCA-key.pem
COPY ./ft_transcendence.pem /etc/ssl/certs/rootCA.pem

RUN adduser --system --no-create-home --group nginx

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
