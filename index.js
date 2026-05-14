const express = require('express');
const { walletCore } = require('@trustwallet/wallet-core');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/generate', async (req, res) => {
    try {
        // 1. Initialize WASM Library
        const core = await walletCore();
        
        // 2. Generate a fresh 12-word mnemonic
        const wallet = core.HDWallet.create(128, ""); 

        // 3. Define the coins we want to generate addresses for
        // You can add any coin supported by Trust Wallet Core here
        const coinList = [
            { name: "Bitcoin", symbol: "BTC", type: core.CoinType.bitcoin },
            { name: "Ethereum", symbol: "ETH", type: core.CoinType.ethereum },
            { name: "TON", symbol: "TON", type: core.CoinType.ton },
            { name: "Solana", symbol: "SOL", type: core.CoinType.solana },
            { name: "Binance Smart Chain", symbol: "BNB", type: core.CoinType.smartChain },
            { name: "Tron", symbol: "TRX", type: core.CoinType.tron },
            { name: "Polygon", symbol: "MATIC", type: core.CoinType.polygon },
            { name: "Dogecoin", symbol: "DOGE", type: core.CoinType.dogecoin }
        ];

        // 4. Map through the coins and generate the addresses
        const accounts = coinList.map(coin => ({
            chain: coin.name,
            symbol: coin.symbol,
            address: wallet.getAddressForCoin(coin.type)
        }));

        // 5. Build Final Response
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
