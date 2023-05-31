import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'; //imported bootstrap
import { Spinner } from 'react-bootstrap'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Marketplace from "./contracts/Marketplace.json";
import NFT from "./contracts/NFT.json";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Create from "./components/Create";
import MyListedItems from "./components/MyListedItem";
import MyPurchases from "./components/MyPurchases";
import { useState } from 'react';
const { ethers } = require("ethers"); //ethers@5.7.2 => IS USED HERE




function App() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [marketplace, setMarketplace] = useState(null);
  const [nft, setNft] = useState(null);
  
  //METAMSASK LOGIN/CONNECT
  const web3Handler = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0]);
    //Get Provider from Metamask
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    //Set up signer
    const signer = provider.getSigner();
    
    loadContracts(signer);
  }

  const loadContracts = async (signer) => {
    //Get Deployed copies of contracts
    const marketplace = new ethers.Contract("0xa513E6E4b8f2a923D98304ec87F64353C4D5C853", Marketplace.abi, signer);
    setMarketplace(marketplace);
    console.log(marketplace);
    const nft = new ethers.Contract("0x0165878A594ca255338adfa4d48449f69242Eb8F", NFT.abi, signer);
    setNft(nft);
    setLoading(false);
  }


  return (
    <div className='App'>
    <BrowserRouter>
    <div>
      <Navbar web3Handler={web3Handler} account={account}/>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Spinner animation="border" style={{ display: 'flex' }} />
        <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
      </div>
      ):(
      <Routes>
        <Route path="/" element={
          <Home marketplace={marketplace} nft={nft} />
        }/>
        <Route path="/create" element={<Create marketplace={marketplace} nft={nft}/>}/>
        <Route path="/my-listed-items" element={<MyListedItems marketplace={marketplace} nft={nft} account={account}/>}/>
        <Route path="/my-purchases" element={<MyPurchases marketplace={marketplace} nft={nft} account={account}/>}/>
      </Routes>
      )}
    </div>
    </BrowserRouter>
    </div>
  );
}

export default App;
