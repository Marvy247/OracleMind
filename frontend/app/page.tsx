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
import { AIAgentAddress, AIAgentABI, TaskMarketplaceAddress, TaskMarketplaceABI } from '@/lib/contractConfig';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SKILL_MAP: { [key: number]: string } = { 1: 'Mining', 2: 'Woodcutting', 3: 'Fishing' };

// --- Accept Task Dialog ---
function AcceptTaskDialog({ task, ownedAgents, onAccept }: { task: any, ownedAgents: any[], onAccept: (taskId: bigint, agentId: bigint) => void }) {
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const qualifiedAgents = ownedAgents.filter(agent => SKILL_MAP[task.requiredSkill] === agent.skill);

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
          <p>Required Skill: <strong>{SKILL_MAP[task.requiredSkill]}</strong></p>
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
function TaskMarketplaceTab({ ownedAgents }: { ownedAgents: any[] }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const { data: taskCountData, isLoading: isTaskCountLoading, refetch: refetchTasks } = useReadContract({
    address: TaskMarketplaceAddress,
    abi: TaskMarketplaceABI,
    functionName: 'getTaskCount',
  });
  const taskCount = taskCountData ? Number(taskCountData) : 0;

  const taskContracts = useMemo(() => {
    if (taskCount === 0) return [];
    return Array.from({ length: taskCount }, (_, i) => i + 1).map(taskId => ({
      address: TaskMarketplaceAddress,
      abi: TaskMarketplaceABI,
      functionName: 'getTask',
      args: [BigInt(taskId)],
    }));
  }, [taskCount]);

  const { data: tasksData, isLoading: areTasksLoading } = useReadContracts({ contracts: taskContracts });

  useEffect(() => {
    if (tasksData) {
      const openTasks = (tasksData as any[])
        .filter(taskResult => taskResult.status === 'success' && taskResult.result.status === 0) // 0 = OPEN
        .map(taskResult => taskResult.result);
      setTasks(openTasks);
    }
  }, [tasksData]);

  const { data: hash, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const handleAcceptTask = (taskId: bigint, agentId: bigint) => {
    writeContract({
      address: TaskMarketplaceAddress,
      abi: TaskMarketplaceABI,
      functionName: 'acceptTask',
      args: [taskId, agentId],
    });
  };

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Task Accepted!", { description: "Your agent is now on the job." });
      refetchTasks();
    }
  }, [isConfirmed, refetchTasks]);

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
              <TableHead>Reward</TableHead>
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
                <TableCell>{formatEther(task.reward)} ETH</TableCell>
                <TableCell>{SKILL_MAP[task.requiredSkill]}</TableCell>
                <TableCell>
                  <AcceptTaskDialog task={task} ownedAgents={ownedAgents} onAccept={handleAcceptTask} />
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
function MyAgentsTab({ ownedAgents, isLoading, onMint }) {
  const [selectedSkill, setSelectedSkill] = useState('1');
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const handleMint = () => {
    onMint(BigInt(selectedSkill));
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
              <Card key={agent.id}>
                <CardHeader><CardTitle>Agent #{agent.id}</CardTitle></CardHeader>
                <CardContent><p>Skill: {agent.skill}</p></CardContent>
              </Card>
            )) : <p>You don't own any agents yet.</p>
          }
        </div>
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">Mint a New Agent</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-auto flex-grow">
              <Label htmlFor="skill-select">Agent Skill</Label>
              <Select onValueChange={setSelectedSkill} defaultValue={selectedSkill}>
                <SelectTrigger id="skill-select"><SelectValue placeholder="Select a skill" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Mining</SelectItem>
                  <SelectItem value="2">Woodcutting</SelectItem>
                  <SelectItem value="3">Fishing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleMint} disabled={isPending || isConfirming} className="w-full sm:w-auto">
              {isPending || isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isConfirming ? 'Minting...' : 'Mint Agent'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Post a Task Tab ---
function PostTaskTab({ onTaskPosted }) {
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [requiredSkill, setRequiredSkill] = useState('1');
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const handlePostTask = () => {
    if (!description || !reward) return;
    const rewardInWei = parseEther(reward as `${number}`);
    writeContract({
      address: TaskMarketplaceAddress,
      abi: TaskMarketplaceABI,
      functionName: 'postTask',
      args: [description, rewardInWei, BigInt(requiredSkill)],
      value: rewardInWei,
    });
  };

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Task Posted!", { description: "Your task is now live on the marketplace." });
      setDescription('');
      setReward('');
      onTaskPosted();
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
          <Label htmlFor="reward">Reward (in ETH)</Label>
          <Input id="reward" placeholder="0.01" value={reward} onChange={(e) => setReward(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skill">Required Skill</Label>
          <Select onValueChange={setRequiredSkill} defaultValue={requiredSkill}>
            <SelectTrigger id="skill"><SelectValue placeholder="Select a skill" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Mining</SelectItem>
              <SelectItem value="2">Woodcutting</SelectItem>
              <SelectItem value="3">Fishing</SelectItem>
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
  const { data: totalSupplyData, isLoading: isAgentTotalSupplyLoading, refetch: refetchAgentTotalSupply } = useReadContract({
    address: AIAgentAddress,
    abi: AIAgentABI,
    functionName: 'totalSupply',
  });
  const agentTotalSupply = totalSupplyData ? Number(totalSupplyData) : 0;

  const agentOwnerContracts = useMemo(() => {
    if (agentTotalSupply === 0) return [];
    return Array.from({ length: agentTotalSupply }, (_, i) => i + 1).map(tokenId => ({ address: AIAgentAddress, abi: AIAgentABI, functionName: 'ownerOf', args: [BigInt(tokenId)] }));
  }, [agentTotalSupply]);

  const { data: ownersData, isLoading: areOwnersLoading } = useReadContracts({ contracts: agentOwnerContracts });

  const ownedTokenIds = useMemo(() => {
    if (!ownersData || !address) return [];
    return ownersData.map((r, i) => ({ ...r, tokenId: i + 1 })).filter(r => r.status === 'success' && r.result === address).map(r => BigInt(r.tokenId));
  }, [ownersData, address]);

  const agentSkillContracts = useMemo(() => {
    if (ownedTokenIds.length === 0) return [];
    return ownedTokenIds.map(tokenId => ({ address: AIAgentAddress, abi: AIAgentABI, functionName: 'getAgentSkill', args: [tokenId] }));
  }, [ownedTokenIds]);

  const { data: skillsData, isLoading: areSkillsLoading } = useReadContracts({ contracts: agentSkillContracts });

  useEffect(() => {
    if (skillsData) {
      const agents = ownedTokenIds.map((tokenId, index) => ({ id: Number(tokenId), skill: SKILL_MAP[skillsData[index].result as number] || 'Unknown' }));
      setOwnedAgents(agents);
    }
  }, [skillsData, ownedTokenIds]);

  // Contract Write Logic
  const { data: hash, writeContract } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const handleMint = (skill: bigint) => {
    if (!address) return;
    writeContract({ address: AIAgentAddress, abi: AIAgentABI, functionName: 'mint', args: [address, skill] });
  };

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Success!", { description: "Your transaction has been confirmed." });
      refetchAgentTotalSupply();
    }
  }, [isConfirmed, refetchAgentTotalSupply]);

  return (
    <main className="container mx-auto px-4 py-8">
      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketplace">Task Marketplace</TabsTrigger>
          <TabsTrigger value="agents">My Agents</TabsTrigger>
          <TabsTrigger value="post">Post a Task</TabsTrigger>
        </TabsList>
        <TabsContent value="marketplace">
          <TaskMarketplaceTab ownedAgents={ownedAgents} />
        </TabsContent>
        <TabsContent value="agents">
          <MyAgentsTab ownedAgents={ownedAgents} isLoading={areOwnersLoading || areSkillsLoading} onMint={handleMint} />
        </TabsContent>
        <TabsContent value="post">
          <PostTaskTab onTaskPosted={() => { /* Add refetch for tasks here */ }} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
