import os
from langchain_ollama import OllamaEmbeddings
from langchain_elasticsearch import ElasticsearchStore
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from elasticsearch import Elasticsearch


elasticIndex = os.environ["ELASTIC_INDEX"]
elasticHost = os.environ["ELASTIC_HOSTS"]
elasticUser = os.environ["ELASTIC_USERNAME"]
elasticPass = os.environ["ELASTIC_PASSWORD"]
elasticPathCrt= os.environ["ELASTIC_CERT_PATH"]
ollamaUrl = os.environ["OLLAMA_URL"]

print(elasticHost, elasticPass, elasticUser, elasticPathCrt)
# Create the client instance
client = Elasticsearch(
    elasticHost,
    ca_certs=elasticPathCrt,
    basic_auth=(elasticUser, elasticPass),
    request_timeout=60
)

print(client.info())

embeddings = OllamaEmbeddings(model="embeddinggemma", base_url=ollamaUrl)
#
##- certs:/usr/share/ragsetup/config/certs:ro
vector_store = ElasticsearchStore(
    index_name=elasticIndex,
    embedding=embeddings,
    client=client,
    vector_query_field="embedding"
)

if client.indices.exists(index="chatllm_rag"):
    client.indices.delete(index="chatllm_rag")
    
headers_to_split_on = [
    ("#", "Header 1"),
    ("##", "Header 2"),
    ("###", "Header 3"),
]

markdown_splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=headers_to_split_on
)

recursive_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
)


def load_markdown(path):
    with open(path) as file:
        docs = file.read()
        
        return [Document(page_content=docs, metadata={"source": path})]

def load_document(docs):
    markdown_chunks = markdown_splitter.split_text(
        docs[0].page_content
    )

    final_chunks = recursive_splitter.split_documents(
        markdown_chunks
    )

    final_chunks = [
        doc
        for doc in final_chunks
        if len(doc.page_content.strip()) > 100
    ]
    
    vector_store.add_documents(
        documents=final_chunks
    )

    print(f"{len(final_chunks)} chunks")

for elt in os.listdir("."):
    file = elt.split(".")
    if len(file) > 1 and file[-1] == 'md':
        doc = load_markdown(elt);
        load_document(doc)

client.close()