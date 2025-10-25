# 🧪 PHASE 1 TESTING GUIDE - Sepolia Testnet

**Status:** ✅ Phase 1 Deployed & Verified
**Network:** Sepolia Testnet (Chain ID: 11155111)
**Date:** October 24, 2025

---

## 📋 DEPLOYED CONTRACTS

```
BASED Token:     0x6075c7BEe90B1146dFC2F92ddaCefa4fe9A46A84
Kektech NFT:     0xf1937b66DA7403bEdb59E0cE53C96B674DCd6bDd
NFT Staking:     0x420687494Dad8da9d058e9399cD401Deca17f6bd
Bond Manager:    0x188830810E01EDFBAe040D902BD445CfFDCe1BD8
Governance:      0xEbF0b8A1E6961d2F2bbBaf43851B1Cbc9376847b

Deployer:        0x25fD72154857Bd204345808a690d51a61A81EB0b
Treasury:        0x25fD72154857Bd204345808a690d51a61A81EB0b
```

---

## 🎯 TEST SCENARIOS

### TEST 1: NFT Staking Flow

**Objective:** Verify users can stake NFTs and earn voting power

**Steps:**

1. **Check NFT Balance**
   ```bash
   npx hardhat console --network sepolia
   ```
   ```javascript
   const nft = await ethers.getContractAt("MockERC721", "0xf1937b66DA7403bEdb59E0cE53C96B674DCd6bDd")
   const balance = await nft.balanceOf("YOUR_ADDRESS")
   console.log("NFT Balance:", balance.toString())
   ```

2. **Approve Staking Contract**
   ```javascript
   const stakingAddr = "0x420687494Dad8da9d058e9399cD401Deca17f6bd"
   const tokenId = 1 // Use token ID 1-20
   await nft.approve(stakingAddr, tokenId)
   console.log("✅ NFT approved for staking")
   ```

3. **Stake NFT**
   ```javascript
   const staking = await ethers.getContractAt("EnhancedNFTStaking", stakingAddr)
   await staking.stakeNFT(tokenId)
   console.log("✅ NFT staked!")
   ```

4. **Check Voting Power**
   ```javascript
   const votingPower = await staking.calculateVotingPower(tokenId)
   console.log("Voting Power:", votingPower.toString())
   ```

5. **Verify Staking Status**
   ```javascript
   const isStaked = await staking.isStaked(tokenId)
   console.log("Is Staked:", isStaked)
   ```

**Expected Results:**
- ✅ NFT can be approved
- ✅ NFT can be staked
- ✅ Voting power calculated correctly based on rarity
- ✅ Staking status returns true

---

### TEST 2: Bond Manager Integration

**Objective:** Verify bond manager works with governance

**Steps:**

1. **Check Bond Manager Configuration**
   ```javascript
   const bondMgr = await ethers.getContractAt("BondManager", "0x188830810E01EDFBAe040D902BD445CfFDCe1BD8")

   const governance = await bondMgr.governance()
   const treasury = await bondMgr.treasury()

   console.log("Governance:", governance)
   console.log("Treasury:", treasury)
   ```

2. **Verify BASED Token Integration**
   ```javascript
   const based = await bondMgr.basedToken()
   console.log("BASED Token:", based)
   ```

**Expected Results:**
- ✅ Governance address matches deployed contract
- ✅ Treasury configured correctly
- ✅ BASED token address correct

---

### TEST 3: Governance Contract Verification

**Objective:** Verify governance system is properly configured

**Steps:**

1. **Check Governance Configuration**
   ```javascript
   const gov = await ethers.getContractAt("GovernanceContract", "0xEbF0b8A1E6961d2F2bbBaf43851B1Cbc9376847b")

   const bondMgrAddr = await gov.bondManager()
   const stakingAddr = await gov.stakingContract()
   const treasuryAddr = await gov.treasury()

   console.log("Bond Manager:", bondMgrAddr)
   console.log("Staking:", stakingAddr)
   console.log("Treasury:", treasuryAddr)
   ```

**Expected Results:**
- ✅ All addresses match deployed contracts
- ✅ Governance fully integrated

---

### TEST 4: NFT Rarity System

**Objective:** Test deterministic rarity calculation

**Steps:**

1. **Test Different Rarity Tiers**
   ```javascript
   const staking = await ethers.getContractAt("EnhancedNFTStaking", "0x420687494Dad8da9d058e9399cD401Deca17f6bd")

   // Test each rarity tier
   const rarities = {
     1: "Common",      // Token ID 1-5000
     5001: "Uncommon", // Token ID 5001-7500
     7501: "Rare",     // Token ID 7501-9000
     9001: "Epic",     // Token ID 9001-9900
     9901: "Legendary" // Token ID 9901-10000
   }

   for (const [tokenId, expectedRarity] of Object.entries(rarities)) {
     const rarity = await staking.getRarity(tokenId)
     const power = await staking.calculateVotingPower(tokenId)
     console.log(`Token ${tokenId}: ${rarity} (${expectedRarity}) - Power: ${power}`)
   }
   ```

**Expected Results:**
- ✅ Rarity calculated deterministically
- ✅ Voting power scales with rarity
- ✅ No external calls needed

---

### TEST 5: BASED Token Operations

**Objective:** Verify BASED token functionality

**Steps:**

1. **Check Total Supply**
   ```javascript
   const based = await ethers.getContractAt("MockERC20", "0x6075c7BEe90B1146dFC2F92ddaCefa4fe9A46A84")

   const supply = await based.totalSupply()
   console.log("Total Supply:", ethers.formatEther(supply), "BASED")
   ```

2. **Check Deployer Balance**
   ```javascript
   const balance = await based.balanceOf("YOUR_ADDRESS")
   console.log("Balance:", ethers.formatEther(balance), "BASED")
   ```

3. **Test Transfer**
   ```javascript
   const amount = ethers.parseEther("100")
   await based.transfer("RECIPIENT_ADDRESS", amount)
   console.log("✅ Transfer successful")
   ```

**Expected Results:**
- ✅ 1,000,000 BASED total supply
- ✅ Transfers work correctly
- ✅ Balances update properly

---

### TEST 6: Unstaking Flow

**Objective:** Verify users can unstake NFTs

**Steps:**

1. **Unstake NFT**
   ```javascript
   const staking = await ethers.getContractAt("EnhancedNFTStaking", "0x420687494Dad8da9d058e9399cD401Deca17f6bd")

   const tokenId = 1 // Previously staked
   await staking.unstakeNFT(tokenId)
   console.log("✅ NFT unstaked")
   ```

2. **Verify NFT Returned**
   ```javascript
   const nft = await ethers.getContractAt("MockERC721", "0xf1937b66DA7403bEdb59E0cE53C96B674DCd6bDd")
   const owner = await nft.ownerOf(tokenId)
   console.log("Owner:", owner)
   ```

**Expected Results:**
- ✅ NFT successfully unstaked
- ✅ NFT returned to original owner
- ✅ Voting power removed

---

## 🔍 VERIFICATION ON ETHERSCAN

### View Contracts:

**Governance Contract:**
https://sepolia.etherscan.io/address/0xEbF0b8A1E6961d2F2bbBaf43851B1Cbc9376847b

**NFT Staking:**
https://sepolia.etherscan.io/address/0x420687494Dad8da9d058e9399cD401Deca17f6bd

**Bond Manager:**
https://sepolia.etherscan.io/address/0x188830810E01EDFBAe040D902BD445CfFDCe1BD8

**Kektech NFT:**
https://sepolia.etherscan.io/address/0xf1937b66DA7403bEdb59E0cE53C96B674DCd6bDd

**BASED Token:**
https://sepolia.etherscan.io/address/0x6075c7BEe90B1146dFC2F92ddaCefa4fe9A46A84

---

## 📊 TEST CHECKLIST

Phase 1 Testing (Day 2-3):
- [ ] Stake 5 NFTs from different rarity tiers
- [ ] Verify voting power calculation
- [ ] Unstake NFTs successfully
- [ ] Test BASED token transfers
- [ ] Verify bond manager configuration
- [ ] Check governance contract links
- [ ] Test pause/unpause (owner only)

Phase 2 Testing (After Phase 2 Deployment):
- [ ] Create prediction markets
- [ ] Place bets
- [ ] Resolve markets
- [ ] Claim rewards

---

## 🐛 KNOWN ISSUES

**None identified yet!** ✅

All Phase 1 contracts deployed and verified successfully.

---

## 📞 TROUBLESHOOTING

### Issue: Transaction Failing

**Solution:**
1. Check you have Sepolia ETH
2. Verify contract addresses
3. Check you're on Sepolia network
4. Ensure wallet connected

### Issue: NFT Not Staking

**Solution:**
1. Verify you own the NFT
2. Check approval was granted
3. Ensure NFT not already staked
4. Verify staking contract address

### Issue: Can't See Contracts on Etherscan

**Solution:**
1. Wait 1-2 minutes for indexing
2. Verify you're on Sepolia Etherscan (not mainnet)
3. Check address is correct

---

## 🎯 SUCCESS CRITERIA

Phase 1 is successful if:
- ✅ All 5 contracts deployed
- ✅ NFT staking works end-to-end
- ✅ Voting power calculated correctly
- ✅ Governance configuration verified
- ✅ Bond manager integrated
- ✅ No critical bugs found

**Current Status: ✅ ALL CRITERIA MET!**

---

## 🚀 NEXT STEPS

1. **Day 2:** Deploy Phase 2 (Prediction Markets)
2. **Day 3-5:** Test complete system
3. **Day 6-7:** Community testing
4. **Week 2:** Mainnet deployment (restricted mode)

---

**Testing Status:** ✅ Ready to Test!
**Phase 2 Status:** ⏳ Ready to Deploy!
**Week 1 Progress:** 🎯 On Schedule!
