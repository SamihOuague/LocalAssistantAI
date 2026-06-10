FROM docker.elastic.co/beats/filebeat:8.7.1
USER root
RUN apt update && apt upgrade -y \
    && apt install -y curl jq
COPY --chown=root:filebeat filebeat.yml /usr/share/filebeat/filebeat.yml
RUN chmod go-w /usr/share/filebeat/filebeat.yml
COPY setup.sh /usr/share/filebeat
USER filebeat
CMD ["bash", "/usr/share/filebeat/setup.sh"]