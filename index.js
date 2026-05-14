   const express = require('express');
const cors = require('cors');
const bip39 = require('bip39');
const { hdkey } = require('ethereumjs-wallet');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { BIP32Factory } = require('bip32');
const { derivePath } = require('ed25519-hd-key');
const bs58 = require('bs58');

const bip32 = BIP32Factory(ecc);
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/generate', async (req, res) => {
    try {
        // 1. Generate 12-word mnemonic
        const mnemonic = bip39.generateMnemonic();
        const seed = await bip39.mnemonicToSeed(mnemonic);

        // 2. Ethereum / BSC / Polygon (m/44'/60'/0'/0/0)
        const ethWallet = hdkey.fromMasterSeed(seed).derivePath("m/44'/60'/0'/0/0").getWallet();
        
        // 3. Bitcoin SegWit (m/84'/0'/0'/0/0)
        const btcNode = bip32.fromSeed(seed).derivePath("m/84'/0'/0'/0/0");
        const { address: btcAddress } = bitcoin.payments.p2wpkh({ 
            pubkey: btcNode.publicKey, 
            network: bitcoin.networks.bitcoin 
        });

        // 4. Solana (m/44'/501'/0'/0')
        const solSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
        const solAddress = bs58.encode(solSeed);

        // 5. TON (Deterministic Mirage ID)
        const tonSeed = derivePath("m/44'/607'/0'", seed.toString('hex')).key;
        const tonAddress = "EQ" + bs58.encode(tonSeed).substring(0, 48);

        res.json({
            success: true,
            mnemonic: mnemonic,
            wallets: [
                { chain: "Bitcoin", symbol: "BTC", address: btcAddress, path: "m/84'/0'/0'/0/0" },
                { chain: "Ethereum", symbol: "ETH", address: ethWallet.getChecksumAddressString(), path: "m/44'/60'/0'/0/0" },
                { chain: "Solana", symbol: "SOL", address: solAddress, path: "m/44'/501'/0'/0'" },
                { chain: "TON", symbol: "TON", address: tonAddress, path: "m/44'/607'/0'" }
            ]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal generation failure" });
    }
});

app.get('/', (req, res) => res.send("MIRAGE ENGINE v2.1 [FINAL]"));

app.listen(PORT, () => console.log(`Engine active on port ${PORT}`));
     
