// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TaskMarketplace.sol";

contract GameSimulator {

    TaskMarketplace public taskMarketplace;

    // Mapping from an employer address to their inventory of wood
    mapping(address => uint256) public woodInventory;

    constructor(address _taskMarketplaceAddress) {
        taskMarketplace = TaskMarketplace(_taskMarketplaceAddress);
    }

    // This function is called by the agent's owner to perform the task
    function performTask(uint256 taskId) public {
        TaskMarketplace.Task memory task = taskMarketplace.getTask(taskId);
        
        // Ensure the caller is the owner of the agent assigned to this task
        require(task.assignedAgentOwner == msg.sender, "You are not the owner of the assigned agent.");
        require(task.status == TaskMarketplace.TaskStatus.IN_PROGRESS, "Task must be in progress.");
        require(uint(task.requiredSkill) == uint(AIAgent.Skill.WOODCUTTING), "Task is not for woodcutting.");

        // Simulate giving the resource to the employer
        woodInventory[task.employer] += 10; // Grant 10 wood for completing the task

        // Mark the task as complete in the marketplace
        taskMarketplace.completeTask(taskId);
    }
}
