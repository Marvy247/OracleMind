import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Somnia AI Gig Economy
          </h1>
        </div>
        <div className="flex items-center">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
