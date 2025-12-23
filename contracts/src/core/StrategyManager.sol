// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IAaveAdapter} from "../interfaces/IAaveAdapter.sol";
import {IMorphoAdapter} from "../interfaces/IMorphoAdapter.sol";
import {ISparkAdapter} from "../interfaces/ISparkAdapter.sol";
import {IUniswapHookAdapter} from "../interfaces/IUniswapHookAdapter.sol";
import {IYieldDonatingVault} from "../interfaces/IYieldDonatingVault.sol";
import {HealthCheck} from "../utils/HealthCheck.sol";

/**
 * @title StrategyManager
 * @notice Manages allocation of vault funds across multiple DeFi strategies
 * @dev Receives AI recommendations off-chain (via oracle or manual trigger)
 *      and reallocates capital between Aave, Morpho, Spark, and Uniswap strategies
 * 
 * Integration Flow:
 * 1. AI Agent generates allocation weights (e.g., Aave: 40%, Morpho: 30%, Spark: 20%, Uniswap: 10%)
 * 2. Frontend/off-chain calls setAllocationWeights() with AI recommendations
 * 3. StrategyManager rebalances funds to match target allocation
 */
contract StrategyManager is Ownable {
    struct AllocationWeights {
        uint256 aave;      // Weight for Aave (basis points, e.g., 4000 = 40%)
        uint256 morpho;    // Weight for Morpho (basis points)
        uint256 spark;     // Weight for Spark (basis points)
        uint256 uniswap;   // Weight for Uniswap (basis points)
    }
    
    IYieldDonatingVault public immutable vault;
    IERC20 public immutable asset;
    
    IAaveAdapter public aaveAdapter;
    IMorphoAdapter public morphoAdapter;
    ISparkAdapter public sparkAdapter;
    IUniswapHookAdapter public uniswapAdapter;
    
    AllocationWeights public currentAllocation;
    HealthCheck public healthCheck;
    
    // Maximum allocation change per rebalance (safety limit)
    uint256 public constant MAX_REBALANCE_DELTA = 2000; // 20% max change per rebalance
    uint256 public constant BASIS_POINTS = 10000;
    
    // Track if initial allocation has been set
    bool private initialized;
    
    event AllocationUpdated(
        uint256 aave,
        uint256 morpho,
        uint256 spark,
        uint256 uniswap,
        uint256 timestamp
    );
    
    event StrategyRebalanced(
        address indexed strategy,
        uint256 previousAmount,
        uint256 newAmount,
        uint256 timestamp
    );
    
    constructor(
        address _vault,
        address _asset,
        address _aaveAdapter,
        address _morphoAdapter,
        address _sparkAdapter,
        address _uniswapAdapter,
        address _healthCheck,
        address owner_
    ) Ownable(owner_) {
        vault = IYieldDonatingVault(_vault);
        asset = IERC20(_asset);
        aaveAdapter = IAaveAdapter(_aaveAdapter);
        morphoAdapter = IMorphoAdapter(_morphoAdapter);
        sparkAdapter = ISparkAdapter(_sparkAdapter);
        uniswapAdapter = IUniswapHookAdapter(_uniswapAdapter);
        healthCheck = HealthCheck(_healthCheck);
    }
    
    /**
     * @notice Updates allocation weights based on AI recommendations
     * @param weights New allocation weights (must sum to 10000 basis points)
     * @dev This function should be called by off-chain AI agent or oracle
     *      after processing yield/risk predictions
     */
    function setAllocationWeights(AllocationWeights memory weights) external onlyOwner {
        require(
            weights.aave + weights.morpho + weights.spark + weights.uniswap == BASIS_POINTS,
            "Weights must sum to 100%"
        );
        
        // Skip delta check on first initialization
        if (initialized) {
            // Check if change is within safety limits
            uint256 aaveDelta = weights.aave > currentAllocation.aave
                ? weights.aave - currentAllocation.aave
                : currentAllocation.aave - weights.aave;
            require(aaveDelta <= MAX_REBALANCE_DELTA, "Allocation change too large");
        } else {
            initialized = true;
        }
        
        currentAllocation = weights;
        
        emit AllocationUpdated(
            weights.aave,
            weights.morpho,
            weights.spark,
            weights.uniswap,
            block.timestamp
        );
    }
    
    /**
     * @notice Rebalances funds across strategies based on current allocation weights
     * @dev Calculates current balances, target amounts, and executes transfers
     */
    function rebalance() external onlyOwner {
        uint256 totalAssets = vault.totalAssets();
        
        // Calculate target amounts for each strategy
        uint256 targetAave = (totalAssets * currentAllocation.aave) / BASIS_POINTS;
        uint256 targetMorpho = (totalAssets * currentAllocation.morpho) / BASIS_POINTS;
        uint256 targetSpark = (totalAssets * currentAllocation.spark) / BASIS_POINTS;
        uint256 targetUniswap = (totalAssets * currentAllocation.uniswap) / BASIS_POINTS;
        
        // Get current balances
        uint256 currentAave = aaveAdapter.balanceOf();
        uint256 currentMorpho = morphoAdapter.balanceOf();
        uint256 currentSpark = sparkAdapter.balanceOf();
        uint256 currentUniswap = uniswapAdapter.balanceOf();
        
        // Rebalance each strategy
        _rebalanceStrategy(address(aaveAdapter), currentAave, targetAave);
        _rebalanceStrategy(address(morphoAdapter), currentMorpho, targetMorpho);
        _rebalanceStrategy(address(sparkAdapter), currentSpark, targetSpark);
        _rebalanceStrategy(address(uniswapAdapter), currentUniswap, targetUniswap);
        
        // Health check after rebalancing
        require(healthCheck.isHealthy(address(this)), "Health check failed");
    }
    
    /**
     * @notice Internal helper to rebalance a single strategy
     * @param strategy Address of the strategy adapter
     * @param current Current balance in strategy
     * @param target Target balance for strategy
     */
    function _rebalanceStrategy(
        address strategy,
        uint256 current,
        uint256 target
    ) internal {
        if (target > current) {
            // Need to deposit more
            uint256 depositAmount = target - current;
            
            // Transfer assets from vault to strategy manager
            require(asset.transferFrom(address(vault), address(this), depositAmount), "Transfer failed");
            asset.approve(strategy, depositAmount);
            
            // Call deposit on the appropriate adapter
            if (strategy == address(aaveAdapter)) {
                aaveAdapter.deposit(depositAmount);
            } else if (strategy == address(morphoAdapter)) {
                morphoAdapter.deposit(depositAmount);
            } else if (strategy == address(sparkAdapter)) {
                sparkAdapter.deposit(depositAmount);
            } else if (strategy == address(uniswapAdapter)) {
                uniswapAdapter.deposit(depositAmount);
            }
            
            emit StrategyRebalanced(strategy, current, target, block.timestamp);
        } else if (target < current) {
            // Need to withdraw
            uint256 withdrawAmount = current - target;
            
            // Calculate shares to withdraw (simplified 1:1 for mock strategies)
            uint256 sharesToWithdraw = withdrawAmount;
            
            // Call withdraw on the appropriate adapter
            if (strategy == address(aaveAdapter)) {
                aaveAdapter.withdraw(sharesToWithdraw);
            } else if (strategy == address(morphoAdapter)) {
                morphoAdapter.withdraw(sharesToWithdraw);
            } else if (strategy == address(sparkAdapter)) {
                sparkAdapter.withdraw(sharesToWithdraw);
            } else if (strategy == address(uniswapAdapter)) {
                uniswapAdapter.withdraw(sharesToWithdraw);
            }
            
            emit StrategyRebalanced(strategy, current, target, block.timestamp);
        }
    }
    
    /**
     * @notice Returns current allocation across all strategies
     */
    function getAllocationStatus() external view returns (
        uint256 totalAssets,
        uint256 aaveBalance,
        uint256 morphoBalance,
        uint256 sparkBalance,
        uint256 uniswapBalance,
        AllocationWeights memory weights
    ) {
        return (
            vault.totalAssets(),
            aaveAdapter.balanceOf(),
            morphoAdapter.balanceOf(),
            sparkAdapter.balanceOf(),
            uniswapAdapter.balanceOf(),
            currentAllocation
        );
    }
}