// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IAaveAdapter
 * @notice Interface for Aave v3 protocol adapter
 */
interface IAaveAdapter {
    /// @notice Deposit assets into Aave
    function deposit(uint256 amount) external returns (uint256 shares);
    
    /// @notice Withdraw assets from Aave
    function withdraw(uint256 shares) external returns (uint256 amount);
    
    /// @notice Get current yield rate (APY as decimal, e.g., 0.072 for 7.2%)
    function getYieldRate() external view returns (uint256);
    
    /// @notice Get total assets deposited
    function totalAssets() external view returns (uint256);
    
    /// @notice Get current balance of this strategy
    function balanceOf() external view returns (uint256);
}


