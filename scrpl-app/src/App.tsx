import { useEffect, useState } from "react";

import SearchBar from "./components/SearchBar";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import SkeletonItem from "./components/SkeletonItem";

import SubjectsIcon from "./assets/subjects-icon.png";
import SubjectList from "./components/SubjectList";
import { Subject } from "@/types";

export default function App() {
  const [searchText, setSearchText] = useState<string>("");
  const [sourceSubject, setSourceSubject] = useState<Subject | null>(
    null
  );
  const [debouncedSearchText] = useDebounce(searchText, 1000);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [isShowSelections, setIsShowSelections] = useState<boolean>(false);

  useEffect(() => {
    const selectedSubjects = localStorage.getItem("selectedSubjects");
    if (selectedSubjects) {
      setSelectedSubjects(JSON.parse(selectedSubjects));
    }
  }, [setSelectedSubjects]);

  const {
    isPending: isSearching,
    // error,
    data: searchedSubjects,
    refetch: refetchSearchedSubjects,
  } = useQuery({
    queryKey: ["search", debouncedSearchText],
    queryFn: async (): Promise<Subject[]> => {
      if (searchText === "") return [];

      const response = await axios.post(`/recommendation/?university=USYD`, {
        description: debouncedSearchText,
      });
      return response.data;
    },
  });

  const {
    isPending: isGettingRecommendations,
    // error,
    data: recommendedSubjects,
    refetch: refetchRecommendedSubjects,
  } = useQuery({
    queryKey: ["recommendation", sourceSubject],
    queryFn: async (): Promise<Subject[] | null> => {
      if (!sourceSubject) return null;

      const response = await axios.get(`/recommendation/${sourceSubject.subject_code}`);
      return response.data;
    },
  });

  function handleSearch() {
    refetchSearchedSubjects();
  }

  function getSubjectRecommendations(subject: Subject) {
    setSourceSubject(subject);
    refetchRecommendedSubjects();
  }

  function addSubject(subject: Subject) {
    const updatedSubjects = [...selectedSubjects, subject];

    setSelectedSubjects(updatedSubjects);
    localStorage.setItem("selectedSubjects", JSON.stringify(updatedSubjects));
  }

  function removeSubject(subject: Subject) {
    const updatedSubjects = selectedSubjects.filter(
      (selectedSubject) => selectedSubject.subject_code !== subject.subject_code
    );

    setSelectedSubjects(updatedSubjects);
    localStorage.setItem("selectedSubjects", JSON.stringify(updatedSubjects));
  }

  return (
    <div className="w-full p-16 relative">
      <h1 className="text-center text-5xl mb-12">RPL Recommendations Demo</h1>

      {!isShowSelections && (
        <>
          {!sourceSubject && (
            <div className="w-full flex flex-col items-center justify-center gap-8 mb-12">
              <SearchBar
                setSearchText={setSearchText}
                handleSearch={handleSearch}
              />
            </div>
          )}

          <div className="max-w-2xl mx-auto flex flex-col items-start justify-center gap-4">
            {(isSearching || isGettingRecommendations) && (
              <>
                <SkeletonItem />
                <SkeletonItem />
                <SkeletonItem />
                <SkeletonItem />
                <SkeletonItem />
              </>
            )}

            {!sourceSubject && searchedSubjects && (
              <SubjectList
                subjects={searchedSubjects}
                urlPrefix="https://www.sydney.edu.au/units/"
                onSubjectClick={getSubjectRecommendations}
              />
            )}

            {sourceSubject && recommendedSubjects && (
              <>
                <h3 className="text-3xl w-full text-center mb-6">{sourceSubject.subject_code}: {sourceSubject.name}</h3>

                <SubjectList
                  subjects={recommendedSubjects}
                  excludeSubjects={selectedSubjects}
                  urlPrefix="https://handbook.uts.edu.au/subjects/"
                  addSubject={addSubject}
                  isShowSimilarity={true}
                />

                <button
                  className="btn btn-primary mx-auto"
                  onClick={() => setSourceSubject(null)}
                >
                  Back
                </button>
              </>
            )}
          </div>

          <div
            onClick={() => setIsShowSelections(true)}
            className="bg-emerald-500 hover:bg-emerald-600 cursor-pointer inline-block w-[50px] rounded-md p-2 absolute top-6 right-6"
          >
            <img alt="subject icon" src={SubjectsIcon} />
          </div>
        </>
      )}

      {isShowSelections && (
        <div className="max-w-2xl mx-auto flex flex-col items-start justify-center gap-4">
          {selectedSubjects.length === 0 ? (
            <h2 className="w-full text-center text-2xl mb-8">
              No subjects selected
            </h2>
          ) : (
            <SubjectList
              subjects={selectedSubjects}
              urlPrefix="https://handbook.uts.edu.au/subjects/"
              removeSubject={removeSubject}
              isShowSimilarity={true}
            />
          )}

          <div className="w-full flex items-center justify-center gap-4 mt-4">
            <button className="btn btn-accent max-w-24 w-full">Submit</button>

            <button
              className="btn btn-primary max-w-24 w-full"
              onClick={() => setIsShowSelections(false)}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
