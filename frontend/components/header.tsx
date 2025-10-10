import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            OracleMind
          </h1>
        </div>
        <nav className="hidden md:flex space-x-6">
          <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors">
            Home
          </a>
          <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors">
            About
          </a>
          <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors">
            Docs
          </a>
        </nav>
        <div className="flex items-center">
          <ConnectButton />
        </div>
      </div>
      {/* Mobile menu - simplified, no hamburger for now */}
      <div className="md:hidden px-4 pb-4">
        <nav className="flex space-x-4">
          <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 text-sm">
            Home
          </a>
          <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 text-sm">
            About
          </a>
          <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 text-sm">
            Docs
          </a>
        </nav>
      </div>
    </header>
  );
}
