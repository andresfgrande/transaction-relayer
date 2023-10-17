const LoyaltyProgramAbi = require('./Abi/loyalty-program.json');
const LoyaltyProgramFactory = require('./Abi/loyalty-program-factory.json');

const express = require('express');
const {utils, ethers ,formatEther} = require('ethers');
require('dotenv').config();
const cors = require('cors');

const bodyParser = require('body-parser');

const app = express();
app.use(cors());
const PORT = 6475;

/***** Se neceseita *****/
//PK del ADMIN en .env

//PK de cada COMMERCE que haya en .env

//Vendra por parametro el loyaltyProgram address con el que se ejecutará la acción

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL); //Fijo para todos

const privateKeyAdmin = process.env.RELAYER_PK_ADMIN;  //Será Fija PK del admin (Factory)
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

        console.log(loyaltyProgramAddress, commercePrefix, ' - PARAMS');
        

        let envVarName = `RELAYER_PK_COMMERCE_${commercePrefix.toUpperCase()}`;
        let privateKeyCommerce = process.env[envVarName]; 

        console.log(privateKeyCommerce ,'test1')
        console.log(process.env.RELAYER_PK_COMMERCE_NORM ,'test2')
        let walletCommerce = new ethers.Wallet(privateKeyCommerce, provider);
        console.log(walletCommerce,'test3')
        let contractLoyaltyProgram = new ethers.Contract(loyaltyProgramAddress, LoyaltyProgramAbi.abi, walletCommerce);
        console.log(contractLoyaltyProgram,'test4')
        let txResponse = await contractLoyaltyProgram.userTransferTokensToUser(from, to, amount, signature);
        console.log(txResponse,'test5')
        let txReceipt = await txResponse.wait();
        console.log(txReceipt,'test6')
        res.json({ success: true, txHash: txReceipt.hash });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message, error: 'Transaction failed'  });
    }
});

// Use Loyalty Program (dynamic)
app.post('/approve', async (req, res) => {
    try {
        const { owner, spender, value, signature, loyaltyProgramAddress, commercePrefix } = req.body;
        console.log(value);

        console.log(loyaltyProgramAddress, commercePrefix, ' - PARAMS');

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
/*app.post('/register', async (req, res) => {
    try {
        const { address, loyaltyId, loyaltyPrefix } = req.body;
        console.log(address, loyaltyId, loyaltyPrefix);

        const txResponse = await contractLoyaltyProgramFactory.addUserInfo(address, loyaltyId, loyaltyPrefix);
        const txReceipt = await txResponse.wait();

        const txResponseLP = await contractLoyaltyProgram.register(loyaltyId, address);
        const txReceiptLP = await txResponseLP.wait();
      
        res.json({ success: true, txHash1: txReceipt.hash, txHash2: txReceiptLP.hash });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message, error: 'Transaction failed' });
    }
});*/


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

