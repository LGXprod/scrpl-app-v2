export default function Home() {
  return (
    <main className="w-full">
      <h1 className="text-5xl text-center mb-12 leading-normal">
        Student Lead Recognition of Prior Learning <br />
        At the University of Technology Sydney
      </h1>

      <div className="w-full flex flex-col items-center gap-4">
        <div className="max-w-2xl w-full flex items-center justify-center gap-4">
          <input
            className="w-full rounded-md py-2 px-4"
            type="text"
            placeholder="Search for a subject by subject code, title or description!"
          />
          
          <button className="bg-blue-600 px-4 py-2 rounded-md">Search</button>
        </div>
      </div>
    </main>
  );
}
