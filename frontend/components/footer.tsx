export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            &copy; 2025 OracleMind. All rights reserved.
          </p>
          <nav className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors text-sm">
              Home
            </a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors text-sm">
              About
            </a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors text-sm">
              Docs
            </a>
          </nav>
        </div>
        <div className="mt-4 text-center">
          <p className="text-gray-500 dark:text-gray-500 text-xs">
            Secure Data Oracle for On-Chain AI Agents
          </p>
        </div>
      </div>
    </footer>
  );
}
