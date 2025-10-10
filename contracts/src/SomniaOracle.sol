// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SomniaOracle is Ownable {
    // Events
    event DataRequested(
        bytes32 indexed requestId,
        address indexed consumer,
        string dataSourceIdentifier,
        string params
    );
    event DataFulfilled(
        bytes32 indexed requestId,
        bytes data,
        bool validationStatus
    );

    // Storage for fulfilled data
    mapping(bytes32 => bytes) public fulfilledData;
    mapping(bytes32 => address) public requestIdToConsumer;

    // Address of the off-chain oracle service authorized to fulfill requests
    address public oracleServiceAddress;

    constructor(address _oracleServiceAddress) Ownable(msg.sender) {
        oracleServiceAddress = _oracleServiceAddress;
    }

    modifier onlyOracleService() {
        require(msg.sender == oracleServiceAddress, "Only oracle service can call this function");
        _;
    }

    /**
     * @dev Allows a consumer contract to request data from the oracle.
     * @param _dataSourceIdentifier A string identifying the type of data source (e.g., "weather", "stock_price").
     * @param _params A string containing parameters for the data request (e.g., "London" for weather, "AAPL" for stock).
     * @return requestId A unique identifier for the data request.
     */
    function requestData(
        string calldata _dataSourceIdentifier,
        string calldata _params
    ) external returns (bytes32 requestId) {
        requestId = keccak256(
            abi.encodePacked(
                msg.sender,
                _dataSourceIdentifier,
                _params,
                block.timestamp
            )
        );
        requestIdToConsumer[requestId] = msg.sender;

        emit DataRequested(
            requestId,
            msg.sender,
            _dataSourceIdentifier,
            _params
        );
        return requestId;
    }

    /**
     * @dev Allows the off-chain oracle service to fulfill a data request.
     * This function calls the `oracleCallback` on the consumer contract.
     * @param _requestId The unique identifier of the data request.
     * @param _data The fetched data, encoded as bytes.
     * @param _validationStatus The validation status of the data (true if valid, false otherwise).
     */
    function fulfillData(
        bytes32 _requestId,
        bytes calldata _data,
        bool _validationStatus
    ) external onlyOracleService {
        address consumer = requestIdToConsumer[_requestId];
        require(consumer != address(0), "Request ID not found or already fulfilled");

        fulfilledData[_requestId] = _data;

        // Call the oracleCallback on the consumer contract
        // The consumer contract must implement an oracleCallback function
        // that accepts (bytes32 requestId, bytes data, bool validationStatus)
        (bool success, ) = consumer.call(
            abi.encodeWithSignature(
                "oracleCallback(bytes32,bytes,bool)",
                _requestId,
                _data,
                _validationStatus
            )
        );
        require(success, "Callback to consumer failed");

        delete requestIdToConsumer[_requestId]; // Clean up the request

        emit DataFulfilled(_requestId, _data, _validationStatus);
    }

    /**
     * @dev Sets the address of the off-chain oracle service.
     * Only the owner can call this function.
     * @param _newOracleServiceAddress The new address for the oracle service.
     */
    function setOracleServiceAddress(address _newOracleServiceAddress) external onlyOwner {
        require(_newOracleServiceAddress != address(0), "Oracle service address cannot be zero");
        oracleServiceAddress = _newOracleServiceAddress;
    }
}
