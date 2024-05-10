from pydantic import BaseModel

class SubjectDetails(BaseModel):
    subjectCode: str
    name: str
    description: str

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
