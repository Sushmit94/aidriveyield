// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAaveAdapter} from "../interfaces/IAaveAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AaveStrategy
 * @notice Mock adapter for Aave v3 protocol
 * @dev In production, this would interact with Aave's Pool contract
 *      For hackathon, we simulate deposits/withdraws and yield accrual
 */
contract AaveStrategy is IAaveAdapter {
    IERC20 public immutable asset;
    uint256 private _totalAssets;
    uint256 private _totalShares;
    uint256 public yieldRate; // APY as decimal (e.g., 0.072 = 7.2%)
    
    mapping(address => uint256) private _balances;
    
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 shares, uint256 amount);
    
    constructor(address _asset, uint256 _initialYieldRate) {
        asset = IERC20(_asset);
        yieldRate = _initialYieldRate; // Mock: set initial yield rate
        _totalShares = 1; // Initialize to avoid division by zero
    }
    
    /**
     * @notice Deposit assets into Aave (mock implementation)
     * @param amount Amount of assets to deposit
     * @return shares Number of shares minted
     */
    function deposit(uint256 amount) external override returns (uint256 shares) {
        require(amount > 0, "Amount must be greater than 0");
        
        asset.transferFrom(msg.sender, address(this), amount);
        _totalAssets += amount;
        
        // Simple 1:1 share calculation for mock
        shares = amount;
        _totalShares += shares;
        _balances[msg.sender] += shares;
        
        emit Deposited(msg.sender, amount, shares);
        return shares;
    }
    
    /**
     * @notice Withdraw assets from Aave (mock implementation)
     * @param shares Number of shares to burn
     * @return amount Amount of assets returned
     */
    function withdraw(uint256 shares) external override returns (uint256 amount) {
        require(shares > 0, "Shares must be greater than 0");
        require(_balances[msg.sender] >= shares, "Insufficient shares");
        
        // Calculate withdrawal amount (with accumulated yield)
        if (_totalShares > 0) {
            amount = (shares * _totalAssets) / _totalShares;
        } else {
            amount = shares;
        }
        
        require(_totalAssets >= amount, "Insufficient assets");
        
        _balances[msg.sender] -= shares;
        _totalShares -= shares;
        _totalAssets -= amount;
        
        asset.transfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, shares, amount);
        return amount;
    }
    
    /**
     * @notice Get current yield rate (mock)
     * @return APY as decimal (e.g., 0.072 for 7.2%)
     */
    function getYieldRate() external view override returns (uint256) {
        return yieldRate;
    }
    
    /**
     * @notice Set yield rate (for testing/mocking)
     */
    function setYieldRate(uint256 _yieldRate) external {
        yieldRate = _yieldRate;
    }
    
    /**
     * @notice Get total assets in strategy
     */
    function totalAssets() external view override returns (uint256) {
        return _totalAssets;
    }
    
    /**
     * @notice Get balance of caller
     */
    function balanceOf() external view override returns (uint256) {
        return _balances[msg.sender];
    }
    
    /**
     * @notice Simulate yield accrual (for testing)
     * @dev Increases total assets based on yield rate
     */
    function accrueYield() external {
        // Simple yield accrual: increase assets by yield rate / 365 (daily)
        uint256 dailyYield = (_totalAssets * yieldRate) / 365 / 1e18;
        _totalAssets += dailyYield;
    }
}


