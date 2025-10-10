# Somnia AI Agent Data Oracle & Validation Layer MVP - To-Do List

This document outlines the tasks required to build a Minimum Viable Product (MVP) for a decentralized AI agent data oracle and validation layer on the Somnia Testnet.

## I. Smart Contracts (Solidity)

### 1. Project Setup & Dependencies
- [x] Initialize Foundry project (if not already done).
- [x] Install OpenZeppelin Contracts (for utilities like `Ownable` if needed).

### 2. Oracle Smart Contract (`SomniaOracle.sol`)
- [x] Define `DataRequested` event: `event DataRequested(bytes32 indexed requestId, address indexed consumer, string dataSourceIdentifier, string params);`
- [x] Define `DataFulfilled` event: `event DataFulfilled(bytes32 indexed requestId, bytes data, bool validationStatus);`
- [x] Implement `requestData(string _dataSourceIdentifier, string _params)` function:
    - [x] Generate a unique `requestId` (e.g., using `keccak256`).
    - [x] Store mapping from `requestId` to `consumer` address.
    - [x] Emit `DataRequested` event.
    - [x] Return `requestId`.
- [x] Implement `fulfillData(bytes32 _requestId, bytes _data, bool _validationStatus)` function:
    - [x] Add access control (e.g., `onlyOracleService` modifier) to ensure only the off-chain oracle can call this.
    - [x] Retrieve `consumer` address using `_requestId`.
    - [x] Call a callback function on the `consumer` contract to deliver the data.
    - [x] Emit `DataFulfilled` event.
- [x] Implement basic storage for fulfilled data (e.g., `mapping(bytes32 => bytes) public fulfilledData;`).

### 3. Mock AI Agent (Consumer) Smart Contract (`MockAIAgent.sol`)
- [x] Define `DataConsumed` event: `event DataConsumed(bytes32 indexed requestId, bytes data, bool validationStatus);`
- [x] Implement `requestDataFromOracle(address _oracleAddress, string _dataSourceIdentifier, string _params)` function:
    - [x] Call `_oracleAddress.requestData(_dataSourceIdentifier, _params)`.
    - [x] Store the returned `requestId`.
- [x] Implement `oracleCallback(bytes32 _requestId, bytes _data, bool _validationStatus)` function:
    - [x] Add access control (e.g., `onlyOracle` modifier) to ensure only the `SomniaOracle` can call this.
    - [x] Store the received `_data` and `_validationStatus`.
    - [x] Emit `DataConsumed` event.
    - [x] (Optional) Implement simple logic to "use" the data (e.g., update an internal state variable).

### 4. Testing & Deployment
- [x] Write unit tests for `SomniaOracle.sol` (request, fulfill, access control).
- [x] Write unit tests for `MockAIAgent.sol` (request, callback, access control).
- [x] Compile and deploy both contracts to the Somnia Testnet.
- [x] Record deployed contract addresses:
    - SomniaOracle Contract Address: `0x94E7b61ACfdDA06c74A8e56Fc55261AF94bda9f6`
    - MockAIAgent Contract Address: `0x4CCbFFc188a51fe7E983D64252389E31C1AC9a74`

## II. Off-chain Oracle Service (Node.js/TypeScript)

### 1. Project Setup
- [x] Initialize Node.js/TypeScript project (`npm init -y`, `tsc --init`).
- [x] Install dependencies: `viem`, `axios` (for API calls), `dotenv` (for environment variables).
- [x] Configure `tsconfig.json` for appropriate target and module settings.

### 2. Somnia Testnet Connection
- [x] Set up `viem` client to connect to the Somnia Testnet RPC endpoint.
- [x] Configure a wallet (private key from `.env`) for sending fulfillment transactions.

### 3. Event Listener
- [x] Create a function to listen for `DataRequested` events from the deployed `SomniaOracle` contract.
- [x] When an event is received, extract `requestId`, `consumerAddress`, `dataSourceIdentifier`, and `params`.

### 4. Data Fetching Logic
- [x] Implement a function to fetch data based on `dataSourceIdentifier` and `params`.
    - [x] **MVP Example:** If `dataSourceIdentifier` is "weather", call a public weather API (e.g., OpenWeatherMap) using `axios` with `params` (e.g., city name).
    - [x] Handle API errors and rate limits.

### 5. Basic Data Validation Logic
- [x] Implement a simple validation function.
    - [x] **MVP Example:** For weather data, check if temperature is within a plausible range (-100 to 100 Celsius/Fahrenheit). Return `true` or `false` for `validationStatus`.

### 6. Data Fulfillment Logic
- [x] Implement a function to call `fulfillData` on the `SomniaOracle` contract.
- [x] Use `viem` to construct and send the transaction.
- [x] Ensure proper gas estimation and transaction confirmation.
- [x] Log success or failure of fulfillment.

### 7. Main Loop
- [x] Combine event listener, data fetching, validation, and fulfillment into a continuous process.
- [x] Add error handling and logging for the entire service.

## III. Frontend dApp (Next.js with Viem & RainbowKit)

### 1. Project Setup
- [x] Create a new Next.js project (`npx create-next-app@latest --typescript --tailwind --eslint`). (Adapted: using existing project)
- [x] Install `viem` and `rainbowkit` dependencies.
- [x] Configure `wagmi` and `rainbowkit` providers in `layout.tsx` or `providers.tsx` to connect to Somnia Testnet.
- [x] Integrate `shadcn/ui` into the existing Next.js project.

### 2. UI Components
- [x] **Wallet Connection:** Implement RainbowKit's `ConnectButton`.
- [x] **Oracle Interaction Form:**
    - [x] Input field for `dataSourceIdentifier` (e.g., "weather").
    - [x] Input field for `params` (e.g., "London").
    - [x] Button to "Request Data" (calls `requestDataFromOracle` on `MockAIAgent`).
- [x] **Data Display Area:**
    - [x] Show loading state after requesting data.
    - [x] Display the `requestId` once generated.
    - [x] Display the fetched `data` and `validationStatus` once the `DataConsumed` event is received by the `MockAIAgent`.
    - [x] Display transaction status/feedback (e.g., "Transaction sent...", "Data received!").

### 3. Frontend Logic
- [x] Implement `viem` hooks to interact with the deployed `MockAIAgent` contract:
    - [x] `useWriteContract` for calling `requestDataFromOracle`.
    - [x] `useWatchContractEvent` for listening to `DataConsumed` events from `MockAIAgent`.
- [x] Handle wallet connection and network switching.
- [x] Display user-friendly messages for all interactions.

## IV. Deployment & Demo Preparation

### 1. Deployment
- [ ] Deploy the Next.js dApp to a hosting service (e.g., Vercel, Netlify).

### 2. Documentation (`README.md`)
- [x] Write a comprehensive `README.md` in your GitHub repository:
    - [x] Project Title and Description.
    - [x] Problem Statement and Solution Overview.
    - [x] Technologies Used.
    - [x] **Deployed Contract Addresses (Somnia Testnet).**
    - [x] **Architecture Diagram (visual representation of the system flow).**
    - [x] Setup and Installation Instructions (for contracts, off-chain service, and frontend).
    - [x] How to Run the Off-chain Oracle Service.
    - [x] How to Use the Frontend dApp.
    - [x] Key Features and Functionality.
    - [x] Future Enhancements.
    - [ ] **Link to Demo Video.**

### 3. Demo Video (5 minutes max)
- [ ] **Script:** Outline a clear narrative: Problem -> Solution -> Live Demo -> Impact.
- [ ] **Visuals:** Ensure clean UI, clear console output for the oracle service, and show blockchain explorer for transactions.
- [ ] **Practice:** Rehearse the demo multiple times to ensure smooth flow and adherence to the time limit.
- [ ] **Pre-record & Edit:** Edit out any waiting times, network delays, or minor errors for a seamless presentation.
- [ ] **Audio:** Ensure clear and concise narration.

---
**Remember to commit your code regularly and push to your public GitHub repository!**