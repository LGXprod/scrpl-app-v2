import { useState } from "react";

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
  const [sourceSubjectCode, setSourceSubjectCode] = useState<string | null>(
    null
  );
  const [debouncedSearchText] = useDebounce(searchText, 1000);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);

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
    queryKey: ["recommendation", sourceSubjectCode],
    queryFn: async (): Promise<Subject[] | null> => {
      if (!sourceSubjectCode) return null;

      const response = await axios.get(`/recommendation/${sourceSubjectCode}`);
      return response.data;
    },
  });

  function handleSearch() {
    refetchSearchedSubjects();
  }

  function getSubjectRecommendations(subject: Subject) {
    setSourceSubjectCode(subject.subject_code);
    refetchRecommendedSubjects();
  }

  function addSubject(subject: Subject) {
    setSelectedSubjects((selectedSubjects) => [...selectedSubjects, subject]);
    localStorage.setItem("selectedSubjects", JSON.stringify(selectedSubjects));
  }

  function removeSubject(subject: Subject) {
    setSelectedSubjects((selectedSubjects) =>
      selectedSubjects.filter((selectedSubject) => selectedSubject !== subject)
    );
    localStorage.setItem("selectedSubjects", JSON.stringify(selectedSubjects));
  }

  return (
    <div className="w-full p-16 relative">
      <h1 className="text-center text-5xl mb-12">RPL Recommendations Demo</h1>

      {!sourceSubjectCode && (
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

        {!sourceSubjectCode && searchedSubjects && (
          <SubjectList
            subjects={searchedSubjects}
            urlPrefix="https://www.sydney.edu.au/units/"
            onSubjectClick={getSubjectRecommendations}
          />
        )}

        {sourceSubjectCode && recommendedSubjects && (
          <>
            <SubjectList
              subjects={recommendedSubjects}
              excludeSubjects={selectedSubjects}
              urlPrefix="https://handbook.uts.edu.au/subjects/"
              addSubject={addSubject}
            />

            <button
              className="btn btn-primary mx-auto"
              onClick={() => setSourceSubjectCode(null)}
            >
              Back
            </button>
          </>
        )}
      </div>

      <div className="bg-emerald-500 hover:bg-emerald-600 cursor-pointer inline-block w-[50px] rounded-md p-2 absolute top-6 right-6">
        <img alt="subject icon" src={SubjectsIcon} />
      </div>
    </div>
  );
}
