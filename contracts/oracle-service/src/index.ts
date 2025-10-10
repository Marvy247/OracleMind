import { createWalletClient, http, publicActions, createPublicClient, Hex, toHex, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';
import axios from 'axios';

// --- Configuration ---
const SOMNIA_RPC_URL = process.env.SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network/';
const ORACLE_SERVICE_PRIVATE_KEY = process.env.ORACLE_SERVICE_PRIVATE_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const SOMNIA_ORACLE_CONTRACT_ADDRESS = process.env.SOMNIA_ORACLE_CONTRACT_ADDRESS as `0x${string}`;

if (!ORACLE_SERVICE_PRIVATE_KEY) {
    console.error('ORACLE_SERVICE_PRIVATE_KEY is not set in .env');
    process.exit(1);
}
if (!OPENWEATHER_API_KEY) {
    console.error('OPENWEATHER_API_KEY is not set in .env');
    process.exit(1);
}
if (!SOMNIA_ORACLE_CONTRACT_ADDRESS) {
    console.error('SOMNIA_ORACLE_CONTRACT_ADDRESS is not set in .env');
    process.exit(1);
}

// --- Viem Client Setup ---
const account = privateKeyToAccount(ORACLE_SERVICE_PRIVATE_KEY as `0x${string}`);

// TODO: Replace 'mainnet' with the actual Somnia Testnet chain definition
// You might need to define a custom chain object if Viem doesn't have Somnia built-in.
const somniaTestnet = defineChain({
  id: 50312, // Somnia Testnet Chain ID
  name: 'Somnia Testnet',
  nativeCurrency: { name: 'Somnia Token', symbol: 'SOMI', decimals: 18 },
  rpcUrls: {
    default: { http: [SOMNIA_RPC_URL] },
    public: { http: [SOMNIA_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://dream-rpc.somnia.network/explorer' },
  },
});

const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: http(SOMNIA_RPC_URL),
});

const walletClient = createWalletClient({
    account,
    chain: somniaTestnet,
    transport: http(SOMNIA_RPC_URL),
}).extend(publicActions);

console.log(`Oracle Service Address: ${walletClient.account.address}`);
console.log(`Connected to Somnia RPC: ${SOMNIA_RPC_URL}`);

// --- SomniaOracle ABI (simplified for DataRequested event and fulfillData function) ---
// You would typically import the full ABI from your compiled contracts
const somniaOracleABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "requestId",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "consumer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "dataSourceIdentifier",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "params",
                "type": "string"
            }
        ],
        "name": "DataRequested",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_requestId",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "_data",
                "type": "bytes"
            },
            {
                "internalType": "bool",
                "name": "_validationStatus",
                "type": "bool"
            }
        ],
        "name": "fulfillData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

// --- Event Listener ---
async function listenForDataRequests() {
    console.log("Listening for DataRequested events...");

    publicClient.watchContractEvent({
        address: SOMNIA_ORACLE_CONTRACT_ADDRESS,
        abi: somniaOracleABI,
        eventName: 'DataRequested',
        onLogs: logs => {
            for (const log of logs) {
                const { requestId, consumer, dataSourceIdentifier, params } = log.args;
                if (requestId && consumer && dataSourceIdentifier && params) {
                    console.log(`
--- New Data Request ---`);
                    console.log(`Request ID: ${requestId}`);
                    console.log(`Consumer: ${consumer}`);
                    console.log(`Data Source: ${dataSourceIdentifier}`);
                    console.log(`Params: ${params}`);
                    processDataRequest(requestId, consumer, dataSourceIdentifier, params);
                }
            }
        },
        onError: error => {
            console.error("Error watching DataRequested events:", error);
        },
    });
}

// --- Data Fetching Logic ---
async function fetchData(dataSourceIdentifier: string, params: string): Promise<{
    data: string; validationStatus: boolean
}> {
    let data: string = '';
    let validationStatus: boolean = false;

    try {
        if (dataSourceIdentifier === 'weather') {
            const city = params;
            const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;
            const response = await axios.get(weatherApiUrl);

            if (response.data && response.data.main && response.data.weather) {
                const temperature = response.data.main.temp;
                const description = response.data.weather[0].description;
                data = JSON.stringify({ temperature, description });
                // Basic validation: temperature is within a reasonable range
                validationStatus = temperature > -50 && temperature < 50; // -50 to 50 Celsius
                console.log(`Fetched weather for ${city}: ${temperature}°C, ${description}. Valid: ${validationStatus}`);
            } else {
                console.warn(`Could not parse weather data for ${city}.`);
            }
        } else if (dataSourceIdentifier === 'price') {
            const coinId = params;
            const priceApiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
            const response = await axios.get(priceApiUrl);

            if (response.data && response.data[coinId]) {
                const price = response.data[coinId].usd;
                data = JSON.stringify({ price });
                // Basic validation: price should be positive
                validationStatus = price > 0;
                console.log(`Fetched price for ${coinId}: $${price}. Valid: ${validationStatus}`);
            } else {
                console.warn(`Could not parse price data for ${coinId}.`);
            }
        } else if (dataSourceIdentifier === 'exchange') {
            const baseCurrency = params;
            const exchangeApiUrl = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
            const response = await axios.get(exchangeApiUrl);

            if (response.data && response.data.rates) {
                const rates = response.data.rates;
                data = JSON.stringify({ base: baseCurrency, rates });
                // Basic validation: rates object exists
                validationStatus = Object.keys(rates).length > 0;
                console.log(`Fetched exchange rates for ${baseCurrency}. Valid: ${validationStatus}`);
            } else {
                console.warn(`Could not parse exchange data for ${baseCurrency}.`);
            }
        } else {
            console.warn(`Unsupported data source identifier: ${dataSourceIdentifier}`);
            data = JSON.stringify({ error: "Unsupported data source" });
        }
    } catch (error) {
        console.error(`Error fetching data for ${dataSourceIdentifier} with params ${params}:`, error);
        data = JSON.stringify({ error: (error as Error).message });
    }

    return { data, validationStatus };
}

// --- Data Processing (Main Logic) ---
async function processDataRequest(
    requestId: Hex,
    consumerAddress: `0x${string}`,
    dataSourceIdentifier: string,
    params: string
) {
    console.log(`Processing request ${requestId} for ${dataSourceIdentifier} with params ${params}...`);

    const { data, validationStatus } = await fetchData(dataSourceIdentifier, params);

    console.log(`Attempting to fulfill request ${requestId} with data: ${data}, validation: ${validationStatus}`);

    try {
        const dataBytes = toHex(Buffer.from(data));
        const { request } = await publicClient.simulateContract({
            address: SOMNIA_ORACLE_CONTRACT_ADDRESS,
            abi: somniaOracleABI,
            functionName: 'fulfillData',
            args: [requestId, dataBytes, validationStatus],
            account: walletClient.account,
        });

        const hash = await walletClient.writeContract(request);
        console.log(`Transaction sent to fulfill request ${requestId}: ${hash}`);

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log(`Transaction confirmed for request ${requestId} in block ${receipt.blockNumber}`);
    } catch (error) {
        console.error(`Failed to fulfill request ${requestId}:`, error);
    }
}

// Start listening when the script runs
listenForDataRequests();