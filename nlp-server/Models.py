from joblib import load
from typing import Literal

import numpy as np
from sklearn.ensemble import RandomForestClassifier
import weaviate.classes as wvc
from weaviate.classes.query import MetadataQuery

from weaviate_client import weaviate_client
from Subject import Subject

na_rpl_classifier: RandomForestClassifier = load("./na_rpl_classifier.joblib")

subject_collection = weaviate_client.collections.get("Subject")

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

def get_subject_recommendations(
    subject: str | list[float],
    excluded_subjects: list[str],
    university: Literal["UTS", "USYD", "All"] = "UTS",
    num_subjects: int = 5,
) -> list[Subject]:
    try:
        recommendations = set([])
        limit = 10
        filters = None if university == "All" else (wvc.query.Filter.by_property("university").equal(university))

        while len(recommendations) < 5:
            response = (
                subject_collection.query.near_object(
                    near_object=subject,
                    filters=filters,
                    limit=limit,
                    return_metadata=MetadataQuery(distance=True),
                    include_vector=True,
                )
                if type(subject) == str
                else subject_collection.query.near_vector(
                    near_vector=subject,
                    filters=filters,
                    limit=limit,
                    return_metadata=MetadataQuery(distance=True),
                    include_vector=True,
                )
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
