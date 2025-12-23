// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

/**
 * @title IYieldDonatingVault
 * @notice Interface for ERC-4626 vault that donates yield to public goods
 */
interface IYieldDonatingVault is IERC4626 {
    /// @notice Emitted when donation address is updated
    event DonationAddressUpdated(address indexed oldAddress, address indexed newAddress);
    
    /// @notice Emitted when yield is donated
    event YieldDonated(address indexed recipient, uint256 amount, uint256 timestamp);
    
    /// @notice Returns the donation recipient address
    function donationAddress() external view returns (address);
    
    /// @notice Updates the donation recipient address (only owner)
    function setDonationAddress(address _donationAddress) external;
    
    /// @notice Donates accumulated yield to the donation address
    function donateYield() external returns (uint256 donatedAmount);
}


