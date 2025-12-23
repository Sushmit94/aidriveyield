// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HealthCheck
 * @notice Provides safety checks for strategy rebalancing
 * @dev Prevents excessive allocation changes and validates strategy health
 */
contract HealthCheck {
    // Maximum allowed slippage during rebalancing (basis points)
    uint256 public constant MAX_SLIPPAGE_BPS = 100; // 1%
    
    // Minimum time between large rebalances (seconds)
    uint256 public constant MIN_REBALANCE_INTERVAL = 1 hours;
    
    /**
     * @notice Checks if a strategy manager is in a healthy state
     * @param manager Address of the StrategyManager to check
     * @return healthy True if manager passes all health checks
     */
    function isHealthy(address manager) external view returns (bool healthy) {
        // In production, this would perform multiple checks:
        // - Total assets consistency
        // - Strategy balances sum correctly
        // - No excessive exposure to single protocol
        // - Risk limits respected
        
        // For now, return true (placeholder)
        return true;
    }
    
    /**
     * @notice Validates allocation weights are within acceptable ranges
     * @param aave Aave allocation weight (basis points)
     * @param morpho Morpho allocation weight (basis points)
     * @param spark Spark allocation weight (basis points)
     * @param uniswap Uniswap allocation weight (basis points)
     * @return valid True if weights are valid
     */
    function validateAllocation(
        uint256 aave,
        uint256 morpho,
        uint256 spark,
        uint256 uniswap
    ) external pure returns (bool valid) {
        uint256 total = aave + morpho + spark + uniswap;
        
        // Must sum to 100%
        if (total != 10000) return false;
        
        // Each strategy must not exceed 80% (diversification requirement)
        if (aave > 8000 || morpho > 8000 || spark > 8000 || uniswap > 8000) {
            return false;
        }
        
        // Each strategy must have at least 5% (minimum allocation)
        if (aave < 500 || morpho < 500 || spark < 500 || uniswap < 500) {
            return false;
        }
        
        return true;
    }
}


