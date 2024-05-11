import os
import uuid
from typing import Literal

from fastapi import FastAPI, Response, status, Request
from fastapi.middleware.cors import CORSMiddleware
from InstructorEmbedding import INSTRUCTOR

from weaviate_client import weaviate_client
from Subject import Subject, SubjectDetails
from Models import get_subject_recommendations, is_na_rpl

model = INSTRUCTOR("hkunlp/instructor-xl")

app = FastAPI()

origins = [os.getenv("CORS_ORIGIN")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


subject_collection = weaviate_client.collections.get("Subject")


@app.get("/recommendation/{subject_code}/")
@app.post("/recommendation/")
def read_recommendation(
    request: Request,
    response: Response,
    subject_code: str | None = None,
    subject_details: SubjectDetails = None,
    remove_na_rpl: bool = True,
    university: Literal["UTS", "USYD", "All"] = "UTS",
):
    source_subject: str | list[float] = None
    source_subject_vector: list[float] = None

    if request.method == "GET":
        source_subject = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"usyd-{subject_code}"))
        source_subject_vector = subject_collection.query.fetch_object_by_id(
            source_subject, include_vector=True
        ).vector
    else:
        description = subject_details.description
        source_subject = source_subject_vector = model.encode(description).tolist()

    recommendations: set[Subject] = set([])
    excluded_subjects = []
    num_attempts = 1

    try:
        while len(recommendations) < 5 and num_attempts <= 5:
            for subject in get_subject_recommendations(source_subject, excluded_subjects, university):
                if remove_na_rpl and is_na_rpl(source_subject_vector, subject.vector):
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
