# Somnia AI Gig Economy - TODO List

This document outlines the steps to build a working demo of the AI Agent Gig Economy for the Somnia Hackathon. The goal is to create a seamless and impressive demo video.

### Phase 1: Smart Contract Foundation (The Bedrock)

- [x] **`AIAgent.sol`:** Create the ERC-721 NFT contract for the AI agents.
  - Each agent should have attributes like `agentId`, `owner`, and `skills`.
- [x] **`TaskMarketplace.sol`:** The central hub for tasks.
  - `postTask(description, reward, requiredSkill)`: Function for players to post jobs.
  - `acceptTask(taskId, agentId)`: Function for an agent to claim a job.
  - `completeTask(taskId)`: Function for an agent to mark a job as done.
  - Events for all major actions (`TaskPosted`, `TaskAccepted`, `TaskCompleted`).
- [x] **`GameSimulator.sol`:** A simple mock contract for agents to interact with.
  - This simulates the "game" itself.
  - Example function: `performTask(agentId)` which can only be called by a registered agent.
- [x] **Testing:** Write Foundry tests for all contract functions to ensure they work as expected.

### Phase 2: Frontend dApp (The Management Hub)

- [x] **Setup Project:** Use the existing `frontend` Next.js application.
- [x] **Wallet Connection:** Implement wallet connection (e.g., MetaMask) using RainbowKit or wagmi.
- [x] **Agent Minting Page:** A UI to mint a new `AIAgent` NFT.
- [x] **My Agents Dashboard:** A page for users to view their owned AI Agents, their skills, and their current status (e.g., Idle, Working).
- [x] **Task Marketplace Page:**
  - Display all available tasks from the `TaskMarketplace.sol` contract.
  - Listen for `TaskPosted` events to update the list in real-time.
- [x] **Post a Task Form:** A simple form for users to post new jobs to the marketplace.

### Phase 3: The Autonomous AI Agent (The Magic)

- [x] **Create Agent Service:** A Node.js script (`agent-service.js`) that acts as the off-chain "brain" for an agent.
- [x] **Blockchain Listener:** Use viem to listen for `TaskPosted` events on the `TaskMarketplace` contract.
- [x] **Decision Logic:**
  - When a new task is detected, the agent service checks if its skills match the `requiredSkill`.
  - If it's a match, the service calls `acceptTask` on the contract, passing its `agentId`.
- [x] **Task Execution Logic:**
  - After accepting a task, the service calls the `performTask` function on the `GameSimulator.sol` contract.
  - Once the task is done, it calls `completeTask` on the `TaskMarketplace`.
- [x] **Run the Service:** The script will be launched from the terminal, e.g., `node agent-service.js --agentId 1`.

### Phase 4: Demo Polish & Storytelling

- [ ] **Real-time UI Updates:** Use contract event listeners heavily on the frontend to make the dApp feel alive. When an agent accepts a task, the UI should update instantly without a page refresh.
- [ ] **Clear Visual Status:** Add clear visual indicators for task status (e.g., "Open", "In Progress", "Completed") and agent status ("Idle", "Working").
- [ ] **Script the Demo Video:** Plan a clear and concise story for the demo video:
    1.  **The Employer:** A user shows their empty inventory in the "game" and posts a task: "Gather 10 Wood".
    2.  **The Marketplace:** The task appears on the marketplace UI.
    3.  **The Agent:** Show the agent's console window. It detects the new task and prints "New task found. Accepting job...".
    4.  **The Action:** The agent's status on the UI changes to "Working". The console logs "Performing task..." and "Task complete."
    5.  **The Result:** The task status on the UI changes to "Completed". The employer's "Wood" balance in the game UI updates to 10.
- [ ] **Final Polish:** Ensure the UI is clean, professional, and easy to understand.
