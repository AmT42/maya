from langchain.vectorstores import Chroma
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain.docstore.document import Document
from decouple import config
from base64 import b64encode

import chromadb 
from chromadb.config import Settings

credentials = b64encode(f"admin:{config('ADMIN')}".encode()).decode("utf-8")
headers = {
    "Authorization": f"Basic {credentials}"
}

chroma_client = chromadb.HttpClient(settings = Settings(allow_reset = True), host = "server", port = 8000, headers=headers)