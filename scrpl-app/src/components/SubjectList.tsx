import { Subject } from "@/types";
import AddIcon from "@/assets/add-icon.png";
import RemoveIcon from "@/assets/remove-icon.png";

type Props = {
  subjects: Subject[];
  excludeSubjects?: Subject[];
  urlPrefix: string;
  onSubjectClick?: (subject: Subject) => void;
  addSubject?: (subject: Subject) => void;
  removeSubject?: (subject: Subject) => void;
};

export default function SubjectList({
  subjects,
  urlPrefix,
  onSubjectClick,
  addSubject,
  removeSubject,
  excludeSubjects,
}: Props) {
  return (
    <>
      {subjects.map((subject, index) => {
        const { subject_code, name } = subject;

        return (
          <div
            key={index}
            className="bg-base-200 w-full flex flex-col gap-2 px-10 py-6 rounded-lg mb-4 cursor-pointer hover:bg-slate-700"
            onClick={() => onSubjectClick && onSubjectClick(subject)}
            style={{
              display: excludeSubjects?.includes(subject) ? "none" : "",
            }}
          >
            <h3 className="text-2xl">
              {subject_code}: {name}
            </h3>

            <a
              className="text-blue-500 contents"
              target="_blank"
              rel="noopener"
              href={`${urlPrefix}${subject_code}`}
            >
              {urlPrefix}
              {subject_code}
            </a>

            {(addSubject || removeSubject) && (
              <div className="flex items-center justify-start gap-2">
                {addSubject && (
                  <img
                    alt="Add Icon"
                    src={AddIcon}
                    className="w-[30px]"
                    onClick={() => addSubject(subject)}
                  />
                )}

                {removeSubject && (
                  <img
                    alt="Add Icon"
                    src={RemoveIcon}
                    className="w-[30px]"
                    onClick={() => removeSubject(subject)}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
