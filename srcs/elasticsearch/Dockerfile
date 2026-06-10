FROM docker.elastic.co/elasticsearch/elasticsearch:8.7.1
USER root
RUN apt update && apt upgrade -y \
    && apt install -y curl jq
COPY --chown=elasticsearch:elasticsearch elasticsearch.yml /usr/share/elasticsearch/config/
COPY setup.sh /usr/share/elasticsearch
USER elasticsearch
CMD ["bash", "/usr/share/elasticsearch/setup.sh"]