# 💰 Get FREE Sepolia Testnet ETH
**Purpose:** Get FREE testnet ETH for Sepolia deployment
**Cost:** $0 (completely FREE)
**Time:** 5-10 minutes

---

## 🎯 YOUR WALLET ADDRESS

First, you need your deployment wallet address from your .env file.

```bash
# Get your wallet address
npx hardhat run scripts/get-wallet-address.js
```

Or extract manually:
```bash
# View your wallet address
grep PRIVATE_KEY .env
# Then use an online tool or this script below
```

---

## 📍 OPTION 1: Alchemy Faucet (EASIEST) ⭐

**Recommended:** Fastest and most reliable!

### Steps:
1. Visit: **https://www.alchemy.com/faucets/ethereum-sepolia**
2. Options:
   - **With wallet:** Connect MetaMask/WalletConnect
   - **Without wallet:** Paste your address
3. Request: **0.5 Sepolia ETH**
4. Wait: **1-2 minutes**
5. Verify: Check balance

**Amount:** 0.5 Sepolia ETH (enough for all testing)
**Limit:** Once per day
**Time:** 2-3 minutes

---

## 📍 OPTION 2: Infura Faucet

### Steps:
1. Visit: **https://www.infura.io/faucet/sepolia**
2. Sign up/login (free account)
3. Enter your wallet address
4. Request: **0.5 Sepolia ETH**
5. Verify: Check balance

**Amount:** 0.5 Sepolia ETH
**Limit:** Once per day
**Time:** 2-3 minutes

---

## 📍 OPTION 3: QuickNode Faucet

### Steps:
1. Visit: **https://faucet.quicknode.com/ethereum/sepolia**
2. Connect wallet or paste address
3. Complete simple verification
4. Request: **0.1 Sepolia ETH**
5. Wait: 1-2 minutes

**Amount:** 0.1 Sepolia ETH
**Limit:** Once per day
**Time:** 2-3 minutes

---

## 📍 OPTION 4: POW Faucet (UNLIMITED) 💎

**Best if others don't work!**

### Steps:
1. Visit: **https://sepolia-faucet.pk910.de**
2. Enter your wallet address
3. Start mining (browser-based)
4. Mine for 5-10 minutes
5. Claim rewards

**Amount:** 0.05-0.1 ETH per session
**Limit:** UNLIMITED (can repeat)
**Time:** 10-15 minutes per session
**Advantage:** No daily limits!

---

## 📍 OPTION 5: Chainstack Faucet

### Steps:
1. Visit: **https://faucet.chainstack.com/sepolia-testnet-faucet**
2. Sign up (free)
3. Enter wallet address
4. Request ETH
5. Verify receipt

**Amount:** 0.05 Sepolia ETH
**Limit:** Once per day
**Time:** 2-3 minutes

---

## ✅ VERIFY YOU RECEIVED ETH

### Check Balance:

```bash
# Create this script and run it:
npx hardhat run scripts/check-balance.js --network sepolia
```

Or visit Sepolia Etherscan:
1. Go to: **https://sepolia.etherscan.io**
2. Paste your wallet address
3. Check balance shows **~0.5 ETH**

---

## 📊 HOW MUCH DO YOU NEED?

```yaml
For Sepolia Deployment:
  Contract deployment:     ~0.01-0.05 ETH
  Validation tests:        ~0.01-0.02 ETH
  Manual testing:          ~0.01-0.02 ETH
  Buffer:                  ~0.05 ETH

  Total recommended:       0.1-0.2 ETH

  Get:                     0.5 ETH (safe buffer)
```

---

## 🔥 MULTIPLE FAUCET STRATEGY

If you want more ETH quickly:

```
1. Alchemy Faucet:    0.5 ETH (2 min)
2. Infura Faucet:     0.5 ETH (2 min)
3. QuickNode Faucet:  0.1 ETH (2 min)

Total:                1.1 ETH (6 minutes)
```

Plenty for all testing! ✅

---

## ⚠️ TROUBLESHOOTING

### Faucet Says "Already Used Today"
**Solution:** Try a different faucet or use POW faucet (unlimited)

### Not Receiving ETH
**Solutions:**
1. Wait 5-10 minutes (sometimes delayed)
2. Check spam/verification emails
3. Try different faucet
4. Verify wallet address correct

### Need More ETH
**Solutions:**
1. Use POW faucet (unlimited mining)
2. Come back tomorrow for daily limits
3. Use multiple faucets same day

---

## ✅ NEXT STEP AFTER GETTING ETH

Once you have Sepolia ETH:

```bash
# Verify balance
npx hardhat run scripts/check-balance.js --network sepolia

# Then deploy!
npx hardhat run scripts/deploy-staking-4200.js --network sepolia
```

---

## 📞 QUICK START

**Fastest path (2-3 minutes):**

1. Visit: https://www.alchemy.com/faucets/ethereum-sepolia
2. Connect wallet or paste address
3. Request 0.5 ETH
4. Wait 1-2 minutes
5. Verify received
6. Deploy! 🚀

**Total time:** 5 minutes from start to deployment ready!

---

✅ **GET YOUR FREE ETH AND LET'S DEPLOY!** 🚀
