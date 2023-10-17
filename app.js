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
//PK del ADMIN
//PK de cada COMMERCE que haya

//Vendra por parametro el loyaltyProgram address con el que se ejecutará la acción

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const privateKey = process.env.RELAYER_PK;  //Será dinamico segun que user llame
const wallet = new ethers.Wallet(privateKey, provider);

const contractAddress = process.env.LOYALTY_PROGRAM_ADDRESS; //Será dinamico segun que user llame
const contractABI = LoyaltyProgramAbi.abi;

const contractLoyaltyProgram = new ethers.Contract(contractAddress, contractABI, wallet);

const contractLoyaltyProgramFactory = new ethers.Contract(process.env.LOYALTY_PROGRAM_FACTORY_ADDRESS, LoyaltyProgramFactory.abi, wallet);

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

app.post('/transfer', async (req, res) => {
    try {
        const { from, to, amount, signature } = req.body;

        const txResponse = await contractLoyaltyProgram.userTransferTokensToUser(from, to, amount, signature);
        const txReceipt = await txResponse.wait();

        res.json({ success: true, txHash: txReceipt.hash });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message, error: 'Transaction failed'  });
    }
});

app.post('/approve', async (req, res) => {
    try {
        const { owner, spender, value, signature } = req.body;
        console.log(value);

        const txResponse = await contractLoyaltyProgram.gaslessApprove(owner, spender, value, signature);
        const txReceipt = await txResponse.wait();

        res.json({ success: true, txHash: txReceipt.hash });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message, error: 'Transaction failed' });
    }
});

app.post('/register', async (req, res) => {
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
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

