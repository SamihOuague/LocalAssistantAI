FROM python:3.12.13-alpine3.24

RUN pip install --upgrade pip

RUN apk add --no-cache \
    bash \
    curl \
    jq

COPY . /RAG

WORKDIR /RAG

RUN pip install -r requirements.txt

ENTRYPOINT [ "sh", "setup.sh" ]