// NOTE: The ABIs in this file may be truncated and are for initial development.
// They might need to be updated with the full versions if certain functions are missing.

export const AIAgentAddress = "0x0118adCb8FAAF31108Ba9A4d1da1b3cB6caD9f4f" as `0x${string}`;
export const TaskMarketplaceAddress = "0x9A57E71fD30d9974949d9070Fc7AF4f6EfC9e441" as `0x${string}`;
export const GameSimulatorAddress = "0x21C16137496B23a79b1a35cf7E7D64DA4849BDf1" as `0x${string}`;

export const AIAgentABI = [
  {"type":"constructor","inputs":[{"name":"initialOwner","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},
  {"type":"function","name":"agents","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"tokenId","type":"uint256","internalType":"uint256"},{"name":"skill","type":"uint8","internalType":"enum AIAgent.Skill"}],"stateMutability":"view"},
  {"type":"function","name":"approve","inputs":[{"name":"to","type":"address","internalType":"address"},{"name":"tokenId","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"balanceOf","inputs":[{"name":"owner","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"getAgentSkill","inputs":[{"name":"tokenId","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint8","internalType":"enum AIAgent.Skill"}],"stateMutability":"view"},
  {"type":"function","name":"getApproved","inputs":[{"name":"tokenId","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"isApprovedForAll","inputs":[{"name":"owner","type":"address","internalType":"address"},{"name":"operator","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},
  {"type":"function","name":"mint","inputs":[{"name":"to","type":"address","internalType":"address"},{"name":"skill","type":"uint8","internalType":"enum AIAgent.Skill"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},
  {"type":"function","name":"name","inputs":[],"outputs":[{"name":"","type":"string","internalType":"string"}],"stateMutability":"view"},
  {"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"ownerOf","inputs":[{"name":"tokenId","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"symbol","inputs":[],"outputs":[{"name":"","type":"string","internalType":"string"}],"stateMutability":"view"},
  {"type":"function","name":"tokenByIndex","inputs":[{"name":"index","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"tokenOfOwnerByIndex","inputs":[{"name":"owner","type":"address","internalType":"address"},{"name":"index","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"totalSupply","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"transferFrom","inputs":[{"name":"from","type":"address","internalType":"address"},{"name":"to","type":"address","internalType":"address"},{"name":"tokenId","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"safeTransferFrom","inputs":[{"name":"from","type":"address","internalType":"address"},{"name":"to","type":"address","internalType":"address"},{"name":"tokenId","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"safeTransferFrom","inputs":[{"name":"from","type":"address","internalType":"address"},{"name":"to","type":"address","internalType":"address"},{"name":"tokenId","type":"uint256","internalType":"uint256"},{"name":"data","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"setApprovalForAll","inputs":[{"name":"operator","type":"address","internalType":"address"},{"name":"approved","type":"bool","internalType":"bool"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"event","name":"Approval","inputs":[{"name":"owner","type":"address","indexed":true,"internalType":"address"},{"name":"approved","type":"address","indexed":true,"internalType":"address"},{"name":"tokenId","type":"uint256","indexed":true,"internalType":"uint256"}],"anonymous":false},
  {"type":"event","name":"ApprovalForAll","inputs":[{"name":"owner","type":"address","indexed":true,"internalType":"address"},{"name":"operator","type":"address","indexed":true,"internalType":"address"},{"name":"approved","type":"bool","indexed":false,"internalType":"bool"}],"anonymous":false},
  {"type":"event","name":"Transfer","inputs":[{"name":"from","type":"address","indexed":true,"internalType":"address"},{"name":"to","type":"address","indexed":true,"internalType":"address"},{"name":"tokenId","type":"uint256","indexed":true,"internalType":"uint256"}],"anonymous":false},
  {"type":"error","name":"ERC721NonexistentToken","inputs":[{"name":"tokenId","type":"uint256","internalType":"uint256"}]}
] as const;

export const TaskMarketplaceABI = [
  {"type":"constructor","inputs":[{"name":"_aiAgentContractAddress","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},
  {"type":"function","name":"acceptTask","inputs":[{"name":"taskId","type":"uint256","internalType":"uint256"},{"name":"agentId","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"aiAgentContract","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract AIAgent"}],"stateMutability":"view"},
  {"type":"function","name":"completeTask","inputs":[{"name":"taskId","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"getTask","inputs":[{"name":"taskId","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"tuple","internalType":"struct TaskMarketplace.Task","components":[{"name":"taskId","type":"uint256","internalType":"uint256"},{"name":"employer","type":"address","internalType":"address"},{"name":"reward","type":"uint256","internalType":"uint256"},{"name":"description","type":"string","internalType":"string"},{"name":"requiredSkill","type":"uint8","internalType":"enum AIAgent.Skill"},{"name":"status","type":"uint8","internalType":"enum TaskMarketplace.TaskStatus"},{"name":"assignedAgentOwner","type":"address","internalType":"address"},{"name":"assignedAgentId","type":"uint256","internalType":"uint256"}]}],"stateMutability":"view"},
  {"type":"function","name":"getTaskCount","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"postTask","inputs":[{"name":"description","type":"string","internalType":"string"},{"name":"reward","type":"uint256","internalType":"uint256"},{"name":"requiredSkill","type":"uint8","internalType":"enum AIAgent.Skill"}],"outputs":[],"stateMutability":"payable"}
] as const;

export const GameSimulatorABI = [
  {"type":"constructor","inputs":[{"name":"_taskMarketplaceAddress","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},
  {"type":"function","name":"performTask","inputs":[{"name":"taskId","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"taskMarketplace","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract TaskMarketplace"}],"stateMutability":"view"},
  {"type":"function","name":"woodInventory","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"}
] as const;
