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
        type="text"
        placeholder="Search for a USYD subject by code, title or description..."
        className="input input-bordered w-full max-w-lg"
        onChange={(e) => setSearchText(e.target.value)}
      />
      <button className="btn btn-primary" onClick={handleSearch}>
        Search
      </button>
    </div>
  );
}
