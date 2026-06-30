FROM redis:8.2.7-bookworm

RUN apt update && \
    apt install curl jq -y

COPY ./setup.sh /setup.sh

ENTRYPOINT ["bash", "/setup.sh"]