// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IUniswapHookAdapter} from "../interfaces/IUniswapHookAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title UniswapHookStrategy
 * @notice Mock adapter for Uniswap v4 hook strategy
 * @dev Simulates liquidity provision and fee collection
 */
contract UniswapHookStrategy is IUniswapHookAdapter {
    IERC20 public immutable asset;
    uint256 private _totalAssets;
    uint256 private _totalShares;
    uint256 public yieldRate; // Fee-based yield from trading
    uint256 public volatility; // Mock volatility metric
    
    mapping(address => uint256) private _balances;
    
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 shares, uint256 amount);
    
    constructor(address _asset, uint256 _initialYieldRate) {
        asset = IERC20(_asset);
        yieldRate = _initialYieldRate;
        _totalShares = 1;
    }
    
    function deposit(uint256 amount) external override returns (uint256 shares) {
        require(amount > 0, "Amount must be greater than 0");
        asset.transferFrom(msg.sender, address(this), amount);
        _totalAssets += amount;
        shares = amount;
        _totalShares += shares;
        _balances[msg.sender] += shares;
        emit Deposited(msg.sender, amount, shares);
        return shares;
    }
    
    function withdraw(uint256 shares) external override returns (uint256 amount) {
        require(shares > 0 && _balances[msg.sender] >= shares, "Insufficient shares");
        amount = _totalShares > 0 ? (shares * _totalAssets) / _totalShares : shares;
        require(_totalAssets >= amount, "Insufficient assets");
        _balances[msg.sender] -= shares;
        _totalShares -= shares;
        _totalAssets -= amount;
        asset.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, shares, amount);
        return amount;
    }
    
    function getYieldRate() external view override returns (uint256) {
        return yieldRate;
    }
    
    function setYieldRate(uint256 _yieldRate) external {
        yieldRate = _yieldRate;
    }
    
    function totalAssets() external view override returns (uint256) {
        return _totalAssets;
    }
    
    function balanceOf() external view override returns (uint256) {
        return _balances[msg.sender];
    }
    
    /**
     * @notice Simulate fee accrual from Uniswap trading
     */
    function accrueYield() external {
        // Uniswap yield comes from trading fees (variable)
        uint256 dailyYield = (_totalAssets * yieldRate) / 365 / 1e18;
        _totalAssets += dailyYield;
    }
    
    function setVolatility(uint256 _volatility) external {
        volatility = _volatility;
    }
}


