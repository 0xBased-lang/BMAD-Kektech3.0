# 🖥️ VPS Deployment & Infrastructure Strategy
**Purpose:** Comprehensive VPS setup and deployment automation for production operations
**Level:** Infrastructure Planning (--ultrathink)
**Date:** 2025-10-25
**Status:** Production Infrastructure Design

---

## 🎯 EXECUTIVE SUMMARY

**Infrastructure Goal:** Production-grade VPS setup for reliable smart contract operations
**Current Status:** Local development environment
**Target State:** Automated, monitored, secure VPS deployment
**Timeline:** 1-2 weeks for complete setup
**Investment:** $50-200/month operational costs

**Key Insight:** Moving from local to VPS provides:
- 24/7 uptime and monitoring
- Automated deployment pipelines
- Secure key management
- Scalable infrastructure
- Professional operations

---

## 📊 INFRASTRUCTURE ARCHITECTURE

### Current Setup (Local Development)
```
┌────────────────────────────────────┐
│     Local MacBook (Darwin)          │
│  ┌──────────────────────────────┐  │
│  │  Hardhat Development         │  │
│  │  - Local testing             │  │
│  │  - Manual deployment         │  │
│  │  - Private keys in .env      │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

### Target Setup (Production VPS)
```
┌─────────────────────────────────────────────────────────────┐
│                  VPS Server (Contabo/DO/AWS)                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Deployment Layer                            ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ ││
│  │  │  Hardhat     │  │   Scripts    │  │   Monitoring │ ││
│  │  │  Environment │  │   Automation │  │   & Alerts   │ ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Security Layer                              ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ ││
│  │  │  Key Vault   │  │  Secrets     │  │  Firewall    │ ││
│  │  │  Management  │  │  Management  │  │  & Access    │ ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Monitoring Layer                            ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ ││
│  │  │  Health      │  │  Logs        │  │  Alerts      │ ││
│  │  │  Checks      │  │  Aggregation │  │  & Notify    │ ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    ┌────────────┐      ┌────────────┐      ┌────────────┐
    │   Based    │      │  Sepolia   │      │  Local     │
    │  Mainnet   │      │  Testnet   │      │  Fork      │
    └────────────┘      └────────────┘      └────────────┘
```

---

## 🔧 VPS PROVIDER SELECTION

### Option 1: Contabo (BUDGET FRIENDLY) 💰
**Recommended for:** Development, testnets, early production

**Specs:**
```
VPS M Package:
CPU: 6 vCores
RAM: 16 GB
SSD: 400 GB
Traffic: Unlimited
Price: ~$10-15/month

Pros:
✅ Very affordable
✅ Generous resources
✅ Unlimited bandwidth
✅ Simple pricing

Cons:
❌ Lesser-known provider
❌ EU-based (may have higher latency to US)
❌ Support quality varies
```

**Best For:**
- Development and staging environments
- Testnet deployments
- Cost-sensitive projects
- Learning and experimentation

---

### Option 2: DigitalOcean (BALANCED) ⭐ RECOMMENDED
**Recommended for:** Production deployments, scaling projects

**Specs:**
```
Droplet - $48/month:
CPU: 2 vCPUs (dedicated)
RAM: 4 GB
SSD: 80 GB
Transfer: 4 TB
Backups: +20% ($10/month)

Or Droplet - $96/month:
CPU: 4 vCPUs
RAM: 8 GB
SSD: 160 GB
Transfer: 5 TB

Pros:
✅ Excellent reliability (99.99% uptime SLA)
✅ Great developer experience
✅ Automated backups
✅ Excellent documentation
✅ Managed Kubernetes available
✅ Global data centers
✅ 1-click apps

Cons:
❌ More expensive than Contabo
❌ Resource limits (can upgrade easily)
```

**Best For:**
- Production deployments
- Professional operations
- Teams requiring reliability
- Scaling infrastructure

---

### Option 3: AWS / Linode / Vultr (ENTERPRISE)
**Recommended for:** Large-scale operations, enterprise needs

**Specs:** (AWS example)
```
EC2 t3.medium:
CPU: 2 vCPUs
RAM: 4 GB
Storage: EBS volumes (flexible)
Price: ~$30-40/month + storage/bandwidth

Pros:
✅ Enterprise-grade reliability
✅ Comprehensive services (RDS, S3, CloudWatch, etc.)
✅ Auto-scaling
✅ Global infrastructure
✅ Advanced monitoring

Cons:
❌ Most expensive option
❌ Complex pricing
❌ Steeper learning curve
❌ Can get expensive quickly
```

**Best For:**
- Enterprise deployments
- Complex infrastructure needs
- Compliance requirements
- Global distribution

---

## 🎯 RECOMMENDED CONFIGURATION

### For Your Use Case: **DigitalOcean $48/month Droplet**

**Rationale:**
1. ✅ Production-ready reliability
2. ✅ Reasonable cost ($48-60/month with backups)
3. ✅ Simple, predictable pricing
4. ✅ Excellent developer experience
5. ✅ Easy to scale up if needed
6. ✅ Great documentation and support

**Server Specs:**
```yaml
Provider: DigitalOcean
Type: Droplet (Basic)
Size: 2 vCPUs, 4GB RAM, 80GB SSD
Region: NYC3 or SFO3 (closest to you)
OS: Ubuntu 22.04 LTS
Backups: Enabled (+$10/month)
Firewall: Custom rules
Monitoring: Enabled (free)
```

**Total Monthly Cost:** ~$60/month

---

## 🚀 VPS SETUP GUIDE

### Phase 1: Initial Server Setup (Day 1)

**1. Create Droplet:**
```bash
# Via DigitalOcean Dashboard:
1. Click "Create" → "Droplets"
2. Choose Ubuntu 22.04 LTS
3. Select $48/month plan (4GB RAM)
4. Choose region (NYC3 or SFO3)
5. Enable backups (+$10/month)
6. Add SSH key
7. Choose hostname: kektech-prod-1
8. Create droplet

# Wait 60 seconds for provisioning
```

**2. Initial SSH Connection:**
```bash
# Connect to your new VPS
ssh root@YOUR_DROPLET_IP

# Update system packages
apt update && apt upgrade -y

# Install essential tools
apt install -y \
  git \
  curl \
  wget \
  vim \
  htop \
  ufw \
  fail2ban \
  build-essential
```

**3. Create Non-Root User:**
```bash
# Create deployment user
adduser deployer
usermod -aG sudo deployer

# Set up SSH for deployer
mkdir -p /home/deployer/.ssh
cp ~/.ssh/authorized_keys /home/deployer/.ssh/
chown -R deployer:deployer /home/deployer/.ssh
chmod 700 /home/deployer/.ssh
chmod 600 /home/deployer/.ssh/authorized_keys

# Test SSH as deployer
# (in new terminal)
ssh deployer@YOUR_DROPLET_IP
```

**4. Secure SSH:**
```bash
# Edit SSH config
sudo vim /etc/ssh/sshd_config

# Make these changes:
PermitRootLogin no              # Disable root login
PasswordAuthentication no        # Disable password auth
PubkeyAuthentication yes        # Enable key-based auth only
Port 2222                       # Change SSH port (optional but recommended)

# Restart SSH
sudo systemctl restart sshd

# Update your local SSH config
# Add to ~/.ssh/config on your Mac:
Host kektech-prod
    HostName YOUR_DROPLET_IP
    User deployer
    Port 2222
    IdentityFile ~/.ssh/id_rsa

# Test connection
ssh kektech-prod
```

**5. Configure Firewall:**
```bash
# Set up UFW (Uncomplicated Firewall)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp      # SSH (or 22 if not changed)
sudo ufw allow 80/tcp        # HTTP (if serving frontend)
sudo ufw allow 443/tcp       # HTTPS (if serving frontend)
sudo ufw enable
sudo ufw status
```

---

### Phase 2: Development Environment (Day 1-2)

**1. Install Node.js:**
```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js (same version as local)
nvm install 18
nvm use 18
nvm alias default 18

# Verify
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or 10.x.x
```

**2. Clone Repository:**
```bash
# Set up project directory
cd ~
mkdir -p projects
cd projects

# Clone your repository
git clone https://github.com/YOUR_USERNAME/BMAD-KEKTECH3.0.git
cd BMAD-KEKTECH3.0

# Install dependencies
npm install

# Verify Hardhat works
npx hardhat --version
```

**3. Set Up Environment Variables:**
```bash
# Create .env file
vim .env

# Add your configuration:
# (NEVER commit .env to git!)
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
BASED_MAINNET_RPC_URL=https://mainnet.base.org
ETHERSCAN_API_KEY=your_etherscan_key

# Secure .env file
chmod 600 .env

# Verify .env is in .gitignore
grep -q ".env" .gitignore && echo ".env is ignored" || echo "WARNING: Add .env to .gitignore!"
```

**4. Test Deployment Scripts:**
```bash
# Test local fork
npx hardhat node  # In one terminal

# In another terminal:
npx hardhat test

# Test Sepolia deployment (DRY RUN)
npx hardhat run scripts/deploy-staking-4200.js --network sepolia
```

---

### Phase 3: Security Hardening (Day 2-3)

**1. Install Secrets Manager (Optional but Recommended):**
```bash
# Option 1: Use environment variables (simple)
# Already done above with .env

# Option 2: Use HashiCorp Vault (advanced)
# For production, consider using Vault for key management
# Tutorial: https://www.vaultproject.io/docs/install

# Option 3: Use AWS Secrets Manager (if using AWS)
# Managed service, costs ~$0.40/month per secret
```

**2. Set Up Automated Backups:**
```bash
# Create backup script
vim ~/backup.sh

# Add:
#!/bin/bash
BACKUP_DIR="/home/deployer/backups"
PROJECT_DIR="/home/deployer/projects/BMAD-KEKTECH3.0"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/kektech_$DATE.tar.gz \
  $PROJECT_DIR \
  --exclude=node_modules \
  --exclude=artifacts \
  --exclude=cache

# Keep only last 7 backups
cd $BACKUP_DIR
ls -t | tail -n +8 | xargs -r rm

echo "Backup completed: kektech_$DATE.tar.gz"

# Make executable
chmod +x ~/backup.sh

# Add to crontab (daily at 2am)
crontab -e
# Add line:
0 2 * * * /home/deployer/backup.sh >> /home/deployer/backup.log 2>&1

# Test backup
./backup.sh
ls -lh ~/backups/
```

**3. Install Fail2Ban (Brute Force Protection):**
```bash
# Install fail2ban
sudo apt install -y fail2ban

# Configure for SSH
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo vim /etc/fail2ban/jail.local

# Update SSH section:
[sshd]
enabled = true
port = 2222  # Or 22 if you didn't change it
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

# Restart fail2ban
sudo systemctl restart fail2ban
sudo fail2ban-client status sshd
```

---

### Phase 4: Monitoring Setup (Day 3-4)

**1. Install Monitoring Tools:**
```bash
# Install system monitoring
sudo apt install -y htop iotop nethogs

# Install PM2 for process management (if running services)
npm install -g pm2

# Install monitoring script dependencies
npm install --save-dev nodemon dotenv
```

**2. Create Health Check Script:**
```bash
# Create health check script
vim ~/health-check.sh

# Add:
#!/bin/bash
echo "=== System Health Check ===" >> ~/health.log
echo "Date: $(date)" >> ~/health.log
echo "Uptime: $(uptime)" >> ~/health.log
echo "Disk: $(df -h / | tail -1)" >> ~/health.log
echo "Memory: $(free -h | grep Mem)" >> ~/health.log
echo "=========================" >> ~/health.log

# Make executable
chmod +x ~/health-check.sh

# Add to crontab (every 6 hours)
crontab -e
# Add:
0 */6 * * * /home/deployer/health-check.sh
```

**3. Set Up Log Rotation:**
```bash
# Create logrotate config
sudo vim /etc/logrotate.d/kektech

# Add:
/home/deployer/projects/BMAD-KEKTECH3.0/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}

# Test logrotate
sudo logrotate -f /etc/logrotate.d/kektech
```

**4. Set Up Alerts (Optional):**
```bash
# Install ssmtp for email alerts
sudo apt install -y ssmtp

# Configure ssmtp
sudo vim /etc/ssmtp/ssmtp.conf

# Add (example for Gmail):
root=your-email@gmail.com
mailhub=smtp.gmail.com:587
AuthUser=your-email@gmail.com
AuthPass=your-app-password
UseTLS=YES
UseSTARTTLS=YES

# Create alert script
vim ~/alert.sh

# Add:
#!/bin/bash
MESSAGE="$1"
echo "$MESSAGE" | mail -s "Kektech Alert" your-email@gmail.com

# Make executable
chmod +x ~/alert.sh

# Test alert
./alert.sh "Test alert from VPS"
```

---

### Phase 5: Deployment Automation (Day 4-5)

**1. Create Deployment Script:**
```bash
# Create deployment script
vim ~/deploy.sh

# Add:
#!/bin/bash
set -e  # Exit on any error

echo "===== Kektech Deployment Script ====="
echo "Starting deployment at $(date)"

# Variables
PROJECT_DIR="/home/deployer/projects/BMAD-KEKTECH3.0"
NETWORK="${1:-sepolia}"  # Default to sepolia if not specified

cd $PROJECT_DIR

echo "1. Pulling latest code..."
git pull origin main

echo "2. Installing dependencies..."
npm install

echo "3. Running tests..."
npx hardhat test

echo "4. Deploying to $NETWORK..."
npx hardhat run scripts/deploy-staking-4200.js --network $NETWORK

echo "5. Validating deployment..."
npx hardhat run scripts/validate-staking-deployment.js --network $NETWORK

echo "Deployment completed at $(date)"
echo "======================================"

# Make executable
chmod +x ~/deploy.sh

# Usage:
# ./deploy.sh sepolia      # Deploy to Sepolia
# ./deploy.sh basedMainnet  # Deploy to mainnet
```

**2. Create Quick Commands:**
```bash
# Add aliases to .bashrc
vim ~/.bashrc

# Add at end:
alias kektech='cd ~/projects/BMAD-KEKTECH3.0'
alias kektest='cd ~/projects/BMAD-KEKTECH3.0 && npx hardhat test'
alias kekdeploy='~/deploy.sh'
alias kekhealth='~/health-check.sh && tail -20 ~/health.log'

# Reload
source ~/.bashrc

# Now you can use:
# kektech      → Go to project
# kektest      → Run tests
# kekdeploy sepolia → Deploy to Sepolia
# kekhealth    → Check system health
```

---

## 📋 VPS DEPLOYMENT CHECKLIST

### Pre-Deployment Checklist

**Server Setup:**
- [ ] VPS provisioned (DigitalOcean recommended)
- [ ] Ubuntu 22.04 LTS installed
- [ ] Non-root user created
- [ ] SSH key-based auth configured
- [ ] Firewall configured (UFW)
- [ ] Fail2ban installed and configured

**Development Environment:**
- [ ] Node.js 18 installed (via NVM)
- [ ] Git configured
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] .env file configured
- [ ] Tests passing

**Security:**
- [ ] .env file secured (chmod 600)
- [ ] Root login disabled
- [ ] Password auth disabled
- [ ] Firewall rules active
- [ ] Fail2ban monitoring SSH
- [ ] Automated backups configured

**Monitoring:**
- [ ] Health check script created
- [ ] Log rotation configured
- [ ] Monitoring tools installed
- [ ] Alert system configured (optional)

---

### Deployment Day Checklist

**Pre-Deployment:**
- [ ] All tests passing locally
- [ ] All tests passing on VPS
- [ ] .env file has correct network RPC URLs
- [ ] Private key funded (gas fees)
- [ ] Team ready and available
- [ ] Monitoring active

**Deployment:**
- [ ] SSH to VPS
- [ ] Run deployment script
- [ ] Monitor deployment progress
- [ ] Verify contract deployment
- [ ] Run validation tests
- [ ] Check contract on explorer

**Post-Deployment:**
- [ ] Deployment artifacts saved
- [ ] Contract addresses documented
- [ ] Health check passed
- [ ] Monitoring active
- [ ] Team notified
- [ ] Documentation updated

---

## 💰 COST BREAKDOWN

### Monthly Operational Costs

**VPS Hosting (DigitalOcean):**
```
Droplet (4GB RAM):        $48/month
Automated Backups:        $10/month
Subtotal:                 $58/month
```

**Network Costs:**
```
Sepolia Testnet:          FREE (faucet)
Base Mainnet Gas:         Variable ($50-200/month depending on activity)
RPC Provider (Infura/Alchemy): FREE tier sufficient, or $50/month for paid
```

**Monitoring & Tools:**
```
Basic monitoring:         FREE (built-in)
Advanced (optional):      $20-50/month
Log aggregation:          FREE (self-hosted) or $20/month
```

**Total Monthly Cost:**
```
Minimum:   $58/month  (VPS only, minimal activity)
Typical:   $120/month (VPS + moderate gas + RPC)
Maximum:   $300/month (VPS + high activity + all tools)
```

**Annual Cost:** ~$700-3,600/year

**ROI Considerations:**
- Professional infrastructure
- 24/7 uptime and monitoring
- Automated deployments
- Reduced manual effort
- Lower risk of downtime
- Scalability

---

## 🎯 OPTIMIZATION STRATEGIES

### Cost Optimization

**1. Use Testnet for Development:**
```
✅ All development on Sepolia (FREE)
✅ Final validation on mainnet fork (FREE)
✅ Only deploy to mainnet when ready
✅ Saves gas costs
```

**2. Batch Operations:**
```
✅ Deploy all contracts in one session
✅ Minimize mainnet transactions
✅ Use multicall when possible
✅ Plan deployment carefully
```

**3. Use Free Tiers:**
```
✅ Infura: 100K requests/day FREE
✅ Alchemy: 300M compute units/month FREE
✅ GitHub: Unlimited public repos FREE
✅ DigitalOcean: $200 credit for new users
```

### Performance Optimization

**1. Enable Swap:**
```bash
# Add swap space (helpful for 4GB RAM)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**2. Optimize Node.js:**
```bash
# Increase memory limit for Node
export NODE_OPTIONS="--max-old-space-size=2048"

# Add to .bashrc
echo 'export NODE_OPTIONS="--max-old-space-size=2048"' >> ~/.bashrc
```

**3. Cache Dependencies:**
```bash
# Use npm ci instead of npm install (faster, more reliable)
npm ci

# Or use pnpm (faster alternative to npm)
npm install -g pnpm
pnpm install
```

---

## 🚀 NEXT STEPS

### Immediate (This Week):

**1. Provision VPS:**
```
[ ] Sign up for DigitalOcean
[ ] Create $48/month droplet
[ ] Enable backups
[ ] Note IP address
```

**2. Initial Setup:**
```
[ ] SSH to server
[ ] Create deployer user
[ ] Configure SSH keys
[ ] Set up firewall
```

**3. Install Environment:**
```
[ ] Install Node.js
[ ] Clone repository
[ ] Install dependencies
[ ] Test Hardhat
```

### Next Week:

**4. Security Hardening:**
```
[ ] Configure .env
[ ] Set up fail2ban
[ ] Create backup script
[ ] Test backups
```

**5. Monitoring Setup:**
```
[ ] Install monitoring tools
[ ] Create health checks
[ ] Set up log rotation
[ ] Configure alerts
```

**6. Deployment Testing:**
```
[ ] Deploy to Sepolia from VPS
[ ] Run validation tests
[ ] Verify monitoring
[ ] Document process
```

### Following Week:

**7. Production Deployment:**
```
[ ] Final testing on Sepolia
[ ] Team ready
[ ] Deploy to mainnet
[ ] Monitor closely
```

---

## 🏁 SUCCESS CRITERIA

**Infrastructure Success:**
- [ ] VPS accessible 24/7
- [ ] Automated backups working
- [ ] Monitoring active and reliable
- [ ] Deployment scripts tested
- [ ] Security hardened

**Operational Success:**
- [ ] Can deploy from VPS reliably
- [ ] Can run tests automatically
- [ ] Health checks passing
- [ ] Logs accessible and rotated
- [ ] Team comfortable with VPS

**Cost Success:**
- [ ] Monthly costs within budget ($60-150/month)
- [ ] No unexpected charges
- [ ] Efficient resource usage

---

## 📞 RECOMMENDED SETUP

**Final Recommendation:** **DigitalOcean $48/month Droplet + Backups**

**Total Setup Time:** 1-2 weeks (can be done in parallel with testnet validation)

**Monthly Investment:** ~$60/month (VPS + backups) + gas costs

**Benefits:**
- ✅ Professional infrastructure
- ✅ 24/7 operations capability
- ✅ Automated deployments
- ✅ Secure key management
- ✅ Scalable architecture
- ✅ Peace of mind

**Status:** ✅ READY TO IMPLEMENT

**Next Action:** Sign up for DigitalOcean and provision droplet

---

🖥️ **VPS = PROFESSIONAL OPERATIONS** 🚀
