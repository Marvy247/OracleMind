// PixelGig - Autonomous Agent Service

import 'dotenv/config';
import { createPublicClient, createWalletClient, http, publicActions, walletActions, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

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

// --- CONFIGURATION ---
// You can replace these with imports from your frontend config if using a shared workspace
const AIAgentAddress = "0x0118adCb8FAAF31108Ba9A4d1da1b3cB6caD9f4f";
const TaskMarketplaceAddress = "0x9A57E71fD30d9974949d9070Fc7AF4f6EfC9e441";
const GameSimulatorAddress = "0x21C16137496B23a79b1a35cf7E7D64DA4849BDf1";

// Paste the ABIs here (truncated for brevity in this example)
const AIAgentABI = [{"type":"constructor","inputs":[{"name":"initialOwner","type":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"getAgentSkill","inputs":[{"name":"tokenId","type":"uint256"}],"outputs":[{"name":"","type":"uint8"}],"stateMutability":"view"},{"type":"function","name":"ownerOf","inputs":[{"name":"tokenId","type":"uint256"}],"outputs":[{"name":"","type":"address"}],"stateMutability":"view"}, {"type":"function","name":"totalSupply","inputs":[],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view"}, {"type":"error","name":"ERC721NonexistentToken","inputs":[{"name":"tokenId","type":"uint256"}]}];
const TaskMarketplaceABI = [{"type":"constructor","inputs":[{"name":"_aiAgentContractAddress","type":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"acceptTask","inputs":[{"name":"taskId","type":"uint256"},{"name":"agentId","type":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"TaskPosted","inputs":[{"name":"taskId","type":"uint256","indexed":true},{"name":"employer","type":"address","indexed":true},{"name":"reward","type":"uint256"},{"name":"requiredSkill","type":"uint8"}],"anonymous":false}];
const GameSimulatorABI = [{"type":"constructor","inputs":[{"name":"_taskMarketplaceAddress","type":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"performTask","inputs":[{"name":"taskId","type":"uint256"}],"outputs":[],"stateMutability":"nonpayable"}];

// --- AGENT SETUP ---
const agentId = process.argv[2];
if (!agentId) {
  console.error("Please provide an agent ID. Usage: node agent-service.js <agentId>");
  process.exit(1);
}

let privateKey = process.env.AGENT_PRIVATE_KEY;
if (!privateKey) {
  console.error("AGENT_PRIVATE_KEY environment variable not set.");
  process.exit(1);
}
if (!privateKey.startsWith('0x')) {
  privateKey = '0x' + privateKey;
}

const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({ chain: somniaTestnet, transport: http() });
const walletClient = createWalletClient({ account, chain: somniaTestnet, transport: http() }).extend(publicActions).extend(walletActions);

console.log(`🤖 Agent #${agentId} starting up...`);
console.log(`   Wallet Address: ${account.address}`);

async function main() {
  // 1. Verify this agent exists and is owned by this wallet
  let agentExists = false;
  let agentSkill = 0;
  try {
    const owner = await publicClient.readContract({
      address: AIAgentAddress,
      abi: AIAgentABI,
      functionName: 'ownerOf',
      args: [BigInt(agentId)]
    });
    if (owner.toLowerCase() !== account.address.toLowerCase()) {
      console.error(`Error: This wallet does not own Agent #${agentId}. Owner is ${owner}.`);
      process.exit(1);
    }
    agentExists = true;
  } catch (e) {
    console.log(`Agent #${agentId} not found or not owned by this wallet. Continuing without ownership verification.`);
  }

  // 2. Get the agent's skill if it exists
  if (agentExists) {
    try {
      agentSkill = await publicClient.readContract({
        address: AIAgentAddress,
        abi: AIAgentABI,
        functionName: 'getAgentSkill',
        args: [BigInt(agentId)]
      });
      console.log(`   Skill Level: ${agentSkill}`);
    } catch (e) {
      console.error(`Error: Could not get skill for Agent #${agentId}. Setting to 0. Error: ${e.message}`);
      agentSkill = 0;
    }
  } else {
    console.log(`   Skill Level: Not available (agent not minted)`);
  }

  // 3. Listen for new tasks
  console.log("\n👂 Listening for new tasks on the marketplace...");
  publicClient.watchContractEvent({
    address: TaskMarketplaceAddress,
    abi: TaskMarketplaceABI,
    eventName: 'TaskPosted',
    onLogs: async (logs) => {
      for (const log of logs) {
        const { taskId, requiredSkill } = log.args;
        console.log(`\n✨ New Task #${taskId} detected! Required skill: ${requiredSkill}`);

        // 4. Decide if qualified
        if (agentSkill === requiredSkill) {
          console.log(`   ✅ Agent is qualified. Attempting to accept task...`);
          try {
            // 5. Accept the task
            const acceptHash = await walletClient.writeContract({
              address: TaskMarketplaceAddress,
              abi: TaskMarketplaceABI,
              functionName: 'acceptTask',
              args: [taskId, BigInt(agentId)]
            });
            console.log(`   Transaction sent to accept task: ${acceptHash}`);
            const acceptReceipt = await publicClient.waitForTransactionReceipt({ hash: acceptHash });
            if (acceptReceipt.status === 'success') {
              console.log(`   ✅ Task #${taskId} accepted successfully!`);
              
              // 6. Perform the task
              console.log(`   💪 Performing task...`);
              const performHash = await walletClient.writeContract({
                address: GameSimulatorAddress,
                abi: GameSimulatorABI,
                functionName: 'performTask',
                args: [taskId]
              });
              console.log(`   Transaction sent to perform task: ${performHash}`);
              const performReceipt = await publicClient.waitForTransactionReceipt({ hash: performHash });
              if (performReceipt.status === 'success') {
                console.log(`   🎉 Task #${taskId} completed and reward claimed!`);
              } else {
                console.error(`   ❌ Failed to perform task. Transaction reverted.`);
              }
            } else {
              console.error(`   ❌ Failed to accept task. Transaction reverted.`);
            }
          } catch (error) {
            console.error(`   An error occurred while processing task #${taskId}:`, error.message);
          }
        } else {
          console.log(`   ❌ Agent not qualified for this task.`);
        }
      }
    }
  });
}

main().catch(console.error);
