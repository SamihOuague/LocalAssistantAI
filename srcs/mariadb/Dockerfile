FROM debian:bookworm

RUN apt update && apt upgrade -y \
    && apt install -y mariadb-server curl jq

COPY ./my.cnf /etc/mysql/my.cnf
COPY ./50-server.cnf /etc/mysql/mariadb.conf.d

RUN chown mysql:mysql /var/lib/mysql \
    && chown mysql:mysql /home \
    && chown mysql:mysql /run

COPY ./setup.sh /
RUN chmod +x /setup.sh

ENTRYPOINT [ "/setup.sh" ]
