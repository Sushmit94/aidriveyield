// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ISparkAdapter
 * @notice Interface for Spark protocol adapter
 */
interface ISparkAdapter {
    /// @notice Deposit assets into Spark
    function deposit(uint256 amount) external returns (uint256 shares);
    
    /// @notice Withdraw assets from Spark
    function withdraw(uint256 shares) external returns (uint256 amount);
    
    /// @notice Get current yield rate (APY as decimal)
    function getYieldRate() external view returns (uint256);
    
    /// @notice Get total assets deposited
    function totalAssets() external view returns (uint256);
    
    /// @notice Get current balance of this strategy
    function balanceOf() external view returns (uint256);
}


