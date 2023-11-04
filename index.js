const LoyaltyProgramAbi = require('./Abi/loyalty-program.json');
const LoyaltyProgramFactory = require('./Abi/loyalty-program-factory.json');

const express = require('express');
const {utils, ethers ,formatEther} = require('ethers');
require('dotenv').config();
const cors = require('cors');

const bodyParser = require('body-parser');

const app = express();
app.use(cors());

 /* app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://loyalty-market.vercel.app');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });*/
const PORT = 6475;

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL); //Fijo para todos

const privateKeyAdmin = process.env.RELAYER_PK_ADMIN;  //Fija PK del admin (Factory)
const walletAdmin = new ethers.Wallet(privateKeyAdmin, provider);

const contractLoyaltyProgramFactory = new ethers.Contract(process.env.LOYALTY_PROGRAM_FACTORY_ADDRESS, LoyaltyProgramFactory.abi, walletAdmin);

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello, Ethers!');
});

app.get('/balance/:address', async (req, res) => {
    const address = req.params.address;

    try {
        const balanceWei = await provider.getBalance(address);
        const balanceEth = formatEther(balanceWei);
        res.send(`Balance of address ${address}: ${balanceEth} ETH`);
    } catch (error) {
        res.status(400).send(`Error: ${error.message}`);
    }
});

// Use Loyalty Program (dynamic)
app.post('/transfer', async (req, res) => {
    try {
        const { from, to, amount, signature, loyaltyProgramAddress, commercePrefix } = req.body;

  
        let envVarName = `RELAYER_PK_COMMERCE_${commercePrefix.toUpperCase()}`;
        let privateKeyCommerce = process.env[envVarName]; 

        let walletCommerce = new ethers.Wallet(privateKeyCommerce, provider);

        let contractLoyaltyProgram = new ethers.Contract(loyaltyProgramAddress, LoyaltyProgramAbi.abi, walletCommerce);

        let txResponse = await contractLoyaltyProgram.userTransferTokensToUser(from, to, amount, signature);

        let txReceipt = await txResponse.wait();

        res.json({ success: true, txHash: txReceipt.hash });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message, error: 'Transaction failed'  });
    }
});

// Use Loyalty Program (dynamic)
app.post('/approve', async (req, res) => {
    try {
        const { owner, spender, value, signature, loyaltyProgramAddress, commercePrefix } = req.body;

        const envVarName = `RELAYER_PK_COMMERCE_${commercePrefix.toUpperCase()}`;
        const privateKeyCommerce = process.env[envVarName]; 
        const walletCommerce = new ethers.Wallet(privateKeyCommerce, provider);

        const contractLoyaltyProgram = new ethers.Contract(loyaltyProgramAddress, LoyaltyProgramAbi.abi, walletCommerce);

        const txResponse = await contractLoyaltyProgram.gaslessApprove(owner, spender, value, signature);
        const txReceipt = await txResponse.wait();

        res.json({ success: true, txHash: txReceipt.hash });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message, error: 'Transaction failed' });
    }
});

// Use Loyalty Program Factory to registes and Loyalty Program (dynamic)
app.post('/register', async (req, res) => {
    try {
        const { address, loyaltyId, signature, commercePrefix } = req.body;

        const txResponse = await contractLoyaltyProgramFactory.addUserInfo(address, loyaltyId, commercePrefix, signature);
        const txReceipt = await txResponse.wait();

        const envVarName = `RELAYER_PK_COMMERCE_${commercePrefix.toUpperCase()}`;
        const privateKeyCommerce = process.env[envVarName]; 
        const walletCommerce = new ethers.Wallet(privateKeyCommerce, provider);

        const loyaltyProgramAddress = await contractLoyaltyProgramFactory.loyaltyProgramByPrefix(commercePrefix);
        const contractLoyaltyProgram = new ethers.Contract(loyaltyProgramAddress, LoyaltyProgramAbi.abi, walletCommerce);

        const txResponseLP = await contractLoyaltyProgram.register(loyaltyId, address);
        const txReceiptLP = await txResponseLP.wait();
      
        res.json({ success: true, txHashAddUser: txReceipt.hash, txHashRegister: txReceiptLP.hash });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message, error: 'Transaction failed' });
    }
});

// Use Loyalty Program (dynamic)
app.post('/redeem', async (req, res) => {
    try {
        const {productSku, from, toProductCommerceAddress, toUserCommerceAddress,
                amount, signature, loyaltyProgramAddress, commercePrefix } = req.body;

        let envVarName = `RELAYER_PK_COMMERCE_${commercePrefix.toUpperCase()}`;
        let privateKeyCommerce = process.env[envVarName]; 

        let walletCommerce = new ethers.Wallet(privateKeyCommerce, provider);

        let contractLoyaltyProgram = new ethers.Contract(loyaltyProgramAddress, LoyaltyProgramAbi.abi, walletCommerce);

        let txResponse = await contractLoyaltyProgram.redeemProduct(productSku, from, toProductCommerceAddress,
                                                                    toUserCommerceAddress, amount, signature);
        let txReceipt = await txResponse.wait();

        res.json({ success: true, txHash: txReceipt.hash });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message, error: 'Transaction failed'  });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

