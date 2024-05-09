import os
import uuid
from joblib import load

import numpy as np

from sklearn.ensemble import RandomForestClassifier
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

na_rpl_classifier: RandomForestClassifier = load("./na_rpl_classifier.joblib")


class Subject:
    def __init__(
        self,
        subject_code: str,
        name: str,
        vector: list[float] | dict[str, list[float]],
        similarity: float,
    ) -> None:
        self.subject_code = subject_code
        self.name = name
        self.vector = vector["default"] if "default" in vector else vector
        self.similarity = similarity

    def __hash__(self) -> int:
        return hash(self.subject_code)

    def __eq__(self, value: object) -> bool:
        if not isinstance(value, Subject):
            return False

        return self.subject_code == value.subject_code

    def get_subject_without_vector(self) -> dict:
        return {
            "subject_code": self.subject_code,
            "name": self.name,
            "similarity": self.similarity,
        }


def get_subject_recommendations(
    subject_id: str, excluded_subjects: list[str] = [], num_subjects: int = 5
) -> list[Subject]:
    try:
        recommendations = set([])
        limit = 10

        while len(recommendations) < 5:
            response = subjects.query.near_object(
                near_object=subject_id,
                filters=(wvc.query.Filter.by_property("university").equal("UTS")),
                limit=limit,
                return_metadata=MetadataQuery(distance=True),
                include_vector=True,
            )

            for obj in response.objects:
                if obj.properties["subjectCode"] in excluded_subjects:
                    continue

                recommendations.add(
                    Subject(
                        subject_code=obj.properties["subjectCode"],
                        name=obj.properties["name"],
                        vector=obj.vector,
                        similarity=1 - obj.metadata.distance,
                    )
                )

            limit += 10

        recommendations = sorted(
            list(recommendations), key=lambda x: x.similarity, reverse=True
        )

        return recommendations[:num_subjects]
    except Exception as e:
        print(e)
        raise Exception("Failed to get recommendations")


def is_na_rpl(source_subject_vector, recommended_subject_vector):
    source_subject_vector = (
        source_subject_vector["default"]
        if "default" in source_subject_vector
        else source_subject_vector
    )
    recommended_subject_vector = (
        recommended_subject_vector["default"]
        if "default" in recommended_subject_vector
        else recommended_subject_vector
    )

    pred = na_rpl_classifier.predict(
        np.array([source_subject_vector + recommended_subject_vector])
    )[0]

    return pred


@app.get("/check")
def read_root():
    return {"Hello": "World"}


@app.get("/recommendation/{subject_code}/")
def read_recommendation(subject_code: str, response: Response, remove_na_rpl: bool = True):
    subject_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"usyd-{subject_code}"))

    selected_subject_vector = subjects.query.fetch_object_by_id(
        subject_id, include_vector=True
    ).vector

    recommendations: set[Subject] = set([])
    excluded_subjects = []
    num_attempts = 1

    try:
        while len(recommendations) < 5 and num_attempts <= 5:
            for subject in get_subject_recommendations(subject_id, excluded_subjects):
                if remove_na_rpl and is_na_rpl(selected_subject_vector, subject.vector):
                    excluded_subjects.append(subject.subject_code)
                else:
                    recommendations.add(subject)

            print(
                f"Attempt: {num_attempts} | Number of Excluded Subjects: {len(excluded_subjects)}"
            )
            num_attempts += 1

        recommendations = [
            subject.get_subject_without_vector()
            for subject in sorted(
                list(recommendations),
                key=lambda x: x.similarity,
                reverse=True,
            )
        ]

        return recommendations[:5]
    except Exception as e:
        print(e)
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"error": "Failed to get recommendations"}
