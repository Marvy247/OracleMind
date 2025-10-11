// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AIAgent.sol";
import "../src/TaskMarketplace.sol";

contract TaskMarketplaceTest is Test {
    AIAgent public aiAgent;
    TaskMarketplace public taskMarketplace;

    address public employer = address(0x1);
    address public agentOwner = address(0x2);

    function setUp() public {
        // Deploy contracts
        aiAgent = new AIAgent(address(this));
        taskMarketplace = new TaskMarketplace(address(aiAgent));

        // Mint an agent for the agentOwner
        vm.prank(address(this)); // Prank as owner of AIAgent contract to mint
        aiAgent.mint(agentOwner, AIAgent.Skill.WOODCUTTING);
    }

    function testPostTask() public {
        vm.prank(employer);
        vm.deal(employer, 1 ether);
        uint256 reward = 0.1 ether;
        taskMarketplace.postTask{value: reward}("Chop 10 wood", reward, AIAgent.Skill.WOODCUTTING);
        
        TaskMarketplace.Task memory task = taskMarketplace.getTask(1);
        assertEq(task.employer, employer);
        assertEq(task.reward, reward);
        assertEq(uint(task.status), uint(TaskMarketplace.TaskStatus.OPEN));
    }

    function testAcceptTask() public {
        // 1. Post a task
        vm.prank(employer);
        vm.deal(employer, 1 ether);
        uint256 reward = 0.1 ether;
        taskMarketplace.postTask{value: reward}("Chop 10 wood", reward, AIAgent.Skill.WOODCUTTING);

        // 2. Accept the task
        uint256 agentId = 1;
        vm.prank(agentOwner);
        taskMarketplace.acceptTask(1, agentId);

        TaskMarketplace.Task memory task = taskMarketplace.getTask(1);
        assertEq(uint(task.status), uint(TaskMarketplace.TaskStatus.IN_PROGRESS));
        assertEq(task.assignedAgentId, agentId);
        assertEq(task.assignedAgentOwner, agentOwner);
    }

    function testCompleteTask() public {
        // 1. Post a task
        vm.prank(employer);
        vm.deal(employer, 1 ether);
        uint256 reward = 0.1 ether;
        taskMarketplace.postTask{value: reward}("Chop 10 wood", reward, AIAgent.Skill.WOODCUTTING);

        // 2. Accept the task
        uint256 agentId = 1;
        vm.prank(agentOwner);
        taskMarketplace.acceptTask(1, agentId);

        // 3. Complete the task
        uint256 initialBalance = agentOwner.balance;
        vm.prank(agentOwner);
        taskMarketplace.completeTask(1);

        TaskMarketplace.Task memory task = taskMarketplace.getTask(1);
        assertEq(uint(task.status), uint(TaskMarketplace.TaskStatus.COMPLETED));
        assertEq(agentOwner.balance, initialBalance + reward);
    }

    function testAcceptTaskWithWrongSkill() public {
        // 1. Post a task requiring WOODCUTTING
        vm.prank(employer);
        vm.deal(employer, 1 ether);
        uint256 reward = 0.1 ether;
        taskMarketplace.postTask{value: reward}("Chop 10 wood", reward, AIAgent.Skill.WOODCUTTING);

        // 2. Mint a MINING agent
        vm.prank(address(this));
        uint256 miningAgentId = aiAgent.mint(agentOwner, AIAgent.Skill.MINING);

        // 3. Try to accept with the wrong agent
        vm.prank(agentOwner);
        vm.expectRevert("Agent does not have the required skill.");
        taskMarketplace.acceptTask(1, miningAgentId);
    }
}
