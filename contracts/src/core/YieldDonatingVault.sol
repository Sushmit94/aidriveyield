// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IYieldDonatingVault} from "../interfaces/IYieldDonatingVault.sol";

/**
 * @title YieldDonatingVault
 * @notice ERC-4626 vault that donates accumulated yield to a public goods address
 * @dev The vault tracks deposits and periodically donates yield (accrued interest)
 *      by calculating the difference between total assets and user deposits
 */
contract YieldDonatingVault is ERC4626, Ownable, IYieldDonatingVault {
    address public override donationAddress;
    
    // Track total user deposits (principal) to calculate yield
    uint256 private _totalUserDeposits;
    
    // Minimum time between donations to prevent gas griefing
    uint256 public constant MIN_DONATION_INTERVAL = 1 days;
    uint256 public lastDonationTimestamp;
    
    constructor(
        IERC20 asset_,
        address _donationAddress,
        address owner_
    ) ERC4626(asset_) ERC20("Yield Donating Vault", "YDV") Ownable(owner_) {
        require(_donationAddress != address(0), "Invalid donation address");
        donationAddress = _donationAddress;
        lastDonationTimestamp = block.timestamp;
    }
    
    /**
     * @notice Updates the donation recipient address
     * @param _donationAddress New donation address (must not be zero)
     */
    function setDonationAddress(address _donationAddress) external override onlyOwner {
        require(_donationAddress != address(0), "Invalid donation address");
        address oldAddress = donationAddress;
        donationAddress = _donationAddress;
        emit DonationAddressUpdated(oldAddress, _donationAddress);
    }
    
    /**
     * @notice Override deposit to track user principal
     * @dev Tracks total deposits before yield accrual
     */
    function deposit(
        uint256 assets,
        address receiver
    ) public virtual override(ERC4626, IERC4626) returns (uint256) {
        uint256 shares = super.deposit(assets, receiver);
        _totalUserDeposits += assets;
        return shares;
    }
    
    /**
     * @notice Override mint to track user principal
     */
    function mint(
        uint256 shares,
        address receiver
    ) public virtual override(ERC4626, IERC4626) returns (uint256) {
        uint256 assets = super.mint(shares, receiver);
        _totalUserDeposits += assets;
        return assets;
    }
    
    /**
     * @notice Override withdraw to adjust user principal tracking
     * @dev When users withdraw, proportionally reduce tracked deposits
     */
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public virtual override(ERC4626, IERC4626) returns (uint256) {
        // Calculate proportion of total assets being withdrawn
        uint256 totalAssets_ = totalAssets();
        if (totalAssets_ > 0) {
            uint256 proportionalDeposits = (_totalUserDeposits * assets) / totalAssets_;
            if (proportionalDeposits <= _totalUserDeposits) {
                _totalUserDeposits -= proportionalDeposits;
            }
        }
        
        return super.withdraw(assets, receiver, owner);
    }
    
    /**
     * @notice Override redeem to adjust user principal tracking
     */
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public virtual override(ERC4626, IERC4626) returns (uint256) {
        uint256 assets = previewRedeem(shares);
        uint256 totalAssets_ = totalAssets();
        if (totalAssets_ > 0) {
            uint256 proportionalDeposits = (_totalUserDeposits * assets) / totalAssets_;
            if (proportionalDeposits <= _totalUserDeposits) {
                _totalUserDeposits -= proportionalDeposits;
            }
        }
        
        return super.redeem(shares, receiver, owner);
    }
    
    /**
     * @notice Calculates and donates yield to the donation address
     * @dev Yield = totalAssets() - _totalUserDeposits
     *      Only donates if there's positive yield and enough time has passed
     * @return donatedAmount Amount of yield donated
     */
    function donateYield() external override returns (uint256 donatedAmount) {
        require(
            block.timestamp >= lastDonationTimestamp + MIN_DONATION_INTERVAL,
            "Donation cooldown not met"
        );
        
        uint256 totalAssets_ = totalAssets();
        if (totalAssets_ <= _totalUserDeposits) {
            return 0; // No yield to donate
        }
        
        donatedAmount = totalAssets_ - _totalUserDeposits;
        
        // Transfer yield to donation address
        IERC20(asset()).transfer(donationAddress, donatedAmount);
        
        lastDonationTimestamp = block.timestamp;
        
        emit YieldDonated(donationAddress, donatedAmount, block.timestamp);
        
        return donatedAmount;
    }
    
    /**
     * @notice Returns total user deposits (principal)
     * @dev Useful for tracking yield calculation
     */
    function totalUserDeposits() external view returns (uint256) {
        return _totalUserDeposits;
    }
    
    /**
     * @notice Returns current accumulated yield
     * @dev Yield = totalAssets - totalUserDeposits
     */
    function getAccumulatedYield() external view returns (uint256) {
        uint256 totalAssets_ = totalAssets();
        if (totalAssets_ <= _totalUserDeposits) {
            return 0;
        }
        return totalAssets_ - _totalUserDeposits;
    }
    /**
     * @notice Allows strategy manager to pull assets for rebalancing
     * @param amount Amount of assets to transfer
     * @dev Only owner (strategy manager) can call this
     */
    function transferToStrategyManager(uint256 amount) external onlyOwner {
        IERC20(asset()).transfer(msg.sender, amount);
    }
}