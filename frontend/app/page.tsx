'use client';
import { useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent, useReadContract } from 'wagmi';
import { Hex, hexToBytes } from 'viem';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Search, CheckCircle, AlertCircle, Loader2, Zap } from 'lucide-react';

  const MOCK_AI_AGENT_CONTRACT_ADDRESS = "0xE398011BfD41E94e4BF40E1Df64e0960F1E37A2C"; // From your deployed contracts

  const MOCK_AI_AGENT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_somniaOracleAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
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
        "indexed": false,
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "validationStatus",
        "type": "bool"
      }
    ],
    "name": "DataConsumed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "getLastReceivedData",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLastRequestId",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLastValidationStatus",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
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
    "name": "oracleCallback",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_dataSourceIdentifier",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_params",
        "type": "string"
      }
    ],
    "name": "requestDataFromOracle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "somniaOracle",
    "outputs": [
      {
        "internalType": "contract SomniaOracle",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;



export default function Home() {
  const [dataSourceIdentifier, setDataSourceIdentifier] = useState("weather");
  const [params, setParams] = useState("London");

  const dataSources = ["price", "exchange", "weather"];

  const cities = [
    "London", "New York", "Tokyo", "Paris", "Sydney", "Berlin", "Moscow", "Beijing", "Mumbai", "Cairo",
    "Rio de Janeiro", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego",
    "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "San Francisco",
    "Indianapolis", "Seattle", "Denver", "Boston"
  ];

  const coins = [
    "bitcoin", "ethereum", "solana", "cardano", "polygon", "chainlink", "avalanche-2", "polkadot", "dogecoin", "shiba-inu"
  ];

  const currencies = ["USD", "EUR", "GBP", "JPY", "CAD"];
  const [currentRequestId, setCurrentRequestId] = useState<Hex | undefined>(undefined);
  const [receivedData, setReceivedData] = useState<string | undefined>(undefined);
  const [validationStatus, setValidationStatus] = useState<boolean | undefined>(undefined);
  const [txStatus, setTxStatus] = useState<string | undefined>(undefined);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const { data: lastRequestId } = useReadContract({
    address: MOCK_AI_AGENT_CONTRACT_ADDRESS,
    abi: MOCK_AI_AGENT_ABI,
    functionName: 'getLastRequestId',
    query: { refetchInterval: 5000 },
  });

  const { data: lastReceivedData } = useReadContract({
    address: MOCK_AI_AGENT_CONTRACT_ADDRESS,
    abi: MOCK_AI_AGENT_ABI,
    functionName: 'getLastReceivedData',
    query: { refetchInterval: 5000 },
  });

  const { data: lastValidationStatus } = useReadContract({
    address: MOCK_AI_AGENT_CONTRACT_ADDRESS,
    abi: MOCK_AI_AGENT_ABI,
    functionName: 'getLastValidationStatus',
    query: { refetchInterval: 5000 },
  });

  // Listen for DataConsumed event from MockAIAgent
  useWatchContractEvent({
    address: MOCK_AI_AGENT_CONTRACT_ADDRESS,
    abi: MOCK_AI_AGENT_ABI,
    eventName: 'DataConsumed',
    onLogs: logs => {
      for (const log of logs) {
        if (log.args.requestId === currentRequestId) {
          const decodedData = log.args.data ? new TextDecoder().decode(hexToBytes(log.args.data as Hex)) : undefined;
          setReceivedData(decodedData);
          setValidationStatus(log.args.validationStatus);
          setTxStatus("Data received on-chain!");
          console.log("DataConsumed event received:", log.args);
        }
      }
    },
  });

  useEffect(() => {
    if (hash) {
      setTxStatus(`Transaction sent: ${hash}`);
    }
    if (isConfirming) {
      setTxStatus("Waiting for transaction confirmation...");
    }
    if (isConfirmed) {
      setTxStatus("Transaction confirmed. Waiting for oracle fulfillment...");
      if (lastRequestId) {
        setCurrentRequestId(lastRequestId as Hex);
      }
    }
    if (error) {
      setTxStatus(`Error: ${error.message}`);
      console.error("Write contract error:", error);
    }
  }, [hash, isConfirming, isConfirmed, error, lastRequestId]);

  const handleRequestData = async () => {
    setReceivedData(undefined);
    setValidationStatus(undefined);
    setTxStatus("Sending data request...");
    try {
      writeContract({
        address: MOCK_AI_AGENT_CONTRACT_ADDRESS,
        abi: MOCK_AI_AGENT_ABI,
        functionName: 'requestDataFromOracle',
        args: [dataSourceIdentifier, params],
      });
    } catch (err) {
      setTxStatus(`Error: ${(err as Error).message}`);
      console.error("Request data error:", err);
    }
  };

  const handleCheckData = () => {
    if (lastRequestId && currentRequestId && lastRequestId === currentRequestId) {
      if (lastReceivedData) {
        const decodedData = new TextDecoder().decode(hexToBytes(lastReceivedData as Hex));
        setReceivedData(decodedData);
        setValidationStatus(lastValidationStatus as boolean);
        setTxStatus("Data retrieved from contract!");
      } else {
        setTxStatus("No data available yet.");
      }
    } else {
      setTxStatus("No data available for the current request yet. Please wait for oracle fulfillment.");
    }
  };

  const formattedData = useMemo(() => {
    if (!receivedData) return '';
    try {
      const parsed = JSON.parse(receivedData);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return receivedData;
    }
  }, [receivedData]);

  return (
    <main className="flex-grow bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <section className="py-12 text-center">
        <div className="container mx-auto max-w-4xl">
          <Zap className="h-16 w-16 mx-auto mb-4 text-blue-600 dark:text-blue-400 animate-pulse" />
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            OracleMind
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
            Request real-world data securely for your on-chain AI agents. Decentralized, verifiable, and reliable.
          </p>
        </div>
      </section>
      <div className="container mx-auto max-w-4xl">
        <div className="grid gap-8 md:grid-cols-1">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Database className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              <div>
                <CardTitle>Request Data from Oracle</CardTitle>
                <CardDescription>
                  Enter the data source and parameters to request information from the Somnia Oracle.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataSourceIdentifier">Data Source</Label>
                <Select value={dataSourceIdentifier} onValueChange={(value) => {
                  setDataSourceIdentifier(value);
                  setParams(value === "weather" ? "London" :
                            value === "price" ? "bitcoin" :
                            value === "exchange" ? "USD" :
                            "");
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataSources.map(source => (
                      <SelectItem key={source} value={source}>
                        {source === "weather" ? "Weather" :
                         source === "price" ? "Crypto Price Feed" :
                         source === "exchange" ? "Currency Exchange" :
                         source === "joke" ? "Random Joke" :
                         "Random Fact"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {dataSourceIdentifier !== "joke" && dataSourceIdentifier !== "fact" && (
                <div className="space-y-2">
                  <Label htmlFor="params">
                    {dataSourceIdentifier === "weather" ? "City" :
                     dataSourceIdentifier === "price" ? "Cryptocurrency" :
                     "Base Currency"}
                  </Label>
                  {dataSourceIdentifier === "weather" ? (
                    <Select value={params} onValueChange={setParams}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map(city => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : dataSourceIdentifier === "price" ? (
                    <Select value={params} onValueChange={setParams}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a cryptocurrency" />
                      </SelectTrigger>
                      <SelectContent>
                        {coins.map(coin => (
                          <SelectItem key={coin} value={coin}>
                            {coin.charAt(0).toUpperCase() + coin.slice(1).replace('-', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select value={params} onValueChange={setParams}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select base currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              <Button
                onClick={handleRequestData}
                disabled={isPending || isConfirming}
                className="w-full transition-all duration-200 hover:scale-105"
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                {isPending ? "Confirming..." : isConfirming ? "Requesting..." : "Request Data"}
              </Button>
              <Button
                onClick={handleCheckData}
                variant="outline"
                className="w-full mt-2 transition-all duration-200 hover:scale-105"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Check for Received Data
              </Button>
            </CardContent>
          </Card>

          {txStatus && (
            <Alert className="shadow-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{txStatus}</AlertDescription>
            </Alert>
          )}

          {currentRequestId && (
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CheckCircle className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    Request ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-sm break-all ml-2">{currentRequestId}</code>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(currentRequestId)}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {receivedData && (
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-4">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Database className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                <CardTitle>Received Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="whitespace-pre-wrap break-all text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border shadow-inner font-mono max-h-64 overflow-y-auto">
                    {formattedData}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(formattedData)}
                    className="absolute top-2 right-2 transition-all duration-200 hover:scale-105"
                  >
                    Copy
                  </Button>
                </div>
                <p className="mt-4 text-sm flex items-center">
                  <span className="mr-2">Validation Status:</span>
                  <span className={`flex items-center ${validationStatus ? "text-green-600" : "text-red-600"}`}>
                    {validationStatus ? <CheckCircle className="h-4 w-4 mr-1" /> : <AlertCircle className="h-4 w-4 mr-1" />}
                    {validationStatus !== undefined ? (validationStatus ? "Valid" : "Invalid") : "N/A"}
                  </span>
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Note: {dataSourceIdentifier === "weather" ? "Temperature data is in Celsius." :
                         dataSourceIdentifier === "price" ? "Price data is in USD." :
                         "Exchange rates are relative to the base currency."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}