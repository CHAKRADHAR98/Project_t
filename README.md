# Token Bridge - Making Token-2022 DeFi Ready

A bridge system that enables **Token-2022** tokens with **Transfer Hooks** to be traded on all Solana AMMs by creating **1:1 backed standard SPL "bridge tokens"**.

---

## 🎯 Problem Solved
**Token-2022** enables programmable restrictions (**KYC**, whitelisting, transfer limits) via Transfer Hooks, making it perfect for **Real World Assets (RWA)** and enterprise use cases.  
However, no major AMMs (**Raydium, Orca, Meteora**) support trading these restricted tokens, limiting their DeFi adoption.

---

## ✨ Solution: 3-Step Bridge System
**Token-2022 with Hooks** → **Bridge Token (SPL)** → **Trade on ANY AMM**  
*(Restricted)* → *(Free)* → *(Jupiter, Orca, etc.)*

### How It Works
1. 🔒 **WRAP** – Lock Token-2022 tokens in secure vaults → Mint **1:1 backed bridge tokens**  
2. 📈 **TRADE** – Trade bridge tokens on **ANY** Solana AMM with full liquidity  
3. 🔓 **UNWRAP** – Burn bridge tokens → Unlock Token-2022 (**Transfer Hook validation enforced**)  

---

## 🏗️ Architecture

### Smart Contract (Rust/Anchor)
- **Bridge System** – Manages token locking/unlocking with 1:1 backing  
- **Vault Management** – Secure per-token vaults for locked Token-2022 tokens  
- **Whitelist System** – Transfer Hook implementation for compliance  
- **Admin Controls** – Approved hook program management  

### Frontend (Next.js/TypeScript)
- **Token Creation** – Create Token-2022 with Transfer Hooks  
- **Bridge Interface** – Wrap/unwrap tokens with real-time validation  
- **Pool Management** – Create liquidity pools on Orca  
- **Trading** – Swap bridge tokens using Jupiter aggregation  
- **Guided Demo** – Interactive walkthrough of the complete flow  

---

## 🛠️ Tech Stack
- **Smart Contracts** – Rust, Anchor Framework  
- **Frontend** – Next.js 14, TypeScript, Tailwind CSS  
- **Solana** – Token-2022, SPL Token, Wallet Adapter  
- **Integrations** – Jupiter (swaps), Orca (pools)  
- **UI Components** – shadcn/ui, Lucide icons  

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+  
- Rust and Anchor CLI  
- Solana CLI  

### Installation

**Clone the repository**
```bash
git clone https://github.com/your-username/token-bridge
cd token-bridge

### Install Dependencies
```bash
# Smart contract dependencies
npm install

# Frontend dependencies
cd frontend/token-bridge-frontend
npm install

### Set Up Environment
```bash
# Copy environment file
cp .env.example .env.local

# Configure for devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=Hfvd4ZLYac9wHs8fz4Yo3DCNqU1qRScMY4tu9GwQP7gw
NEXT_PUBLIC_NETWORK=devnet

### Running Locally
```bash
cd frontend/token-bridge-frontend
npm run dev
```

---

## 🧪 Testing the Bridge

1. **Connect Wallet** – Use Phantom or Solflare on Devnet.  

2. **Get Devnet SOL**  
```bash
solana airdrop 5 --url devnet
```

3. **Follow Guided Demo** – Complete the walkthrough in the application.

---

## 📚 Key Features

### ✅ Universal AMM Compatibility
- Bridge tokens are standard SPL tokens that work with **ALL** Solana AMMs without protocol modifications.

### ✅ Security & Compliance
- 1:1 backing ensures bridge tokens are always redeemable.  
- Transfer Hook validation is enforced on unwrap.  
- No bypass of Token-2022 restrictions.  
- Only whitelisted hook programs are allowed.  

### ✅ Complete User Experience
- Create Token-2022 with Transfer Hooks.  
- Bridge tokens with real-time validation.  
- Create liquidity pools on Orca.  
- Trade on Jupiter with price impact warnings.  
- Unwrap with Transfer Hook compliance checks.  

### ✅ Developer Experience
- Comprehensive TypeScript types.  
- Real-time error handling.  
- Loading states & user feedback.  
- Mobile-responsive design.  
- Dark mode support.  

---

## 🌊 AMM Integrations

### Orca Integration
- Create Splash Pools for new bridge tokens.  
- Add/remove liquidity.  
- Optimized for token launches.  

### Jupiter Integration
- Token swapping with price quotes.  
- Slippage protection.  
- Multi-hop routing.  
- **Universal Compatibility** – Works with Raydium, Meteora, Orca.

---

## 🛡️ Security Model

### Bridge Security
- **1:1 Backing** – Every bridge token is backed by a locked Token-2022 token.  
- **PDA Authority** – Program-derived addresses control all operations.  
- **No Admin Keys** – Decentralized vault management.  
- **Atomic Operations** – Wrap/unwrap operations occur in single, atomic transactions.  

### Transfer Hook Validation
- **Whitelist Only** – Only approved hook programs can be used.  
- **Enforced on Unwrap** – No bypassing Token-2022 restrictions.  
- **Compliance Ready** – Perfect for KYC/AML requirements.  

---

## 📋 Project Structure
```plaintext
token-bridge/
├── programs/
│   └── token-bridge-workspace/
│       ├── src/
│       │   ├── lib.rs              # Program entry point
│       │   ├── instructions/       # Bridge instructions
│       │   ├── state/              # Account structures
│       │   └── error.rs            # Custom errors
│       └── Cargo.toml
├── frontend/
│   └── token-bridge-frontend/
│       ├── src/
│       │   ├── app/                # Next.js app router
│       │   ├── components/         # UI components
│       │   ├── hooks/              # React hooks
│       │   ├── lib/                # Utilities
│       │   └── types/              # TypeScript types
│       ├── package.json
│       └── tailwind.config.ts
├── tests/                          # Anchor tests
├── migrations/                     # Deployment scripts
├── Anchor.toml                     # Anchor configuration
└── README.md

