# 🧪 Sepolia Testnet Deployment Guide

**Target:** Week 1 of Ultra-Cautious Deployment Plan
**Environment:** Ethereum Sepolia Testnet
**Risk Level:** ZERO (testnet environment)
**Duration:** 7 days

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Environment Setup
- [ ] Sepolia ETH obtained from faucets (minimum 1 ETH recommended)
- [ ] Private key configured in `.env` file
- [ ] Sepolia RPC endpoint configured (Alchemy/Infura/Public)
- [ ] Hardhat configuration verified
- [ ] All dependencies installed (`npm install`)
- [ ] All tests passing locally (333/333)

### Security Checks
- [ ] Private key stored securely (never commit!)
- [ ] `.env` file in `.gitignore`
- [ ] Deployment wallet separate from personal wallet
- [ ] Backup of deployment wallet seed phrase
- [ ] Test wallet only (no mainnet funds)

### Code Verification
- [ ] Latest code pulled from main branch
- [ ] All contracts compiled successfully
- [ ] Contract sizes within limits
- [ ] Gas estimates calculated
- [ ] No compiler warnings

---

## 🚰 STEP 1: OBTAIN SEPOLIA ETH

### Recommended Faucets (Get from multiple sources)

1. **Alchemy Sepolia Faucet**
   - URL: https://sepoliafaucet.com/
   - Amount: 0.5 ETH per request
   - Requirements: Alchemy account
   - Rate Limit: Once per day

2. **Infura Sepolia Faucet**
   - URL: https://www.infura.io/faucet/sepolia
   - Amount: 0.5 ETH per request
   - Requirements: Infura account
   - Rate Limit: Once per day

3. **QuickNode Sepolia Faucet**
   - URL: https://faucet.quicknode.com/ethereum/sepolia
   - Amount: 0.1 ETH per request
   - Requirements: QuickNode account
   - Rate Limit: Multiple per day

4. **Sepolia PoW Faucet**
   - URL: https://sepolia-faucet.pk910.de/
   - Amount: Variable (mine for ETH)
   - Requirements: None
   - Rate Limit: Continuous mining

### Target Amount
- **Minimum:** 0.5 ETH (basic deployment)
- **Recommended:** 1.0 ETH (deployment + testing)
- **Ideal:** 2.0 ETH (deployment + extensive testing)

### Verification
```bash
# Check wallet balance
npx hardhat run scripts/check-balance.js --network sepolia
```

---

## 🔧 STEP 2: ENVIRONMENT CONFIGURATION

### Create `.env` File

```bash
# Copy template
cp .env.example .env

# Edit with your values
nano .env
```

### Required Environment Variables

```bash
# Sepolia Testnet Configuration
SEPOLIA_RPC="https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
PRIVATE_KEY="your_deployment_wallet_private_key_here"

# Etherscan API (for contract verification)
ETHERSCAN_API_KEY="your_etherscan_api_key_here"

# Based Token Address (Mock for Sepolia)
BASED_TOKEN_SEPOLIA="WILL_BE_DEPLOYED_FIRST"

# Monitoring (Optional for Week 1)
TENDERLY_ACCESS_KEY="optional"
DEFENDER_API_KEY="optional"
```

### Security Best Practices

1. **Never commit `.env` file**
   ```bash
   # Verify it's ignored
   git status
   # Should NOT show .env file
   ```

2. **Use test wallet only**
   - Create new wallet specifically for deployment
   - Never use wallet with mainnet funds
   - Keep private key secure but accessible

3. **Backup seed phrase**
   - Write down seed phrase on paper
   - Store securely offline
   - Never store digitally

---

## 📝 STEP 3: DEPLOYMENT SCRIPT PREPARATION

### Contracts to Deploy (in order)

1. **MockBasedToken** (Sepolia only - for testing)
2. **NFTContract** (Governance NFTs)
3. **GovernanceStaking** (NFT staking)
4. **BMADPredictionMarket** (Core market)
5. **TokenBondingCurve** (Market economics)
6. **MerkleRewardDistributor** (Rewards)

### Deployment Order is Critical

```
MockBasedToken
      ↓
NFTContract (needs Based token)
      ↓
GovernanceStaking (needs NFT contract)
      ↓
BMADPredictionMarket (needs Based token + Governance)
      ↓
TokenBondingCurve (needs Market)
      ↓
MerkleRewardDistributor (needs Based token)
```

---

## 🚀 STEP 4: DEPLOYMENT EXECUTION

### 4.1 Deploy Mock Based Token (Sepolia Only)

```bash
# Deploy mock $BASED token for testing
npx hardhat run scripts/deployment/01-deploy-mock-based.js --network sepolia

# Expected output:
# ✅ MockBasedToken deployed to: 0x...
# ✅ Minted 1,000,000 tokens for testing
# ✅ Gas used: ~800,000
```

**Save this address** - needed for all other contracts!

### 4.2 Deploy NFT Contract

```bash
# Update BASED_TOKEN_SEPOLIA in .env with mock address
npx hardhat run scripts/deployment/02-deploy-nft.js --network sepolia

# Expected output:
# ✅ NFTContract deployed to: 0x...
# ✅ Minted 10 test NFTs to deployer
# ✅ Gas used: ~2,500,000
```

### 4.3 Deploy Governance Staking

```bash
npx hardhat run scripts/deployment/03-deploy-governance.js --network sepolia

# Expected output:
# ✅ GovernanceStaking deployed to: 0x...
# ✅ NFT contract connected
# ✅ Gas used: ~3,000,000
```

### 4.4 Deploy Prediction Market

```bash
npx hardhat run scripts/deployment/04-deploy-market.js --network sepolia

# Expected output:
# ✅ BMADPredictionMarket deployed to: 0x...
# ✅ Based token connected
# ✅ Governance connected
# ✅ Gas used: ~5,000,000
```

### 4.5 Deploy Token Bonding Curve

```bash
npx hardhat run scripts/deployment/05-deploy-bonding.js --network sepolia

# Expected output:
# ✅ TokenBondingCurve deployed to: 0x...
# ✅ Market connected
# ✅ Gas used: ~2,000,000
```

### 4.6 Deploy Merkle Rewards

```bash
npx hardhat run scripts/deployment/06-deploy-rewards.js --network sepolia

# Expected output:
# ✅ MerkleRewardDistributor deployed to: 0x...
# ✅ Based token connected
# ✅ Gas used: ~1,500,000
```

### Total Gas Cost Estimate
- **Total Gas:** ~15,000,000 gas
- **Gas Price:** ~10 gwei (Sepolia)
- **Total Cost:** ~0.15 ETH
- **With Buffer:** 0.2-0.3 ETH

---

## ✅ STEP 5: CONTRACT VERIFICATION

### Verify on Sepolia Etherscan

```bash
# Verify each contract (example for NFT)
npx hardhat verify --network sepolia NFT_CONTRACT_ADDRESS "Constructor" "Args" "Here"

# Or use automated script
npx hardhat run scripts/verify-all.js --network sepolia
```

### Verification Checklist
- [ ] MockBasedToken verified
- [ ] NFTContract verified
- [ ] GovernanceStaking verified
- [ ] BMADPredictionMarket verified
- [ ] TokenBondingCurve verified
- [ ] MerkleRewardDistributor verified

### Why Verify?
- Public source code transparency
- Community can review
- Easier interaction via Etherscan
- Professional appearance

---

## 🧪 STEP 6: SMOKE TESTS

### Test 1: Token Transfers

```bash
npx hardhat run tests/smoke/test-token-transfer.js --network sepolia

# Expected: ✅ Tokens transferred successfully
```

### Test 2: NFT Minting & Staking

```bash
npx hardhat run tests/smoke/test-nft-staking.js --network sepolia

# Expected: ✅ NFT minted and staked
```

### Test 3: Market Creation

```bash
npx hardhat run tests/smoke/test-market-creation.js --network sepolia

# Expected: ✅ Market created successfully
```

### Test 4: Place Bet

```bash
npx hardhat run tests/smoke/test-place-bet.js --network sepolia

# Expected: ✅ Bet placed successfully
```

### Test 5: End Market & Claim

```bash
npx hardhat run tests/smoke/test-market-lifecycle.js --network sepolia

# Expected: ✅ Full lifecycle completed
```

---

## 📊 STEP 7: INITIAL SETUP

### Fund Test Accounts

```bash
# Transfer test tokens to 5-10 test wallets
npx hardhat run scripts/setup/fund-test-accounts.js --network sepolia
```

### Create Test Markets

```bash
# Create 2-3 test markets for internal testing
npx hardhat run scripts/setup/create-test-markets.js --network sepolia
```

### Mint Test NFTs

```bash
# Mint NFTs for test accounts
npx hardhat run scripts/setup/mint-test-nfts.js --network sepolia
```

---

## 🎯 STEP 8: DEPLOYMENT SUCCESS CRITERIA

### Must Have (Blockers)
- [ ] All contracts deployed successfully
- [ ] All contracts verified on Etherscan
- [ ] All smoke tests passing
- [ ] Test tokens distributed
- [ ] At least 1 test market created
- [ ] Zero errors in deployment logs

### Should Have (Important)
- [ ] 10+ test accounts funded
- [ ] 2-3 test markets created
- [ ] Test NFTs minted and distributed
- [ ] Deployment addresses documented
- [ ] Gas costs documented

### Nice to Have (Optional)
- [ ] Monitoring dashboard set up
- [ ] Community testing guide ready
- [ ] Discord announcement prepared
- [ ] FAQ document created

---

## 📝 DEPLOYMENT RECORD

### Contract Addresses (Fill after deployment)

```
MockBasedToken:           0x...
NFTContract:              0x...
GovernanceStaking:        0x...
BMADPredictionMarket:     0x...
TokenBondingCurve:        0x...
MerkleRewardDistributor:  0x...
```

### Transaction Hashes

```
MockBasedToken:           0x...
NFTContract:              0x...
GovernanceStaking:        0x...
BMADPredictionMarket:     0x...
TokenBondingCurve:        0x...
MerkleRewardDistributor:  0x...
```

### Gas Costs

```
Contract                  Gas Used      Cost (ETH)
--------------------------------------------------
MockBasedToken:           _______       _______
NFTContract:              _______       _______
GovernanceStaking:        _______       _______
BMADPredictionMarket:     _______       _______
TokenBondingCurve:        _______       _______
MerkleRewardDistributor:  _______       _______
--------------------------------------------------
TOTAL:                    _______       _______
```

### Deployment Time

```
Start Time:  _______________
End Time:    _______________
Duration:    _______________
```

---

## 🚨 TROUBLESHOOTING

### Issue: Insufficient Funds

**Error:** `sender doesn't have enough funds`

**Solution:**
```bash
# Check balance
npx hardhat run scripts/check-balance.js --network sepolia

# Get more Sepolia ETH from faucets
# Wait for transactions to confirm
```

### Issue: Nonce Too Low

**Error:** `nonce too low`

**Solution:**
```bash
# Reset nonce or wait for pending transactions
# Check on Sepolia Etherscan
```

### Issue: Gas Estimation Failed

**Error:** `gas estimation failed`

**Solution:**
```bash
# Check contract code
# Verify constructor parameters
# Try manual gas limit
```

### Issue: Verification Failed

**Error:** `Already verified` or `Verification failed`

**Solution:**
```bash
# Wait 1-2 minutes after deployment
# Check constructor args are correct
# Try manual verification via Etherscan UI
```

---

## 📞 SUPPORT & RESOURCES

### Sepolia Resources
- **Sepolia Etherscan:** https://sepolia.etherscan.io/
- **Sepolia Faucets:** Multiple sources (see Step 1)
- **Sepolia RPC:** https://rpc.sepolia.org
- **Chain ID:** 11155111

### Documentation
- Hardhat Docs: https://hardhat.org/docs
- Etherscan API: https://docs.etherscan.io/
- OpenZeppelin: https://docs.openzeppelin.com/

### Internal Documentation
- Deployment Plan: `.bmad/DEPLOYMENT-PLAN.md`
- Prep Checklist: `.bmad/DEPLOYMENT-PREP-CHECKLIST.md`
- Emergency Procedures: `.bmad/docs/emergency-procedures.md`

---

## ✅ COMPLETION CHECKLIST

Week 1 Day 1-2 Complete When:
- [ ] All contracts deployed
- [ ] All contracts verified
- [ ] All smoke tests passing
- [ ] Test accounts funded
- [ ] Test markets created
- [ ] Documentation updated
- [ ] Team notified
- [ ] Ready for Day 3-5 internal testing

---

**Next Steps:** Proceed to Week 1 Day 3-5 - Internal Testing Phase

**Status:** Ready to deploy! 🚀
