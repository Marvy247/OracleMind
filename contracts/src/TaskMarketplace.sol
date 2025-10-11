// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AIAgent.sol";

contract TaskMarketplace {
    address public owner;
    AIAgent public aiAgentContract;

    enum TaskStatus { OPEN, IN_PROGRESS, COMPLETED, CANCELLED }

    struct Task {
        uint256 taskId;
        address employer;
        uint256 reward;
        string description;
        AIAgent.Skill requiredSkill;
        TaskStatus status;
        address assignedAgentOwner;
        uint256 assignedAgentId;
    }

    uint256 private _taskIdCounter;
    mapping(uint256 => Task) public tasks;

    event TaskPosted(uint256 indexed taskId, address indexed employer, uint256 reward, AIAgent.Skill requiredSkill);
    event TaskAccepted(uint256 indexed taskId, uint256 indexed agentId, address agentOwner);
    event TaskCompleted(uint256 indexed taskId, uint256 indexed agentId);

    modifier onlyEmployer(uint256 taskId) {
        require(tasks[taskId].employer == msg.sender, "Only the employer can call this.");
        _; 
    }

    modifier onlyAssignedAgent(uint256 taskId) {
        require(aiAgentContract.ownerOf(tasks[taskId].assignedAgentId) == msg.sender, "Only the assigned agent's owner can call this.");
        _; 
    }

    constructor(address _aiAgentContractAddress) {
        owner = msg.sender;
        aiAgentContract = AIAgent(_aiAgentContractAddress);
    }

    function postTask(string calldata description, uint256 reward, AIAgent.Skill requiredSkill) external payable {
        require(msg.value == reward, "Must send ETH reward equal to the specified amount.");
        _taskIdCounter++;
        uint256 taskId = _taskIdCounter;

        tasks[taskId] = Task({
            taskId: taskId,
            employer: msg.sender,
            reward: reward,
            description: description,
            requiredSkill: requiredSkill,
            status: TaskStatus.OPEN,
            assignedAgentOwner: address(0),
            assignedAgentId: 0
        });

        emit TaskPosted(taskId, msg.sender, reward, requiredSkill);
    }

    function acceptTask(uint256 taskId, uint256 agentId) external {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.OPEN, "Task is not open.");
        require(aiAgentContract.ownerOf(agentId) == msg.sender, "You do not own this agent.");
        
        AIAgent.Skill agentSkill = aiAgentContract.getAgentSkill(agentId);
        require(uint(agentSkill) == uint(task.requiredSkill), "Agent does not have the required skill.");

        task.status = TaskStatus.IN_PROGRESS;
        task.assignedAgentId = agentId;
        task.assignedAgentOwner = msg.sender;

        emit TaskAccepted(taskId, agentId, msg.sender);
    }

    function completeTask(uint256 taskId) external onlyAssignedAgent(taskId) {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.IN_PROGRESS, "Task is not in progress.");

        task.status = TaskStatus.COMPLETED;

        // Transfer reward to the agent's owner
        (bool success, ) = payable(task.assignedAgentOwner).call{value: task.reward}("");
        require(success, "Failed to send reward.");

        emit TaskCompleted(taskId, task.assignedAgentId);
    }

    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    function getTaskCount() public view returns (uint256) {
        return _taskIdCounter;
    }
}
