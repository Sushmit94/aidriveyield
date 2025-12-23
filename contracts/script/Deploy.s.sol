// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {YieldDonatingVault} from "../src/core/YieldDonatingVault.sol";
import {StrategyManager} from "../src/core/StrategyManager.sol";
import {AaveStrategy} from "../src/strategies/AaveStrategy.sol";
import {MorphoStrategy} from "../src/strategies/MorphoStrategy.sol";
import {SparkStrategy} from "../src/strategies/SparkStrategy.sol";
import {UniswapHookStrategy} from "../src/strategies/UniswapHookStrategy.sol";
import {HealthCheck} from "../src/utils/HealthCheck.sol";

contract DeployScript is Script {
    // Store addresses as state variables to avoid stack too deep
    address public assetToken;
    address public vault;
    address public aaveStrategy;
    address public morphoStrategy;
    address public sparkStrategy;
    address public uniswapStrategy;
    address public healthCheck;
    address public strategyManager;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy mock ERC20 token (USDC-like)
        ERC20Mock asset = new ERC20Mock();
        asset.mint(deployer, 1_000_000 * 1e18);
        assetToken = address(asset);
        console.log("Deployed Asset Token:", assetToken);
        
        // Deploy vault
        address donationAddress = address(0x1234567890123456789012345678901234567890);
        vault = address(new YieldDonatingVault(asset, donationAddress, deployer));
        console.log("Deployed YieldDonatingVault:", vault);
        
        // Deploy strategies
        deployStrategies();
        
        // Deploy HealthCheck
        healthCheck = address(new HealthCheck());
        console.log("Deployed HealthCheck:", healthCheck);
        
        // Deploy StrategyManager
        strategyManager = address(new StrategyManager(
            vault,
            assetToken,
            aaveStrategy,
            morphoStrategy,
            sparkStrategy,
            uniswapStrategy,
            healthCheck,
            deployer
        ));
        console.log("Deployed StrategyManager:", strategyManager);
        
        // Set initial allocation (equal weights: 25% each)
        StrategyManager.AllocationWeights memory weights = StrategyManager.AllocationWeights({
            aave: 2500,
            morpho: 2500,
            spark: 2500,
            uniswap: 2500
        });
        StrategyManager(strategyManager).setAllocationWeights(weights);
        console.log("Set initial allocation weights");
        
        vm.stopBroadcast();
        
        printDeploymentSummary(deployer);
    }
    
    function deployStrategies() internal {
        // Deploy strategies with initial yield rates (mock APY in 18 decimals)
        aaveStrategy = address(new AaveStrategy(assetToken, 0.072 * 1e18));
        console.log("Deployed AaveStrategy:", aaveStrategy);
        
        morphoStrategy = address(new MorphoStrategy(assetToken, 0.068 * 1e18));
        console.log("Deployed MorphoStrategy:", morphoStrategy);
        
        sparkStrategy = address(new SparkStrategy(assetToken, 0.070 * 1e18));
        console.log("Deployed SparkStrategy:", sparkStrategy);
        
        uniswapStrategy = address(new UniswapHookStrategy(assetToken, 0.065 * 1e18));
        console.log("Deployed UniswapHookStrategy:", uniswapStrategy);
    }
    
    function printDeploymentSummary(address deployer) internal view {
        console.log("\n=== Deployment Summary ===");
        console.log("Deployer:", deployer);
        console.log("Asset Token:", assetToken);
        console.log("Vault:", vault);
        console.log("StrategyManager:", strategyManager);
        console.log("Aave Strategy:", aaveStrategy);
        console.log("Morpho Strategy:", morphoStrategy);
        console.log("Spark Strategy:", sparkStrategy);
        console.log("Uniswap Strategy:", uniswapStrategy);
    }
}