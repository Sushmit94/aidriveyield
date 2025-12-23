// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {YieldDonatingVault} from "../src/core/YieldDonatingVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract YieldDonatingVaultTest is Test {
    YieldDonatingVault vault;
    ERC20Mock asset;
    address donationAddress = address(0x123);
    address user = address(0x456);
    
    function setUp() public {
        asset = new ERC20Mock();
        vault = new YieldDonatingVault(
            IERC20(address(asset)),
            donationAddress,
            address(this)
        );
        
        // Mint tokens to user
        asset.mint(user, 1000 * 1e18);
    }
    
    function testDeposit() public {
        vm.startPrank(user);
        asset.approve(address(vault), 100 * 1e18);
        vault.deposit(100 * 1e18, user);
        vm.stopPrank();
        
        assertEq(vault.balanceOf(user), 100 * 1e18);
        assertEq(asset.balanceOf(address(vault)), 100 * 1e18);
    }
    
    function testWithdraw() public {
        vm.startPrank(user);
        asset.approve(address(vault), 100 * 1e18);
        vault.deposit(100 * 1e18, user);
        
        uint256 shares = vault.balanceOf(user);
        vault.redeem(shares, user, user);
        vm.stopPrank();
        
        assertEq(vault.balanceOf(user), 0);
    }
    
    function testDonationAddress() public {
        assertEq(vault.donationAddress(), donationAddress);
        
        address newDonation = address(0x789);
        vault.setDonationAddress(newDonation);
        assertEq(vault.donationAddress(), newDonation);
    }
    
    function testAccumulatedYield() public {
        vm.startPrank(user);
        asset.approve(address(vault), 100 * 1e18);
        vault.deposit(100 * 1e18, user);
        vm.stopPrank();
        
        // Simulate yield accrual by transferring more assets to vault
        asset.mint(address(vault), 10 * 1e18);
        
        uint256 yield = vault.getAccumulatedYield();
        assertEq(yield, 10 * 1e18);
    }
    
    function testYieldDonation() public {
        vm.startPrank(user);
        asset.approve(address(vault), 100 * 1e18);
        vault.deposit(100 * 1e18, user);
        vm.stopPrank();
        
        // Simulate yield accrual
        asset.mint(address(vault), 10 * 1e18);
        
        // Fast forward time to pass cooldown
        vm.warp(block.timestamp + 1 days + 1);
        
        uint256 donationBalanceBefore = asset.balanceOf(donationAddress);
        uint256 donatedAmount = vault.donateYield();
        uint256 donationBalanceAfter = asset.balanceOf(donationAddress);
        
        assertEq(donatedAmount, 10 * 1e18);
        assertEq(donationBalanceAfter - donationBalanceBefore, 10 * 1e18);
    }
    
    function testCannotDonateTooSoon() public {
        vm.startPrank(user);
        asset.approve(address(vault), 100 * 1e18);
        vault.deposit(100 * 1e18, user);
        vm.stopPrank();
        
        // Simulate yield
        asset.mint(address(vault), 10 * 1e18);
        
        // Try to donate immediately (should fail)
        vm.expectRevert("Donation cooldown not met");
        vault.donateYield();
    }
}