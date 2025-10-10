// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Test.sol";
import "../src/SomniaOracle.sol";
import "../src/MockAIAgent.sol";

contract MockAIAgentTest is Test {
    SomniaOracle public oracle;
    MockAIAgent public agent;

    address public deployer;
    address public oracleService;
    address public consumer;

    function setUp() public {
        deployer = vm.addr(1);
        oracleService = vm.addr(2);
        consumer = vm.addr(3);

        vm.startPrank(deployer);
        oracle = new SomniaOracle(oracleService);
        agent = new MockAIAgent(address(oracle));
        vm.stopPrank();
    }

    function test_RequestDataFromOracle() public {
        vm.startPrank(consumer);
        string memory dataSource = "stock";
        string memory params = "GOOG";
        agent.requestDataFromOracle(dataSource, params);
        vm.stopPrank();
    }

    function test_OracleCallback_Success() public {
        // Consumer requests data
        vm.startPrank(address(agent));
        bytes32 requestId = oracle.requestData("weather", "London");
        vm.stopPrank();

        // Oracle service fulfills data, which calls agent's oracleCallback
        vm.startPrank(oracleService);
        bytes memory data = abi.encodePacked("20C");
        bool validationStatus = true;

        vm.expectEmit();
        emit MockAIAgent.DataConsumed(requestId, data, validationStatus);
        oracle.fulfillData(requestId, data, validationStatus);
        vm.stopPrank();

        // Check if agent's state was updated
        assertEq(agent.getLastRequestId(), requestId);
        assertEq(agent.getLastReceivedData(), data);
        assertTrue(agent.getLastValidationStatus());
    }

    function test_OracleCallback_RevertIfNotOracle() public {
        // Consumer requests data
        vm.startPrank(consumer);
        bytes32 requestId = oracle.requestData("weather", "Rome");
        vm.stopPrank();

        // Unauthorized address trying to call oracleCallback directly
        vm.startPrank(consumer);
        bytes memory data = abi.encodePacked("30C");
        vm.expectRevert("Only SomniaOracle can call this callback");
        agent.oracleCallback(requestId, data, true);
        vm.stopPrank();
    }

    function test_Constructor_RevertIfZeroAddress() public {
        vm.startPrank(deployer);
        vm.expectRevert("Oracle address cannot be zero");
        new MockAIAgent(address(0));
        vm.stopPrank();
    }
}
