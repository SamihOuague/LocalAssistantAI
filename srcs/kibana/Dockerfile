FROM docker.elastic.co/kibana/kibana:8.7.1
USER root
RUN apt update && apt upgrade -y \
    && apt install -y curl jq
COPY --chown=kibana:kibana kibana.yml /usr/share/kibana/config/kibana.yml
COPY --chown=kibana:kibana setup.sh /usr/share/kibana
USER kibana
CMD ["bash", "/usr/share/kibana/setup.sh"]