# Somnia AI Agent Data Oracle & Validation Layer

This project is an entry for the Somnia AI Hackathon, focusing on the Infra Track. It aims to build a crucial piece of infrastructure for the Somnia ecosystem: a robust and verifiable data oracle specifically designed for on-chain autonomous AI agents.

## Project Description

Autonomous AI agents operating on the Somnia blockchain require access to reliable, real-world data to make informed decisions and execute complex tasks. However, directly accessing off-chain information from a blockchain is impossible due to its deterministic nature. This project addresses the fundamental "oracle problem" by providing a secure and validated bridge between the off-chain world and Somnia's on-chain AI agents.

### Core Functionality:

1.  **Decentralized Data Request Mechanism:** AI agents (or any smart contract) on Somnia can request specific off-chain data (e.g., weather conditions, market prices, external API responses) through a dedicated Oracle Smart Contract.
2.  **Off-chain Data Fetching & Validation:** A dedicated off-chain oracle service (built with Node.js/TypeScript) listens for these data requests. It fetches the requested information from external sources and performs basic validation to ensure data integrity and plausibility.
3.  **Secure On-chain Fulfillment:** Once validated, the off-chain service securely pushes the data back to the Oracle Smart Contract, which then delivers it to the requesting AI agent via a callback mechanism.
4.  **Enhanced AI Agent Capabilities:** By providing verifiable external data, this oracle empowers Somnia's AI agents to operate with greater intelligence, autonomy, and relevance to real-world events, unlocking a wider range of use cases in DeFi, gaming, and beyond.

### Technologies Used:

*   **Smart Contracts:** Solidity (Foundry)
*   **Frontend dApp:** Next.js, Viem, RainbowKit, shadcn/ui
*   **Off-chain Oracle Service:** Node.js, TypeScript, Viem, Axios, Dotenv

## Deployed Contract Addresses (Somnia Testnet)

*   **SomniaOracle Contract Address:** `0x94E7b61ACfdDA06c74A8e56Fc55261AF94bda9f6`
*   **MockAIAgent Contract Address:** `0x4CCbFFc188a51fe7E983D64252389E31C1AC9a74`

## Setup and Installation

### Smart Contracts

1.  **Navigate to the `contracts` directory:**
    ```bash
    cd contracts
    ```
2.  **Install Foundry dependencies (if not already done):**
    ```bash
    forge install
    ```
3.  **Compile contracts:**
    ```bash
    forge build
    ```
4.  **Run tests:**
    ```bash
    forge test
    ```

### Off-chain Oracle Service

1.  **Navigate to the `contracts/oracle-service` directory:**
    ```bash
    cd contracts/oracle-service
    ```
2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file** in this directory with the following content (replace placeholders):
    ```
    # Somnia Testnet RPC URL
    SOMNIA_RPC_URL=YOUR_SOMNIA_TESTNET_RPC_URL

    # Private key of the wallet that will send transactions to the SomniaOracle contract.
    # This address must be the one passed into the SomniaOracle constructor.
    # IMPORTANT: Do NOT commit this file with a real private key to a public repository!
    ORACLE_SERVICE_PRIVATE_KEY=YOUR_ORACLE_SERVICE_PRIVATE_KEY

    # API Key for OpenWeatherMap
    OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY

    # Deployed SomniaOracle Contract Address
    SOMNIA_ORACLE_CONTRACT_ADDRESS=0x94E7b61ACfdDA06c74A8e56Fc55261AF94bda9f6
    ```
4.  **Run the oracle service:**
    ```bash
    npm run start # You might need to add a "start" script in package.json: "start": "ts-node src/index.ts"
    ```

### Frontend dApp

1.  **Navigate to the `frontend` directory:**
    ```bash
    cd frontend
    ```
2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Somnia Testnet in `frontend/app/providers.tsx`:**
    - Update `id`, `name`, `nativeCurrency`, `rpcUrls`, and `blockExplorers` for `somniaTestnet`.
    - Replace `YOUR_WALLETCONNECT_PROJECT_ID` with your actual WalletConnect Project ID.
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture Diagram

[//]: # (TODO: Insert Architecture Diagram here)

## How to Use the Frontend dApp

1.  Connect your wallet (configured for Somnia Testnet) using the "Connect Wallet" button.
2.  Enter a `dataSourceIdentifier` (e.g., `weather`) and `params` (e.g., `London`).
3.  Click "Request Data" to send a transaction to the `MockAIAgent` contract.
4.  Observe the off-chain oracle service logs as it picks up the request, fetches data, validates it, and fulfills the request on-chain.
5.  The dApp will update to display the received data and validation status once the oracle fulfills the request.

## Key Features and Functionality

*   Decentralized data requests via `SomniaOracle` smart contract.
*   Off-chain service for fetching and validating real-world data (OpenWeatherMap example).
*   Secure on-chain data fulfillment to `MockAIAgent` consumer.
*   Frontend dApp for easy interaction and demonstration.

## Future Enhancements

*   Support for multiple data sources and more complex data types.
*   Advanced data validation mechanisms (e.g., consensus from multiple oracles).
*   Reputation system for oracle service providers.
*   Integration with actual AI agent logic beyond a mock consumer.
*   Gas optimization for on-chain transactions.

## Demo Video

[//]: # (TODO: Insert link to your 5-minute demo video here)
