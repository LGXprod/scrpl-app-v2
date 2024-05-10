import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, Response, status, Request
import weaviate.classes as wvc
from InstructorEmbedding import INSTRUCTOR

from weaviate_client import weaviate_client
from Subject import Subject, SubjectDetails
from Models import get_subject_recommendations, is_na_rpl

load_dotenv()

model = INSTRUCTOR("hkunlp/instructor-xl")

app = FastAPI()

subject_collection = weaviate_client.collections.get("Subject")


@app.get("/recommendation/{subject_code}/")
@app.post("/recommendation/")
def read_recommendation(
    request: Request,
    response: Response,
    subject_code: str | None = None,
    subject_details: SubjectDetails = None,
    remove_na_rpl: bool = True,
):
    subject: str | list[float] = None
    selected_subject_vector: list[float] = None

    if request.method == "GET":
        subject = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"usyd-{subject_code}"))
        selected_subject_vector = subject_collection.query.fetch_object_by_id(
            subject, include_vector=True
        ).vector
    else:
        description = f"""{subject_details.subjectCode}: {subject_details.name}\n\n{subject_details.description}"""
        subject = selected_subject_vector = model.encode(description).tolist()

    recommendations: set[Subject] = set([])
    excluded_subjects = []
    num_attempts = 1

    try:
        while len(recommendations) < 5 and num_attempts <= 5:
            for subject in get_subject_recommendations(subject, excluded_subjects):
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
