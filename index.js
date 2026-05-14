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

        // ETH/BSC - Standard Path
        const ethWallet = hdkey.fromMasterSeed(seed).derivePath("m/44'/60'/0'/0/0").getWallet();
        
        // BTC SegWit - Standard Path
        const btcNode = bip32.fromSeed(seed).derivePath("m/84'/0'/0'/0/0");
        const { address: btcAddress } = bitcoin.payments.p2wpkh({ pubkey: btcNode.publicKey });

        // SOLANA - Standard Path & Ed25519 Public Key
        const solPath = "m/44'/501'/0'/0'";
        const solDerived = derivePath(solPath, seed.toString('hex')).key;
        const solKeyPair = nacl.sign.keyPair.fromSeed(solDerived);
        const solAddress = bs58.encode(Buffer.from(solKeyPair.publicKey));

        // TON - Standard Path & UQ (Non-Bounceable) Format
        const tonPath = "m/44'/607'/0'/0'/0'"; 
        const tonSeed = derivePath(tonPath, seed.toString('hex')).key;
        const tonKeyPair = nacl.sign.keyPair.fromSeed(tonSeed);
        const tonAddressObj = new Address(0, Buffer.from(tonKeyPair.publicKey)); 
        const tonUserFriendly = tonAddressObj.toString({ 
            bounceable: false, 
            testOnly: false,
            urlSafe: true 
        });

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

app.listen(process.env.PORT || 3000);
