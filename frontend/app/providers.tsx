'use client';

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { defineChain } from 'viem';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  const somniaTestnet = defineChain({
    id: 50312,
    name: 'Somnia Testnet',
    nativeCurrency: { name: 'Somnia Token', symbol: 'SOMI', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://dream-rpc.somnia.network/'] },
      public: { http: ['https://dream-rpc.somnia.network/'] },
    },
    blockExplorers: {
      default: { name: 'Somnia Explorer', url: 'https://dream-rpc.somnia.network/explorer' },
    },
  });

  const config = getDefaultConfig({
    appName: 'Somnia Oracle dApp',
    projectId: 'cb44e6bd7a2139350e8c0fb2d0fea8cb',
    chains: [somniaTestnet],
    ssr: true, // If your dApp uses server side rendering (SSR)
  });

  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
