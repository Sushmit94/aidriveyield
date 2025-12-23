// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IUniswapHookAdapter
 * @notice Interface for Uniswap v4 hook strategy adapter
 */
interface IUniswapHookAdapter {
    /// @notice Deposit assets into Uniswap v4 liquidity position
    function deposit(uint256 amount) external returns (uint256 shares);
    
    /// @notice Withdraw assets from Uniswap v4
    function withdraw(uint256 shares) external returns (uint256 amount);
    
    /// @notice Get current yield rate (APY as decimal, includes fees)
    function getYieldRate() external view returns (uint256);
    
    /// @notice Get total assets deposited
    function totalAssets() external view returns (uint256);
    
    /// @notice Get current balance of this strategy
    function balanceOf() external view returns (uint256);
}


