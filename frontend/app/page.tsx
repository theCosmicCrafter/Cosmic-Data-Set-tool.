import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold text-center sm:text-left">
          Pinnacle Data Platform
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          The OS for Data-Centric AI (2026 Edition)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl mt-8">
          <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-2">AI Curation</h3>
            <p className="text-sm text-gray-500">
              Curate datasets using semantic embeddings and entropy scoring.
            </p>
          </div>
          <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-2">Synthetic Foundry</h3>
            <p className="text-sm text-gray-500">
              Generate missing data distributions with GenAI pipelines.
            </p>
          </div>
          <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-2">Data Observability</h3>
            <p className="text-sm text-gray-500">
              Automated health cards and drift detection for every version.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-8">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="/projects"
            rel="noopener noreferrer"
          >
            Go to Projects
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="https://github.com/your-repo/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the Docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-sm text-gray-500">
        <p>© 2026 Pinnacle Data Systems</p>
      </footer>
    </div>
  );
}
