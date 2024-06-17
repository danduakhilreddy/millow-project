import { useEffect, useState } from 'react';
import { ethers } from 'ethers';//to talk to blockcahin

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';

// ABIs
import RealEstate from './abis/RealEstate.json'
import Escrow from './abis/Escrow.json'

// Config
import config from './config.json';

function App() {
  const [homes,setHomes]=useState([]);
  const [provider,setProvider]=useState(null);
  const [account,setAccount]=useState(null);
  const [escrow,setEscrow]=useState(null);
  //this is for when we select one home state changes
  const [home,setHome]=useState({});
  const [toggle,setToggle]=useState(false);
  //connect to blockcahin using ether.js inbuilt fucntion
  const loadBlockchainData=async ()=>{
    const provider=new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);
    const network=await provider.getNetwork();
    const realEstate=new ethers.Contract(config[network.chainId].realEstate.address,RealEstate,provider);
    const totalSupply=await realEstate.totalSupply();//list of nfts size realEstate noew stores allnf t data
    const homes=[];
    for (var i = 1; i <= totalSupply; i++) {
      const uri = await realEstate.tokenURI(i)
      const response = await fetch(uri)
      const metadata = await response.json()
      homes.push(metadata)
    }
    setHomes(homes);
    //console.log(homes);
    //console.log(totalSupply.toString());//how many homes preseent in blockcahin
    //to access smart contracts from network with addressof contracts stored in config file
    
    const escrow=new ethers.Contract(config[network.chainId].escrow.address,Escrow,provider);
    setEscrow(escrow);
    //if account changed then reftetch the page usestate will take care of it
    window.ethereum.on('accountsChanged',async()=>{
      const accounts=await window.ethereum.request({method:'eth_requestAccounts'});
      const account=ethers.utils.getAddress(accounts[0]);
      setAccount(account);
    })//intially we gave oth account if it is not there in nav file it will reassign
  }
  //calling the function when rendered
  useEffect(()=>{
    loadBlockchainData();
  },[])
  const togglePop=(home)=>{
    setHome(home);
    toggle?setToggle(false):setToggle(true);
  }
  return (
    <div>
      <Navigation account={account} setAccount={setAccount}/>
      <Search/>
      <div className='cards__section'>

        <h3>Homes for you</h3>
        <hr/>
        <div className='cards'>
          {homes.map((home,index)=>(
              <div className='card' key={index} onClick={()=>{togglePop(home)}}>
              <div className='card__image'>
                <img src={home.image} alt="home"/>
              </div>
              <div className="card__info">
                <h4>{home.attributes[0].value} ETH</h4>
                <p>
                  <strong>{home.attributes[2].value}</strong> bds |
                  <strong>{home.attributes[3].value}</strong>  ba |
                  <strong>{home.attributes[4].value}</strong>sqft
                </p>
                <p>{home.address}</p>
              </div>
            </div>
          ))}
          

        </div>

      </div>
          {toggle&&(
            <Home home={home} provider={provider} account={account} escrow={escrow} togglePop={togglePop}/>
          )}
    </div>
  );
}

export default App;
