'use client';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useReadContracts } from 'wagmi';
import { useState, useEffect, useMemo } from 'react';
import { parseEther, formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AIAgentAddress, AIAgentABI, TaskMarketplaceAddress, TaskMarketplaceABI, GameSimulatorAddress, GameSimulatorABI } from '@/lib/contractConfig';
import { Loader2, Pickaxe, Axe, Fish } from 'lucide-react';
import { toast } from 'sonner';

const SKILL_MAP = new Map<number, { name: string, icon: React.ComponentType<any> }>([
  [1, { name: 'Mining', icon: Pickaxe }],
  [2, { name: 'Woodcutting', icon: Axe }],
  [3, { name: 'Fishing', icon: Fish }],
]);

// --- Accept Task Dialog ---
function AcceptTaskDialog({ task, ownedAgents, onAccept }: { task: any, ownedAgents: any[], onAccept: (taskId: bigint, agentId: bigint) => void }) {
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const qualifiedAgents = ownedAgents.filter(agent => SKILL_MAP.get(task.requiredSkill)?.name === agent.skill);

  const handleAccept = () => {
    if (!selectedAgent) return;
    onAccept(task.taskId, BigInt(selectedAgent));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={qualifiedAgents.length === 0}>Accept Task</Button>
      </DialogTrigger>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>Accept Task #{String(task.taskId)}</DialogTitle>
          <DialogDescription>Select one of your qualified agents to perform this task.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p>Required Skill: <strong>{SKILL_MAP.get(task.requiredSkill)?.name}</strong></p>
          <Select onValueChange={setSelectedAgent}>
            <SelectTrigger>
              <SelectValue placeholder="Select a qualified agent..." />
            </SelectTrigger>
            <SelectContent>
              {qualifiedAgents.map(agent => (
                <SelectItem key={agent.id} value={String(agent.id)}>Agent #{agent.id} ({agent.skill})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={handleAccept} disabled={!selectedAgent}>Confirm & Accept</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Task Marketplace Tab ---
function TaskMarketplaceTab({ ownedAgents, refetchTasks }: { ownedAgents: any[], refetchTasks: () => void }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [acceptedTask, setAcceptedTask] = useState<any>(null);
  const { data: taskCountData, isLoading: isTaskCountLoading, refetch: localRefetchTasks } = useReadContract({
    address: TaskMarketplaceAddress,
    abi: TaskMarketplaceABI,
    functionName: 'getTaskCount',
  });
  const taskCount = taskCountData ? Number((taskCountData as bigint) || 0n) : 0;
  console.log('Task count:', taskCount);

  const taskContracts = useMemo(() => {
    if (taskCount === 0) return [];
    return Array.from({ length: taskCount }, (_, i) => i).map(taskId => ({
      address: TaskMarketplaceAddress,
      abi: TaskMarketplaceABI,
      functionName: 'getTask',
      args: [BigInt(taskId + 1)],
    }));
  }, [taskCount]);

  const { data: tasksData, isLoading: areTasksLoading } = useReadContracts({ contracts: taskContracts });
  console.log('Task contracts:', taskContracts);
  console.log('Tasks data:', tasksData);

  useEffect(() => {
    if (tasksData) {
      console.log('Processing tasks data:', tasksData);
      const openTasks = (tasksData as any[])
        .filter(taskResult => {
          console.log('Task result:', taskResult);
          console.log('Task result status:', taskResult.result?.status);
          return taskResult.status === 'success' && taskResult.result && taskResult.result.status === 0;
        }) // 0 = OPEN
        .map(taskResult => taskResult.result);
      setTasks(openTasks);
      console.log('Fetched tasks:', openTasks);
      console.log('All tasks data:', tasksData);
    }
  }, [tasksData]);

  const { data: hash, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });



  const handleAcceptTask = (taskId: bigint, agentId: bigint, task: any) => {
    setAcceptedTask(task);
    writeContract({
      address: TaskMarketplaceAddress,
      abi: TaskMarketplaceABI,
      functionName: 'acceptTask',
      args: [taskId, agentId],
    });
  };

  useEffect(() => {
    if (isConfirmed && acceptedTask) {
      setAcceptedTask(null);
    }
  }, [isConfirmed, acceptedTask]);

  useEffect(() => {
    if (isConfirmed && !acceptedTask) {
      toast.success("Task Accepted!", { description: "Your agent is now on the job." });
      localRefetchTasks();
    }
  }, [isConfirmed, acceptedTask, localRefetchTasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Tasks</CardTitle>
        <CardDescription>Browse and accept tasks for your AI agents.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Reward (SOMI)</TableHead>
              <TableHead>Required Skill</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areTasksLoading ? (
              <TableRow><TableCell colSpan={5}>Loading tasks...</TableCell></TableRow>
            ) : tasks.length > 0 ? tasks.map(task => (
              <TableRow key={String(task.taskId)}>
                <TableCell>{String(task.taskId)}</TableCell>
                <TableCell>{task.description}</TableCell>
                <TableCell>{formatEther(task.reward)} SOMI</TableCell>
                <TableCell>{SKILL_MAP.get(task.requiredSkill)?.name}</TableCell>
                <TableCell>
                  <AcceptTaskDialog task={task} ownedAgents={ownedAgents} onAccept={(taskId, agentId) => handleAcceptTask(taskId, agentId, task)} />
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={5}>No open tasks available.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// --- My Agents Tab ---
function MyAgentsTab({ ownedAgents, isLoading, onMint, woodInventory, refetchAgents, hash: mintHash }: { ownedAgents: any[], isLoading: boolean, onMint: (skill: number) => void, woodInventory: number, refetchAgents: () => void, hash: `0x${string}` | undefined }) {
  const [selectedSkill, setSelectedSkill] = useState(1);
  
  const [showGallery, setShowGallery] = useState(false);
  const [allAgents, setAllAgents] = useState<any[]>([]);

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });



  const { data: totalSupplyData, isLoading: isTotalSupplyLoading, refetch: refetchTotalSupply } = useReadContract({
    address: AIAgentAddress,
    abi: AIAgentABI,
    functionName: 'totalSupply',
  });
  const totalSupply = totalSupplyData ? Number(totalSupplyData as bigint) : 0;

  const { isSuccess: isMintConfirmed } = useWaitForTransactionReceipt({ hash: mintHash });

  useEffect(() => {
    if (isMintConfirmed) {
      refetchTotalSupply();
    }
  }, [isMintConfirmed, refetchTotalSupply]);

  const tokenIdContracts = useMemo(() => {
    if (totalSupply === 0) return [];
    return Array.from({ length: totalSupply }, (_, i) => ({
      address: AIAgentAddress,
      abi: AIAgentABI,
      functionName: 'tokenByIndex',
      args: [BigInt(i)],
    }));
  }, [totalSupply]);

  const { data: tokenIdsData, isLoading: areTokenIdsLoading } = useReadContracts({ contracts: tokenIdContracts });

  const tokenIds = useMemo(() => {
    if (!tokenIdsData) return [];
    return tokenIdsData.filter(d => d.status === 'success').map(d => d.result as bigint);
  }, [tokenIdsData]);

  const agentContracts = useMemo(() => {
    if (tokenIds.length === 0) return [];
    const contracts: any[] = [];
    tokenIds.forEach(tokenId => {
      contracts.push({
        address: AIAgentAddress,
        abi: AIAgentABI,
        functionName: 'ownerOf',
        args: [tokenId],
      });
      contracts.push({
        address: AIAgentAddress,
        abi: AIAgentABI,
        functionName: 'getAgentSkill',
        args: [tokenId],
      });
    });
    return contracts;
  }, [tokenIds]);

  const { data: agentsData, isLoading: areAgentsLoading } = useReadContracts({ contracts: agentContracts });

  useEffect(() => {
    if (agentsData && tokenIds.length > 0) {
      const newAgents = [];
      for (let i = 0; i < tokenIds.length; i++) {
        const tokenId = tokenIds[i];
        const owner = agentsData[i * 2]?.result as string;
        const skillNum = Number(agentsData[i * 2 + 1]?.result);
        const skillData = SKILL_MAP.get(skillNum);
        newAgents.push({
          id: Number(tokenId),
          owner: owner ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : 'Unknown',
          skill: skillData?.name || 'Unknown',
          icon: skillData?.icon || null,
        });
      }
      setAllAgents(newAgents);
    }
  }, [agentsData, tokenIds]);

  const handleMint = () => {
    onMint(selectedSkill);
  };



  return (
    <Card>
      <CardHeader>
        <CardTitle>My AI Agents</CardTitle>
        <CardDescription>Manage your agent NFTs and mint new ones.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {isLoading ? <p>Loading your agents...</p> :
            ownedAgents.length > 0 ? ownedAgents.map(agent => (
              <Card key={agent.id} className="glow">
                <CardHeader><CardTitle>AI Agent #{agent.id}</CardTitle></CardHeader>
                <CardContent>
                  <p className="flex items-center">
                    {agent.icon && <agent.icon className="inline mr-2 h-5 w-5" />}
                    <span className="font-medium">{agent.skill}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Ready for tasks</p>
                </CardContent>
              </Card>
            )) : <p>You don't own any agents yet.</p>
          }
        </div>
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">Mint a New Agent</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-auto flex-grow">
            <Label htmlFor="skill-select">Agent Skill</Label>
            <Select onValueChange={(value) => setSelectedSkill(Number(value))} defaultValue={String(selectedSkill)}>
              <SelectTrigger id="skill-select"><SelectValue placeholder="Select a skill" /></SelectTrigger>
              <SelectContent>
                {Array.from(SKILL_MAP.entries()).map(([key, skill]) => (
                  <SelectItem key={String(key)} value={String(key)}>
                    <skill.icon className="inline mr-2 h-4 w-4" />
                    {skill.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
            <Button onClick={handleMint} disabled={isPending || isConfirming} className="w-full sm:w-auto">
              {isPending || isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isConfirming ? 'Minting...' : 'Mint Agent'}
            </Button>
            <Button onClick={refetchAgents} variant="outline" className="w-full sm:w-auto">
              Refresh Agents
            </Button>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">Your Inventory</h3>
          <p>Wood: {woodInventory}</p>
        </div>

        <div className="mt-6 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setShowGallery(!showGallery)}
            className="w-full mb-4"
          >
            {showGallery ? 'Hide' : 'View'} All Agents ({totalSupply})
          </Button>
          {showGallery && (
            <div>
              <CardDescription className="mb-4">Browse all minted AI agents in the game.</CardDescription>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token ID</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Skill</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isTotalSupplyLoading || areTokenIdsLoading || areAgentsLoading ? (
                    <TableRow><TableCell colSpan={3}>Loading all agents...</TableCell></TableRow>
                  ) : allAgents.length > 0 ? allAgents.map(agent => (
                    <TableRow key={agent.id}>
                      <TableCell>{agent.id}</TableCell>
                      <TableCell>{agent.owner}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {agent.icon && <agent.icon className="inline mr-2 h-5 w-5" />}
                          <span>{agent.skill}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={3}>No agents minted yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Post a Task Tab ---
function PostTaskTab({ onTaskPosted }: { onTaskPosted: () => void }) {
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [requiredSkill, setRequiredSkill] = useState<number>(1);
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const handlePostTask = () => {
    if (!description || !reward) return;
    const rewardValue = parseFloat(reward);
    if (rewardValue <= 0) {
      toast.error('Reward must be greater than 0');
      return;
    }
    const rewardInWei = parseEther(reward);
    writeContract({
      address: TaskMarketplaceAddress,
      abi: TaskMarketplaceABI,
      functionName: 'postTask',
      args: [description, rewardInWei, requiredSkill],
      value: rewardInWei,
    });
  };

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Task Posted!", { description: "Your task is now live on the marketplace." });
      setDescription('');
      setReward('');
      setRequiredSkill(1);
      // Force refetch of task count after posting
      setTimeout(() => onTaskPosted(), 1000);
    }
  }, [isConfirmed, onTaskPosted]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post a New Task</CardTitle>
        <CardDescription>Create a new job for the AI agent marketplace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">Task Description</Label>
          <Input id="description" placeholder="e.g., Gather 100 wood" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reward">Reward (in SOMI)</Label>
          <Input id="reward" placeholder="0.01" value={reward} onChange={(e) => setReward(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skill">Required Skill</Label>
          <Select onValueChange={(value) => setRequiredSkill(Number(value))} defaultValue={String(requiredSkill)}>
            <SelectTrigger id="skill"><SelectValue placeholder="Select a skill" /></SelectTrigger>
            <SelectContent>
              {Array.from(SKILL_MAP.entries()).map(([key, skill]) => (
                <SelectItem key={String(key)} value={String(key)}>
                  <skill.icon className="inline mr-2 h-4 w-4" />
                  {skill.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handlePostTask} disabled={isPending || isConfirming}>
          {isPending || isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isConfirming ? 'Posting Task...' : 'Post Task'}
        </Button>
      </CardContent>
    </Card>
  );
}



// --- Main Home Component ---
export default function Home() {
  const { address } = useAccount();
  const [ownedAgents, setOwnedAgents] = useState<any[]>([]);

  // Agent Fetching Logic
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: AIAgentAddress,
    abi: AIAgentABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  });
  const balance = balanceData ? Number(balanceData) : 0;

  const ownedTokenIdContracts = useMemo(() => {
    if (balance === 0 || !address) return [];
    return Array.from({ length: balance }, (_, i) => ({ address: AIAgentAddress, abi: AIAgentABI, functionName: 'tokenOfOwnerByIndex', args: [address, BigInt(i)] }));
  }, [balance, address]);

  const { data: ownedTokenIdsData, isLoading: areTokenIdsLoading } = useReadContracts({ contracts: ownedTokenIdContracts });

  const ownedTokenIds = useMemo(() => {
    if (!ownedTokenIdsData) return [];
    return ownedTokenIdsData.filter(d => d.status === 'success').map(d => d.result as bigint);
  }, [ownedTokenIdsData]);

  const agentSkillContracts = useMemo(() => {
    if (ownedTokenIds.length === 0) return [];
    return ownedTokenIds.map(tokenId => ({ address: AIAgentAddress, abi: AIAgentABI, functionName: 'getAgentSkill', args: [tokenId] }));
  }, [ownedTokenIds]);

  const { data: skillsData, isLoading: areSkillsLoading } = useReadContracts({ contracts: agentSkillContracts });

  useEffect(() => {
    if (skillsData) {
      const agents = ownedTokenIds.map((tokenId, index) => {
        const skillNum = Number(skillsData[index].result);
        const skillData = SKILL_MAP.get(skillNum);
        return { id: Number(tokenId), skill: skillData?.name || 'Unknown', icon: skillData?.icon || null };
      });
      setOwnedAgents(agents);
    }
  }, [skillsData, ownedTokenIds]);

  // Contract Write Logic
  const { data: hash, writeContract } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const { data: woodInventoryData } = useReadContract({
    address: GameSimulatorAddress,
    abi: GameSimulatorABI,
    functionName: 'woodInventory',
    args: [address || '0x0'],
  });

  const handleMint = (skill: number) => {
    if (!address) return;
    writeContract({ address: AIAgentAddress, abi: AIAgentABI, functionName: 'mint', args: [address, skill] });
  };

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Success!", { description: "Your transaction has been confirmed." });
      refetchBalance();
    }
  }, [isConfirmed, refetchBalance]);

  const { data: taskCountData, refetch: refetchTasks } = useReadContract({
    address: TaskMarketplaceAddress,
    abi: TaskMarketplaceABI,
    functionName: 'getTaskCount',
  });

  useEffect(() => {
    // Refetch tasks when component mounts
    refetchTasks();
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketplace">Task Marketplace</TabsTrigger>
          <TabsTrigger value="agents">My Agents</TabsTrigger>
          <TabsTrigger value="post">Post a Task</TabsTrigger>
        </TabsList>
        <TabsContent value="marketplace">
          <TaskMarketplaceTab ownedAgents={ownedAgents} refetchTasks={refetchTasks} />
        </TabsContent>
        <TabsContent value="agents">
          <MyAgentsTab ownedAgents={ownedAgents} isLoading={areTokenIdsLoading || areSkillsLoading} onMint={handleMint} woodInventory={Number((woodInventoryData as bigint) || 0n)} refetchAgents={refetchBalance} hash={hash} />
        </TabsContent>
        <TabsContent value="post">
          <PostTaskTab onTaskPosted={refetchTasks} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
