'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Brain, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="bg-gradient-to-r from-blue-500 to-purple-600 shadow-md sticky top-0 z-50 hover:shadow-lg transition-shadow duration-300">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Brain className="h-8 w-8 text-white" />
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Somnia AI Gig Economy
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-white hover:bg-white/20"
            suppressHydrationWarning
          >
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" suppressHydrationWarning /> : <Moon className="h-5 w-5" suppressHydrationWarning />}
          </Button>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
