const LoyaltyProgramAbi = require('./Abi/loyalty-program-abi.json');

const express = require('express');
const {utils, ethers ,formatEther} = require('ethers');
require('dotenv').config();
const cors = require('cors');

const bodyParser = require('body-parser');

const app = express();
app.use(cors());
const PORT = 6475;


const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const privateKey = process.env.RELAYER_PK;  
const wallet = new ethers.Wallet(privateKey, provider);
const contractAddress = '0x8F0a6237B1C563e15bf0cdBfFfd7Ab195DE73a4e';
const contractABI = LoyaltyProgramAbi;

const contract = new ethers.Contract(contractAddress, contractABI, wallet);

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

app.post('/relay', async (req, res) => {
    try {
        const { from, to, amount, signature } = req.body;

        // Send the transaction via the contract's userTransferTokensToUser function
        const txResponse = await contract.userTransferTokensToUser(from, to, amount, signature);
        const txReceipt = await txResponse.wait();

        res.json({ success: true, txHash: txReceipt.hash });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/approve', async (req, res) => {
    try {
        const { owner, spender, value, signature } = req.body;

        // Send the transaction via the contract's approveFor function
        const txResponse = await contract.gaslessApprove(owner, spender, value, signature);
        const txReceipt = await txResponse.wait();

        res.json({ success: true, txHash: txReceipt.hash });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

