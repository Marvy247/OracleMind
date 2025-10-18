'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Brain, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const [particles, setParticles] = useState<Array<{ left: number; top: number; delay: number }>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Generate particles only on client side to avoid hydration mismatch
    const newParticles = Array.from({ length: 20 }).map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
    }));
    setParticles(newParticles);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="bg-gradient-to-r from-gray-800 via-gray-900 to-black dark:from-gray-900 dark:via-black dark:to-gray-800 gradient-shift shadow-md sticky top-0 z-50 hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
      {/* Floating particles */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full float"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center relative z-10">
        <div className="flex items-center space-x-4">
          <Brain className="h-8 w-8 text-white float" />
          <h1 className="text-xl md:text-2xl font-bold text-white neon-text">
            PixelGig
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
            suppressHydrationWarning
          >
            {mounted && (resolvedTheme === 'dark' ? <Sun className="h-5 w-5" suppressHydrationWarning /> : <Moon className="h-5 w-5" suppressHydrationWarning />)}
          </Button>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
