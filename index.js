const express = require('express');
const cors = require('cors');
const bip39 = require('bip39');
const { hdkey } = require('ethereumjs-wallet');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { BIP32Factory } = require('bip32');
const { derivePath } = require('ed25519-hd-key');
const bs58 = require('bs58');
const nacl = require('tweetnacl');
const { Address } = require('@ton/core');

const bip32 = BIP32Factory(ecc);
const app = express();
app.use(cors());
app.use(express.json());

app.get('/generate', async (req, res) => {
    try {
        const mnemonic = bip39.generateMnemonic();
        const seed = await bip39.mnemonicToSeed(mnemonic);

        // 1. ETH (m/44'/60'/0'/0/0)
        const ethWallet = hdkey.fromMasterSeed(seed).derivePath("m/44'/60'/0'/0/0").getWallet();
        
        // 2. BTC SegWit (m/84'/0'/0'/0/0)
        const btcNode = bip32.fromSeed(seed).derivePath("m/84'/0'/0'/0/0");
        const { address: btcAddress } = bitcoin.payments.p2wpkh({ pubkey: btcNode.publicKey });

        // 3. SOLANA (m/44'/501'/0'/0')
        const solPath = "m/44'/501'/0'/0'";
        const derivedSeed = derivePath(solPath, seed.toString('hex')).key;
        const solKeyPair = nacl.sign.keyPair.fromSeed(derivedSeed);
        const solAddress = bs58.encode(Buffer.from(solKeyPair.publicKey));

        // 4. TON (m/44'/607'/0'/0'/0') - Format: UQ (Non-Bounceable)
        const tonPath = "m/44'/607'/0'/0'/0'"; 
        const tonSeed = derivePath(tonPath, seed.toString('hex')).key;
        const tonKeyPair = nacl.sign.keyPair.fromSeed(tonSeed);
        
        const tonAddressObj = new Address(0, Buffer.from(tonKeyPair.publicKey)); 
        const tonUserFriendly = tonAddressObj.toString({ bounceable: false, testOnly: false });

        res.json({
            success: true,
            mnemonic: mnemonic,
            wallets: [
                { chain: "Bitcoin", symbol: "BTC", address: btcAddress },
                { chain: "Ethereum", symbol: "ETH", address: ethWallet.getChecksumAddressString() },
                { chain: "Solana", symbol: "SOL", address: solAddress },
                { chain: "TON", symbol: "TON", address: tonUserFriendly }
            ]
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/', (req, res) => res.send("MIRAGE ENGINE v2.2.1 ONLINE"));

app.listen(process.env.PORT || 3000);
