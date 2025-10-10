'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent, useReadContract } from 'wagmi';
import { parseEther, Hex, hexToBytes } from 'viem';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

  // TODO: Replace with actual ABI and contract addresses
  const MOCK_AI_AGENT_CONTRACT_ADDRESS = "0xE398011BfD41E94e4BF40E1Df64e0960F1E37A2C"; // From your deployed contracts
  const ORACLE_CONTRACT_ADDRESS = "0x94E7b61ACfdDA06c74A8e56Fc55261AF94bda9f6"; // SomniaOracle address
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

const SOMNIA_ORACLE_CONTRACT_ADDRESS = "0x94E7b61ACfdDA06c74A8e56Fc55261AF94bda9f6"; // From your deployed contracts

export default function Home() {
  const [dataSourceIdentifier, setDataSourceIdentifier] = useState("weather");
  const [params, setParams] = useState("London");
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
  });

  const { data: lastReceivedData } = useReadContract({
    address: MOCK_AI_AGENT_CONTRACT_ADDRESS,
    abi: MOCK_AI_AGENT_ABI,
    functionName: 'getLastReceivedData',
  });

  const { data: lastValidationStatus } = useReadContract({
    address: MOCK_AI_AGENT_CONTRACT_ADDRESS,
    abi: MOCK_AI_AGENT_ABI,
    functionName: 'getLastValidationStatus',
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
    if (lastReceivedData) {
      const decodedData = new TextDecoder().decode(hexToBytes(lastReceivedData as Hex));
      setReceivedData(decodedData);
      setValidationStatus(lastValidationStatus as boolean);
      setTxStatus("Data retrieved from contract!");
    } else {
      setTxStatus("No data available yet.");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-4xl">
        <header className="flex justify-between items-center py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Somnia AI Agent Data Oracle
          </h1>
          <ConnectButton />
        </header>

        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Request Data from Oracle</CardTitle>
              <CardDescription>
                Enter the data source and parameters to request information from the Somnia Oracle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataSourceIdentifier">Data Source Identifier</Label>
                <Input
                  id="dataSourceIdentifier"
                  type="text"
                  value={dataSourceIdentifier}
                  onChange={(e) => setDataSourceIdentifier(e.target.value)}
                  placeholder="e.g., weather"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="params">Parameters (e.g., City for weather)</Label>
                <Input
                  id="params"
                  type="text"
                  value={params}
                  onChange={(e) => setParams(e.target.value)}
                  placeholder="e.g., London"
                />
              </div>
              <Button
                onClick={handleRequestData}
                disabled={isPending || isConfirming}
                className="w-full"
              >
                {isPending ? "Confirming..." : isConfirming ? "Requesting..." : "Request Data"}
              </Button>
              <Button
                onClick={handleCheckData}
                variant="outline"
                className="w-full mt-2"
              >
                Check for Received Data
              </Button>
            </CardContent>
          </Card>

          {txStatus && (
            <Alert>
              <AlertDescription>{txStatus}</AlertDescription>
            </Alert>
          )}

          {currentRequestId && (
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Request ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{currentRequestId}</code>
                </p>
              </CardContent>
            </Card>
          )}

          {receivedData && (
            <Card>
              <CardHeader>
                <CardTitle>Received Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap break-all text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded border">
                  {receivedData}
                </pre>
                <p className="mt-2 text-sm">
                  Validation Status: <span className={validationStatus ? "text-green-600" : "text-red-600"}>
                    {validationStatus !== undefined ? (validationStatus ? "Valid" : "Invalid") : "N/A"}
                  </span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}