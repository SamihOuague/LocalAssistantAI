FROM docker.elastic.co/beats/metricbeat:8.7.1
USER root
RUN apt update && apt upgrade -y \
    && apt install -y curl jq
COPY --chown=root:metricbeat metricbeat.yml /usr/share/metricbeat/metricbeat.yml
RUN chmod go-w /usr/share/metricbeat/metricbeat.yml
COPY setup.sh /usr/share/metricbeat
USER metricbeat
CMD ["bash", "/usr/share/metricbeat/setup.sh"]