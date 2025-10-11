// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AIAgent.sol";
import "../src/TaskMarketplace.sol";
import "../src/GameSimulator.sol";

contract GameSimulatorTest is Test {
    AIAgent public aiAgent;
    TaskMarketplace public taskMarketplace;
    GameSimulator public gameSimulator;

    address public employer = address(0x1);
    address public agentOwner = address(0x2);
    uint256 public agentId;

    function setUp() public {
        // Deploy contracts
        aiAgent = new AIAgent(address(this));
        taskMarketplace = new TaskMarketplace(address(aiAgent));
        gameSimulator = new GameSimulator(address(taskMarketplace));

        // Mint a WOODCUTTING agent for the agentOwner
        vm.prank(address(this));
        agentId = aiAgent.mint(agentOwner, AIAgent.Skill.WOODCUTTING);

        // Post a task
        vm.prank(employer);
        vm.deal(employer, 1 ether);
        uint256 reward = 0.1 ether;
        taskMarketplace.postTask{value: reward}("Gather 10 wood", reward, AIAgent.Skill.WOODCUTTING);

        // Accept the task
        vm.prank(agentOwner);
        taskMarketplace.acceptTask(1, agentId);
    }

    function testPerformTask() public {
        // Check initial wood inventory
        assertEq(gameSimulator.woodInventory(employer), 0);

        // Agent owner calls performTask
        vm.prank(agentOwner);
        gameSimulator.performTask(1);

        // Check final wood inventory
        assertEq(gameSimulator.woodInventory(employer), 10);

        // Verify task is marked as complete in the marketplace
        TaskMarketplace.Task memory task = taskMarketplace.getTask(1);
        assertEq(uint(task.status), uint(TaskMarketplace.TaskStatus.COMPLETED));
    }

    function testPerformTaskByUnassignedAgent() public {
        // Try to call performTask from a different address
        address unauthorizedCaller = address(0x3);
        vm.prank(unauthorizedCaller);
        vm.expectRevert("You are not the owner of the assigned agent.");
        gameSimulator.performTask(1);
    }
}
