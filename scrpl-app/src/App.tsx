import { useState } from "react";

import SearchBar from "./components/SearchBar";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";

type Subject = { subject_code: string; name: string; similarity: number };

export default function App() {
  const [searchText, setSearchText] = useState<string>("");
  const [debouncedSearchText] = useDebounce(searchText, 1500);

  const {
    isPending,
    error,
    data: searchedSubjects,
    refetch,
  } = useQuery({
    queryKey: ["search", debouncedSearchText],
    queryFn: async (): Promise<Subject[]> => {
      if (searchText === "") return [];

      const response = await axios.post(`/recommendation`, {
        description: debouncedSearchText,
      });
      return response.data;
    },
  });

  function handleSearch() {
    refetch();
  }

  return (
    <div className="w-full p-16">
      <h1 className="text-center text-5xl mb-12">RPL Recommendations Demo</h1>

      <div className="w-full flex flex-col items-center justify-center gap-8">
        <SearchBar setSearchText={setSearchText} handleSearch={handleSearch} />
      </div>

      {searchedSubjects &&
        searchedSubjects.map((subject, index) => (
          <h3 key={index}>{subject.name}</h3>
        ))}
    </div>
  );
}
