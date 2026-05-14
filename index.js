        // 5. Buildconst express = require('express');
const cors = require('cors');
const { walletCore } = require('@trustwallet/wallet-core');

const app = express();

// 1. ALLOW YOUR FRONTEND TO TALK TO THIS API
app.use(cors()); 
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 2. PRE-LOAD THE HEAVY ENGINE IMMEDIATELY
let coreInstance = null;
async function initEngine() {
    try {
        console.log("Loading Wallet Core WASM...");
        coreInstance = await walletCore();
        console.log("MIRAGE Engine Ready ✅");
    } catch (err) {
        console.error("Engine failed to start:", err);
    }
}
initEngine();

// 3. THE GENERATE ROUTE
app.get('/generate', async (req, res) => {
    if (!coreInstance) {
        return res.status(503).json({ 
            success: false, 
            message: "Engine warming up. Refresh in 10 seconds." 
        });
    }

    try {
        const wallet = coreInstance.HDWallet.create(128, ""); 
        
        const response = {
            success: true,
            mnemonic: wallet.mnemonic(),
            wallets: [
                { chain: "Bitcoin", symbol: "BTC", address: wallet.getAddressForCoin(coreInstance.CoinType.bitcoin) },
                { chain: "Ethereum", symbol: "ETH", address: wallet.getAddressForCoin(coreInstance.CoinType.ethereum) },
                { chain: "TON", symbol: "TON", address: wallet.getAddressForCoin(coreInstance.CoinType.ton) },
                { chain: "Solana", symbol: "SOL", address: wallet.getAddressForCoin(coreInstance.CoinType.solana) }
            ]
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ success: false, error: "Generation error" });
    }
});

app.get('/', (req, res) => res.send("MIRAGE API IS ONLINE"));

app.listen(PORT, () => console.log(`Active on port ${PORT}`));
 Final Response
        const response = {
            success: true,
            mnemonic: wallet.mnemonic(),
            seed: wallet.seed().toString('hex'),
            wallets: accounts,
            note: "All ERC20 and BEP20 tokens use the Ethereum/BSC address."
        };

        res.json(response);
        
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

// Simple landing page
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
            <h1>MIRAGE Wallet Engine v1.1</h1>
            <p>Ready to generate multi-chain wallets.</p>
            <a href="/generate" style="padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">Test /generate</a>
        </div>
    `);
});

app.listen(PORT, () => {
    console.log(`MIRAGE API active on port ${PORT}`);
});
