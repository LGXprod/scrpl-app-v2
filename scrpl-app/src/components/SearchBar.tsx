export default function SearchBar({
  setSearchText,
  handleSearch,
}: {
  setSearchText: (text: string) => void;
  handleSearch: () => void;
}) {
  return (
    <div className="w-full flex items-center justify-center gap-8">
      <input
        className="max-w-xl w-full px-4 py-2 rounded-md text-black"
        type="text"
        placeholder="Search for a subject by code, title or description"
        onChange={(e) => setSearchText(e.target.value)}
      />
      <button
        className="bg-blue-600 px-4 py-2 rounded-md"
        onClick={handleSearch}
      >
        Search
      </button>
    </div>
  );
}
