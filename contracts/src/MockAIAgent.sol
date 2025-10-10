// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./SomniaOracle.sol"; // Assuming SomniaOracle.sol is in the same directory

contract MockAIAgent {
    // Address of the SomniaOracle contract
    SomniaOracle public somniaOracle;

    // Event to indicate that data has been consumed by the AI agent
    event DataConsumed(
        bytes32 indexed requestId,
        bytes data,
        bool validationStatus
    );

    // Storage for the last received data
    bytes public lastReceivedData;
    bool public lastValidationStatus;
    bytes32 public lastRequestId;

    constructor(address _somniaOracleAddress) {
        require(
            _somniaOracleAddress != address(0),
            "Oracle address cannot be zero"
        );
        somniaOracle = SomniaOracle(_somniaOracleAddress);
    }

    /**
     * @dev Allows the AI agent to request data from the SomniaOracle.
     * @param _dataSourceIdentifier A string identifying the type of data source.
     * @param _params A string containing parameters for the data request.
     */
    function requestDataFromOracle(
        string calldata _dataSourceIdentifier,
        string calldata _params
    ) external {
        somniaOracle.requestData(_dataSourceIdentifier, _params);
    }

    /**
     * @dev Callback function to receive data from the SomniaOracle.
     * This function is called by the SomniaOracle after a request is fulfilled.
     * @param _requestId The unique identifier of the data request.
     * @param _data The fetched data, encoded as bytes.
     * @param _validationStatus The validation status of the data.
     */
    function oracleCallback(
        bytes32 _requestId,
        bytes calldata _data,
        bool _validationStatus
    ) external {
        // Ensure that only the SomniaOracle can call this function
        require(msg.sender == address(somniaOracle), "Only SomniaOracle can call this callback");

        lastRequestId = _requestId;
        lastReceivedData = _data;
        lastValidationStatus = _validationStatus;

        emit DataConsumed(_requestId, _data, _validationStatus);
    }

    /**
     * @dev Returns the last received data.
     */
    function getLastReceivedData() external view returns (bytes memory) {
        return lastReceivedData;
    }

    /**
     * @dev Returns the last validation status.
     */
    function getLastValidationStatus() external view returns (bool) {
        return lastValidationStatus;
    }

    /**
     * @dev Returns the last request ID.
     */
    function getLastRequestId() external view returns (bytes32) {
        return lastRequestId;
    }
}
