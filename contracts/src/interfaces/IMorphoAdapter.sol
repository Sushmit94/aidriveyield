// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IMorphoAdapter
 * @notice Interface for Morpho v2 protocol adapter
 */
interface IMorphoAdapter {
    /// @notice Deposit assets into Morpho
    function deposit(uint256 amount) external returns (uint256 shares);
    
    /// @notice Withdraw assets from Morpho
    function withdraw(uint256 shares) external returns (uint256 amount);
    
    /// @notice Get current yield rate (APY as decimal)
    function getYieldRate() external view returns (uint256);
    
    /// @notice Get total assets deposited
    function totalAssets() external view returns (uint256);
    
    /// @notice Get current balance of this strategy
    function balanceOf() external view returns (uint256);
}


