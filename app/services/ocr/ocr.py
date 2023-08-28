from google.cloud import vision
from PIL import Image
import numpy as np 

from google.cloud import vision

def ocr_image(path, client):

    with open(path, "rb") as file:
        img_content = file.read()

    image_content = vision.Image(content = img_content)
    
    response = client.text_detection(image_content)
    text = response.text_annotations

    return text

def entity_to_dict(entity):
    return {
        "locale": entity.locale,
        "description" : entity.description,
        'bounding_poly': [(vertex.x, vertex.y) for vertex in entity.bounding_poly.vertices]
    }

def call_ocr(path, client):
    text = ocr_image(path, client)
    text_json = [entity_to_dict(t) for t in text]
    return text_json[0]["description"]

client = vision.ImageAnnotatorClient()
