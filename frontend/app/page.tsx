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
import { Loader2, Pickaxe, Axe, Fish, Trophy, Activity, Zap } from 'lucide-react';
import { toast } from 'sonner';
import ParticleEffect from '@/components/ParticleEffect';
import ProgressBar from '@/components/ProgressBar';

const SKILL_MAP = new Map<number, { name: string, icon: React.ComponentType<{ className?: string }> }>([
  [1, { name: 'Mining', icon: Pickaxe }],
  [2, { name: 'Woodcutting', icon: Axe }],
  [3, { name: 'Fishing', icon: Fish }],
]);

// --- Accept Task Dialog ---
function AcceptTaskDialog({ task, ownedAgents, onAccept }: { task: { taskId: bigint; requiredSkill: number }, ownedAgents: { id: number; skill: string }[], onAccept: (taskId: bigint, agentId: bigint) => void }) {
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
function TaskMarketplaceTab({ ownedAgents }: { ownedAgents: { id: number; skill: string }[] }) {
  const [tasks, setTasks] = useState<{ taskId: bigint; description: string; reward: bigint; requiredSkill: number; status: number }[]>([]);
  const [acceptedTask, setAcceptedTask] = useState<{ taskId: bigint } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: taskCountData, isLoading: isTaskCountLoading, refetch: localRefetchTasks } = useReadContract({
    address: TaskMarketplaceAddress,
    abi: TaskMarketplaceABI,
    functionName: 'getTaskCount',
  });
  const taskCount = taskCountData ? Number((taskCountData as bigint) || 0n) : 0;

  const taskContracts = useMemo(() => {
    if (taskCount === 0) return [];
    return Array.from({ length: taskCount }, (_, i) => i).map(taskId => ({
      address: TaskMarketplaceAddress,
      abi: TaskMarketplaceABI,
      functionName: 'getTask',
      args: [BigInt(taskId + 1)],
    }));
  }, [taskCount]);

  const { data: tasksData, isLoading: areTasksLoading } = useReadContracts({ contracts: taskContracts }) as { data: { result: { taskId: bigint; description: string; reward: bigint; requiredSkill: number; status: number } | undefined; status: string }[], isLoading: boolean };

  useEffect(() => {
    if (tasksData) {
      const openTasks = tasksData
        .filter((taskResult) => taskResult.status === 'success' && taskResult.result && taskResult.result.status === 0)
        .map((taskResult) => taskResult.result!)
        .filter((result): result is { taskId: bigint; description: string; reward: bigint; requiredSkill: number; status: number } => result !== undefined);
      setTasks(openTasks);
    }
  }, [tasksData]);

  const { data: hash, writeContract } = useWriteContract();
  const { isSuccess: _isConfirmed } = useWaitForTransactionReceipt({ hash });

  const handleAcceptTask = (taskId: bigint, agentId: bigint, task: { taskId: bigint }) => {
    setAcceptedTask(task);
    writeContract({
      address: TaskMarketplaceAddress,
      abi: TaskMarketplaceABI,
      functionName: 'acceptTask',
      args: [taskId, agentId],
    });
  };

  useEffect(() => {
    if (_isConfirmed && acceptedTask) {
      setAcceptedTask(null);
    }
  }, [_isConfirmed, acceptedTask]);

  useEffect(() => {
    if (_isConfirmed && !acceptedTask) {
      toast.success("Task Accepted!", { description: "Your agent is now on the job." });
      localRefetchTasks();
    }
  }, [_isConfirmed, acceptedTask, localRefetchTasks]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold neon-text mb-2">Task Marketplace</h2>
        <p className="text-muted-foreground">Discover missions for your AI agents</p>
      </div>

      {areTasksLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">Loading missions...</span>
        </div>
      ) : tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map(task => {
            const skillData = SKILL_MAP.get(task.requiredSkill);
            const qualifiedAgents = ownedAgents.filter(agent => skillData?.name === agent.skill);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const isQualified = qualifiedAgents.length > 0;

            return (
              <Card key={String(task.taskId)} className="card-hover glow relative overflow-hidden group">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500 to-purple-600 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-full translate-y-12 -translate-x-12"></div>
                </div>

                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {skillData?.icon && <skillData.icon className="h-6 w-6 text-blue-500" />}
                      <CardTitle className="text-lg">Mission #{String(task.taskId)}</CardTitle>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {formatEther(task.reward)} SOMI
                    </div>
                  </div>
                  <CardDescription className="text-base mt-2">
                    {task.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Active Mission</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {skillData?.icon && <skillData.icon className="h-5 w-5 text-blue-400" />}
                      <span className="text-sm text-muted-foreground">{skillData?.name} Required</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span>Reward Pool:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {formatEther(task.reward)} SOMI
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span>Difficulty:</span>
                      <span className="font-medium">
                        {task.requiredSkill === 1 ? 'Easy' : task.requiredSkill === 2 ? 'Medium' : 'Hard'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {qualifiedAgents.length} qualified agent{qualifiedAgents.length !== 1 ? 's' : ''}
                    </div>
                    <AcceptTaskDialog
                      task={task}
                      ownedAgents={ownedAgents}
                      onAccept={(taskId, agentId) => handleAcceptTask(taskId, agentId, task)}
                    />
                  </div>
                </CardContent>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2 neon-text">No Missions Available</h3>
            <p className="text-muted-foreground">Check back later for new tasks, or post your own mission!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Agent Level Calculation ---
function calculateAgentLevel(tasksCompleted: number) {
  return Math.floor(tasksCompleted / 5) + 1; // Level up every 5 tasks
}

function getXPForLevel(level: number) {
  return level * 5; // XP needed for next level
}

// --- My Agents Tab ---
function MyAgentsTab({ ownedAgents, isLoading, onMint, woodInventory, refetchAgents, hash: mintHash }: { ownedAgents: { id: number; skill: string; icon?: React.ComponentType<{ className?: string }> }[], isLoading: boolean, onMint: (skill: number) => void, woodInventory: number, refetchAgents: () => void, hash: `0x${string}` | undefined }) {
  const [selectedSkill, setSelectedSkill] = useState(1);
  const [showGallery, setShowGallery] = useState(false);
  const [allAgents, setAllAgents] = useState<{ id: number; owner: string; skill: string; icon?: React.ComponentType<{ className?: string }> }[]>([]);
  const [agentStats, setAgentStats] = useState<Map<number, { tasksCompleted: number; efficiency: number }>>(new Map());

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isSuccess: _isConfirmed } = useWaitForTransactionReceipt({ hash });

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const { data: agentsData, isLoading: areAgentsLoading } = useReadContracts({ contracts: agentContracts }) as { data: { result: string | number | undefined; status: string }[], isLoading: boolean };

  useEffect(() => {
    if (agentsData && tokenIds.length > 0) {
      const newAgents: { id: number; owner: string; skill: string; icon?: React.ComponentType<{ className?: string }> }[] = [];
      for (let i = 0; i < tokenIds.length; i++) {
        const tokenId = tokenIds[i];
        const owner = agentsData[i * 2]?.result as string | undefined;
        const skillNum = Number(agentsData[i * 2 + 1]?.result);
        const skillData = SKILL_MAP.get(skillNum);
        newAgents.push({
          id: Number(tokenId),
          owner: owner ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : 'Unknown',
          skill: skillData?.name || 'Unknown',
          icon: skillData?.icon,
        });
      }
      setAllAgents(newAgents);
    }
  }, [agentsData, tokenIds]);

  // Simulate agent stats (in a real app, this would come from blockchain)
  useEffect(() => {
    const stats = new Map();
    ownedAgents.forEach(agent => {
      stats.set(agent.id, {
        tasksCompleted: Math.floor(Math.random() * 20), // Simulate completed tasks
        efficiency: Math.floor(Math.random() * 100) + 50, // 50-150% efficiency
      });
    });
    setAgentStats(stats);
  }, [ownedAgents]);

  const handleMint = () => {
    onMint(selectedSkill);
  };

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="mr-2 h-6 w-6 text-yellow-500" />
          My AI Agents
        </CardTitle>
        <CardDescription>Manage your agent NFTs and mint new ones.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {isLoading ? <p>Loading your agents...</p> :
            ownedAgents.length > 0 ? ownedAgents.map(agent => {
              const stats = agentStats.get(agent.id) || { tasksCompleted: 0, efficiency: 100 };
              const level = calculateAgentLevel(stats.tasksCompleted);
              const xpForNext = getXPForLevel(level + 1);
              const currentXP = stats.tasksCompleted * 5;
              const progress = (currentXP / xpForNext) * 100;

              return (
                <Card key={agent.id} className="glow card-hover pulse-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      AI Agent #{agent.id}
                      <span className="text-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full">
                        Lv.{level}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="flex items-center mb-2">
                      {agent.icon && <agent.icon className="inline mr-2 h-5 w-5 text-blue-500" />}
                      <span className="font-medium">{agent.skill}</span>
                    </p>
                    <ProgressBar progress={Math.min(progress, 100)} label={`XP Progress`} />
                    <p className="text-sm text-muted-foreground mt-2">
                      Tasks: {stats.tasksCompleted} | Efficiency: {stats.efficiency}%
                    </p>
                  </CardContent>
                </Card>
              );
            }) : <p>You don&apos;t own any agents yet.</p>
          }
        </div>
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="mr-2 h-5 w-5 text-yellow-500" />
            Mint a New Agent
          </h3>
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
            <Button onClick={handleMint} disabled={isPending} className="w-full sm:w-auto hover:scale-105 transition-transform">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isPending ? 'Minting...' : 'Mint Agent'}
            </Button>
            <Button onClick={refetchAgents} variant="outline" className="w-full sm:w-auto">
              Refresh Agents
            </Button>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">Your Inventory</h3>
          <p className="flex items-center">
            <Axe className="mr-2 h-5 w-5 text-green-500" />
            Wood: {woodInventory}
          </p>
        </div>

        <div className="mt-6 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setShowGallery(!showGallery)}
            className="w-full mb-4 hover:scale-105 transition-transform"
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
  const { isSuccess: _isConfirmed } = useWaitForTransactionReceipt({ hash });

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
    if (_isConfirmed) {
      toast.success("Task Posted!", { description: "Your task is now live on the marketplace." });
      setDescription('');
      setReward('');
      setRequiredSkill(1);
      // Force refetch of task count after posting
      setTimeout(() => onTaskPosted(), 1000);
    }
  }, [_isConfirmed, onTaskPosted]);

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
        <Button onClick={handlePostTask} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isPending ? 'Posting Task...' : 'Post Task'}
        </Button>
      </CardContent>
    </Card>
  );
}

// --- Agent Activity Tab ---
function AgentActivityTab({ ownedAgents }: { ownedAgents: { id: number; skill: string; icon?: React.ComponentType<{ className?: string }> }[] }) {
  const [activeTasks, setActiveTasks] = useState<Map<number, { progress: number; logs: string[]; startTime: number }>>(new Map());

  useEffect(() => {
    // Simulate active tasks for owned agents
    const tasks = new Map();
    ownedAgents.forEach(agent => {
      if (Math.random() > 0.5) { // 50% chance agent has active task
        tasks.set(agent.id, {
          progress: Math.floor(Math.random() * 50), // Start with lower progress
          logs: [
            `${new Date().toLocaleTimeString()}: Agent ${agent.id} started ${agent.skill.toLowerCase()} task`,
            `${new Date(Date.now() - 30000).toLocaleTimeString()}: Preparing tools...`,
            `${new Date(Date.now() - 20000).toLocaleTimeString()}: Moving to location...`,
          ],
          startTime: Date.now() - Math.random() * 60000,
        });
      }
    });
    setActiveTasks(tasks);
  }, [ownedAgents]);

  // Real-time progress updates
  useEffect(() => {
    if (activeTasks.size === 0) return;

    const interval = setInterval(() => {
      setActiveTasks(prevTasks => {
        const newTasks = new Map(prevTasks);
        newTasks.forEach((task, agentId) => {
          if (task.progress < 100) {
            const increment = Math.random() * 5 + 1; // Random increment between 1-6
            const newProgress = Math.min(task.progress + increment, 100);
            newTasks.set(agentId, { ...task, progress: newProgress });

            // Add new log entry when reaching certain milestones
            if (newProgress >= 25 && !task.logs.some(log => log.includes('25%'))) {
              newTasks.set(agentId, {
                ...task,
                progress: newProgress,
                logs: [...task.logs, `${new Date().toLocaleTimeString()}: Task 25% complete - Gathering resources...`]
              });
            } else if (newProgress >= 50 && !task.logs.some(log => log.includes('50%'))) {
              newTasks.set(agentId, {
                ...task,
                progress: newProgress,
                logs: [...task.logs, `${new Date().toLocaleTimeString()}: Task 50% complete - Processing...`]
              });
            } else if (newProgress >= 75 && !task.logs.some(log => log.includes('75%'))) {
              newTasks.set(agentId, {
                ...task,
                progress: newProgress,
                logs: [...task.logs, `${new Date().toLocaleTimeString()}: Task 75% complete - Finalizing...`]
              });
            } else if (newProgress >= 100 && !task.logs.some(log => log.includes('100%'))) {
              newTasks.set(agentId, {
                ...task,
                progress: newProgress,
                logs: [...task.logs, `${new Date().toLocaleTimeString()}: Task completed successfully!`]
              });
            } else {
              newTasks.set(agentId, { ...task, progress: newProgress });
            }
          }
        });
        return newTasks;
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [activeTasks.size]);

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-6 w-6 text-green-500" />
          Agent Activity Logs
        </CardTitle>
        <CardDescription>Real-time activity from your AI agents on tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        {activeTasks.size > 0 ? (
          <div className="space-y-6">
            {Array.from(activeTasks.entries()).map(([agentId, task]) => {
              const agent = ownedAgents.find(a => a.id === agentId);
              return (
                <Card key={agentId} className="glow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      {agent?.icon && <agent.icon className="mr-2 h-5 w-5" />}
                      Agent #{agentId} - {agent?.skill} Task
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProgressBar progress={task.progress} label="Task Progress" />
                    <div className="mt-4 space-y-2">
                      <h4 className="font-semibold">Activity Log:</h4>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded max-h-32 overflow-y-auto">
                        {task.logs.map((log, index) => (
                          <p key={index} className="text-sm slide-in" style={{ animationDelay: `${index * 0.5}s` }}>
                            {log}
                          </p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No active tasks at the moment.</p>
        )}
      </CardContent>
    </Card>
  );
}

// --- Leaderboard Tab ---
function LeaderboardTab() {
  const [leaderboard, setLeaderboard] = useState<{ rank: number; address: string; agents: number; tasks: number; rewards: number }[]>([]);

  useEffect(() => {
    // Simulate leaderboard data
    const data: { rank: number; address: string; agents: number; tasks: number; rewards: number }[] = [
      { rank: 1, address: '0x1234...abcd', agents: 15, tasks: 120, rewards: 25.5 },
      { rank: 2, address: '0x5678...efgh', agents: 12, tasks: 98, rewards: 22.1 },
      { rank: 3, address: '0x9abc...ijkl', agents: 10, tasks: 85, rewards: 19.8 },
      // Add more simulated data
    ];
    setLeaderboard(data);
  }, []);

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 h-6 w-6 text-yellow-500" />
          Leaderboard
        </CardTitle>
        <CardDescription>Top performers in the AI Gig Economy.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Agents</TableHead>
              <TableHead>Tasks Completed</TableHead>
              <TableHead>Rewards (SOMI)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map(entry => (
              <TableRow key={entry.rank} className={entry.rank <= 3 ? 'glow' : ''}>
                <TableCell>
                  <div className="flex items-center">
                    {entry.rank === 1 && <Trophy className="mr-1 h-4 w-4 text-yellow-500" />}
                    {entry.rank === 2 && <Trophy className="mr-1 h-4 w-4 text-gray-400" />}
                    {entry.rank === 3 && <Trophy className="mr-1 h-4 w-4 text-orange-500" />}
                    {entry.rank}
                  </div>
                </TableCell>
                <TableCell>{entry.address}</TableCell>
                <TableCell>{entry.agents}</TableCell>
                <TableCell>{entry.tasks}</TableCell>
                <TableCell>{entry.rewards}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// --- Main Home Component ---
export default function Home() {
  const { address } = useAccount();
  const [ownedAgents, setOwnedAgents] = useState<{ id: number; skill: string; icon?: React.ComponentType<{ className?: string }> }[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

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
        return { id: Number(tokenId), skill: skillData?.name || 'Unknown', icon: skillData?.icon };
      });
      setOwnedAgents(agents);
    }
  }, [skillsData, ownedTokenIds]);

  // Contract Write Logic
  const { data: hash, writeContract } = useWriteContract();
  const { isSuccess: _isConfirmed } = useWaitForTransactionReceipt({ hash });

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
    if (_isConfirmed) {
      toast.success("Success!", { description: "Your transaction has been confirmed." });
      setShowConfetti(true);
      refetchBalance();
    }
  }, [_isConfirmed, refetchBalance]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: taskCountData, refetch: refetchTasks } = useReadContract({
    address: TaskMarketplaceAddress,
    abi: TaskMarketplaceABI,
    functionName: 'getTaskCount',
  });

  useEffect(() => {
    // Refetch tasks when component mounts
    refetchTasks();
  }, [refetchTasks]);

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <ParticleEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="agents">My Agents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="post">Post Task</TabsTrigger>
        </TabsList>
        <TabsContent value="marketplace">
          <TaskMarketplaceTab ownedAgents={ownedAgents} />
        </TabsContent>
        <TabsContent value="agents">
          <MyAgentsTab ownedAgents={ownedAgents} isLoading={areTokenIdsLoading || areSkillsLoading} onMint={handleMint} woodInventory={Number((woodInventoryData as bigint) || 0n)} refetchAgents={refetchBalance} hash={hash} />
        </TabsContent>
        <TabsContent value="activity">
          <AgentActivityTab ownedAgents={ownedAgents} />
        </TabsContent>
        <TabsContent value="leaderboard">
          <LeaderboardTab />
        </TabsContent>
        <TabsContent value="post">
          <PostTaskTab onTaskPosted={refetchTasks} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
