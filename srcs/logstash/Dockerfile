FROM docker.elastic.co/logstash/logstash:8.7.1
USER root
RUN apt update && apt upgrade -y \
    && apt install -y curl jq
RUN rm -f /usr/share/logstash/pipeline/logstash.conf
COPY pipeline/ /usr/share/logstash/pipeline/
COPY config/ /usr/share/logstash/config/
COPY setup.sh /usr/share/logstash
EXPOSE 5044
USER logstash
CMD ["bash", "/usr/share/logstash/setup.sh"]