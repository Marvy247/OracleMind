// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Test.sol";
import "../src/SomniaOracle.sol";
import "../src/MockAIAgent.sol";

contract SomniaOracleTest is Test {
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

    function test_RequestData() public {
        vm.startPrank(consumer);
        string memory dataSource = "weather";
        string memory params = "London";
        bytes32 requestId = oracle.requestData(dataSource, params);
        vm.stopPrank();

        assertEq(oracle.requestIdToConsumer(requestId), consumer);
    }

    function test_FulfillData_Success() public {
        // Consumer requests data
        vm.startPrank(address(agent));
        bytes32 requestId = oracle.requestData("weather", "Paris");
        vm.stopPrank();

        // Oracle service fulfills data
        vm.startPrank(oracleService);
        bytes memory data = abi.encodePacked("25C");
        bool validationStatus = true;

        vm.expectEmit();
        emit SomniaOracle.DataFulfilled(requestId, data, validationStatus);
        oracle.fulfillData(requestId, data, validationStatus);
        vm.stopPrank();

        // Check if data was stored
        assertEq(oracle.fulfilledData(requestId), data);

        // Check if consumer received callback
        assertEq(agent.getLastRequestId(), requestId);
        assertEq(agent.getLastReceivedData(), data);
        assertTrue(agent.getLastValidationStatus());
    }

    function test_FulfillData_RevertIfNotOracleService() public {
        vm.startPrank(consumer);
        bytes32 requestId = oracle.requestData("weather", "Berlin");
        vm.stopPrank();

        vm.startPrank(consumer); // Unauthorized address trying to fulfill
        bytes memory data = abi.encodePacked("15C");
        vm.expectRevert("Only oracle service can call this function");
        oracle.fulfillData(requestId, data, true);
        vm.stopPrank();
    }

    function test_FulfillData_RevertIfRequestIdNotFound() public {
        vm.startPrank(oracleService);
        bytes memory data = abi.encodePacked("10C");
        vm.expectRevert("Request ID not found or already fulfilled");
        oracle.fulfillData(bytes32(uint256(0x123)), data, true);
        vm.stopPrank();
    }

    function test_SetOracleServiceAddress() public {
        address newOracleService = vm.addr(4);
        vm.startPrank(deployer);
        oracle.setOracleServiceAddress(newOracleService);
        vm.stopPrank();

        assertEq(oracle.oracleServiceAddress(), newOracleService);
    }

    function test_SetOracleServiceAddress_RevertIfNotOwner() public {
        address newOracleService = vm.addr(4);
        vm.startPrank(consumer);
        vm.expectRevert();
        oracle.setOracleServiceAddress(newOracleService);
        vm.stopPrank();
    }

    function test_SetOracleServiceAddress_RevertIfZeroAddress() public {
        vm.startPrank(deployer);
        vm.expectRevert("Oracle service address cannot be zero");
        oracle.setOracleServiceAddress(address(0));
        vm.stopPrank();
    }
}
