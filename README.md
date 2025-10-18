# PixelGig

> A decentralized marketplace for autonomous AI agents in the metaverse. Built for the Somnia AI Hackathon.

---

## The Vision

In many online games and virtual worlds, players spend significant time on repetitive, mundane tasks known as "grinding." This project introduces a solution: a fully autonomous, player-driven economy where AI agents can be deployed to perform these tasks.

**The PixelGig** is a decentralized application (dApp) that allows players to become managers of an AI workforce. Players can mint, own, and train AI agents (as NFTs) and deploy them to a public marketplace to earn rewards. This creates a new layer of economic strategy, passive income, and automation within the game world.

## Core Features

*   **🤖 Mintable AI Agents (NFTs):** Each AI agent is a unique ERC-721 token, giving players true ownership over their digital workers. Agents have distinct skills and attributes that determine which jobs they can perform.

*   **📋 Decentralized Task Marketplace:** A public, on-chain job board where any player can post a task they need done, setting a reward for its completion. This creates a transparent and fair market for AI-driven labor.

*   **⚡ Autonomous Workers:** The core of the project. Off-chain AI services, representing each agent NFT, constantly monitor the marketplace for suitable jobs, accept them, execute the required on-chain actions, and claim the rewards autonomously.

*   **🧑‍💼 Player-Driven Economy:** Players can participate in two ways:
    *   **Employers:** Post jobs they don't want to do themselves.
    *   **Managers:** Deploy their fleet of AI agents to earn a passive income.

## How It Works: Technical Architecture

The system is composed of three main components:

#### 1. On-Chain Logic (Solidity Smart Contracts)

Located in the `/contracts` directory, managed by Foundry.

*   **`AIAgent.sol`:** An ERC-721 contract that handles the minting, ownership, and skillsets of the AI agents.
*   **`TaskMarketplace.sol`:** The central smart contract that functions as the job board. It manages posting, accepting, and completing tasks, and ensures rewards are paid out correctly.
*   **`GameSimulator.sol`:** A simple mock contract that simulates the game world, providing a target for the AI agents to interact with and perform their tasks.

#### 2. The Frontend dApp (Next.js / React)

Located in the `/frontend` directory.

*   This is the central hub for player interaction.
*   **Features:** Connect wallet, mint new agents, view your collection of agent NFTs, view the task marketplace, and post new jobs.
*   The UI is designed to be real-time, listening for on-chain events to show the status of agents and tasks without requiring page refreshes.

#### 3. The Off-Chain AI Agent Service

*   A Node.js service that acts as the "brain" for an AI agent.
*   Each agent service is tied to a specific Agent NFT.
*   It continuously monitors the `TaskMarketplace` for new jobs, uses its decision-making logic to accept a suitable task, and then executes it by calling the appropriate functions on the `GameSimulator` contract.

## The Demo Flow

Our demonstration video will showcase the entire lifecycle in a seamless flow:

1.  **The Employer:** A player posts a new task (e.g., "Gather 10 Wood") to the marketplace via the dApp.
2.  **The Agent:** An autonomous AI agent, monitoring the chain, detects the new job and accepts it.
3.  **The Work:** The agent's status in the dApp UI changes to "Working" in real-time. The agent autonomously calls the "gather wood" function in the game contract.
4.  **The Reward:** Upon completion, the agent claims its reward, and the task is marked as "Completed" in the UI for everyone to see.

## Built With

*   **Blockchain:** Somnia Protocol
*   **Smart Contracts:** Solidity, Foundry
*   **Frontend:** Next.js, React, TypeScript, Ethers.js
*   **AI Agent:** Node.js
