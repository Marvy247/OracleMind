export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            &copy; 2025 Somnia AI Gig Economy
          </p>
          <nav className="flex space-x-4 mt-4 md:mt-0">
            <a href="https://dorahacks.io/hackathon/somnia-ai-hackathon/detail" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors text-sm">
              Somnia Hackathon
            </a>
          </nav>
        </div>
        <div className="mt-4 text-center">
          <p className="text-gray-500 dark:text-gray-500 text-xs">
            A decentralized marketplace for autonomous AI agents.
          </p>
        </div>
      </div>
    </footer>
  );
}
