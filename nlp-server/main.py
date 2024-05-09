import os
import uuid
from joblib import load

import numpy as np

from dotenv import load_dotenv
from fastapi import FastAPI, Response, status
import weaviate
import weaviate.classes as wvc
from weaviate.classes.query import MetadataQuery

load_dotenv()

client = weaviate.connect_to_custom(
    http_host="localhost",
    http_port=8080,
    http_secure=False,
    grpc_host="localhost",
    grpc_port=50051,
    grpc_secure=False,
    auth_credentials=weaviate.auth.AuthApiKey(os.getenv("WEAVIATE_API_KEY")),
)

subjects = client.collections.get("Subject")

app = FastAPI()

na_rpl_classifier = load("./na_rpl_classifier.joblib")


def get_subject_recommendations(subject_id: str, excluded_subjects: list[str] = [], num_subjects: int = 5):
    try:
        recommendations = []
        limit = 10
        
        while len(recommendations) < 5:
            response = subjects.query.near_object(
                near_object=subject_id,
                filters=(
                    wvc.query.Filter.by_property("university").equal("UTS")
                ),
                limit=limit,
                return_metadata=MetadataQuery(distance=True),
                include_vector=True,
            )

            

            for obj in response.objects:
                if obj.properties["subjectCode"] in excluded_subjects:
                    continue
                
                recommendations.append(
                    {
                        "subject_code": obj.properties["subjectCode"],
                        "subject_name": obj.properties["name"],
                        "vector": obj.vector,
                        "similarity": 1 - obj.metadata.distance,
                    }
                )
                
            limit += 10
            
        return recommendations[:num_subjects]
    except:
        raise Exception("Failed to get recommendations")


@app.get("/check")
def read_root():
    return {"Hello": "World"}


@app.get("/recommendation/{subject_code}")
def read_recommendation(subject_code: str, response: Response):
    subject_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"usyd-{subject_code}"))

    try:
        return get_subject_recommendations(subject_id)
    except:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"error": "Failed to get recommendations"}
