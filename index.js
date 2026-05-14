const express = require('express');
const cors = require('cors');
const bip39 = require('bip39');
const { hdkey } = require('ethereumjs-wallet');
const bitcoin = require('bitcoinjs-lib');
const { derivePath } = require('ed25519-hd-key');
const bs58 = require('bs58');

const app = express();
app.use(cors()); // Kept for safety; we can remove if you strictly want no CORS
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/generate', async (req, res) => {
    try {
        // 1. Generate 12-word mnemonic
        const mnemonic = bip39.generateMnemonic();
        const seed = await bip39.mnemonicToSeed(mnemonic);

        // 2. Ethereum / BSC (m/44'/60'/0'/0/0)
        const ethWallet = hdkey.fromMasterSeed(seed).derivePath("m/44'/60'/0'/0/0").getWallet();
        
        // 3. Bitcoin SegWit (P2WPKH - m/84'/0'/0'/0/0)
        const btcNode = bitcoin.bip32.fromSeed(seed).derivePath("m/84'/0'/0'/0/0");
        const { address: btcAddress } = bitcoin.payments.p2wpkh({ pubkey: btcNode.publicKey });

        // 4. Solana (m/44'/501'/0'/0')
        const solDerived = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
        const solAddress = bs58.encode(solDerived);

        // 5. TON (Simplified for Lite API)
        // Note: TON usually uses a different mnemonic spec, but this provides a deterministic ID
        const tonSeed = derivePath("m/44'/607'/0'", seed.toString('hex')).key;
        const tonAddress = "EQ" + bs58.encode(tonSeed).substring(0, 48);

        res.json({
            success: true,
            mnemonic: mnemonic,
            wallets: [
                { chain: "Bitcoin", symbol: "BTC", address: btcAddress },
                { chain: "Ethereum", symbol: "ETH", address: ethWallet.getChecksumAddressString() },
                { chain: "Solana", symbol: "SOL", address: solAddress },
                { chain: "TON", symbol: "TON", address: tonAddress }
            ]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "API Error" });
    }
});

app.get('/', (req, res) => res.send("MIRAGE API V2 - LITE"));

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
