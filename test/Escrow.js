const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    let buyer,seller,inspector,lender;
    let realEstate,escrow;
    //beforeeach makes execute before below it fucntions runs
    beforeEach(async()=>{
        //hardhat provide us some signers , that is for test it gives 20 persons with address
        //const signers=await ethers.getSigners();//returns array of signers
        //console.log(signers.length);
        // const buyer=signers[0];
        // const seller=signers[1];
        //the above can also be written as
        [buyer,seller,inspector,lender]=await ethers.getSigners();
        //deploying the realstate
        const RealEstate=await ethers.getContractFactory('RealEstate');
        realEstate = await RealEstate.deploy();//stores nft , we can get this address by .address
        // console.log(realEstate.address);//address of this deployed address
        //now lets mint it, means create a new digital asset with nft
        //mint fucntion is taking uri of metadata as input see in realestate file
        //this uri has meta data of a site 
        //connect used to say from which accouny the below trasaction is perfomred,in blockchain every trascation(fucntion call) person called that fucntion adreess is stored and the one that minted stored here
        let transaction =await realEstate.connect(seller).mint('https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/1.json');
        //waits till trasnation in blockchain in completed
        await transaction.wait();
        //now lets deploy escrow contract in blockchain
        const Escrow=await ethers.getContractFactory('Escrow');
        //here we deployed escrow instace to blockcahin also send parameters , see escrow smartcontract
        escrow=await Escrow.deploy(realEstate.address,seller.address,inspector.address,lender.address);
        //***now we deployed ib bc ,now we shoudl send this nft to escrow.sol by approving req so we can operate operations there */
        //approve the transfer request
        transaction=await realEstate.connect(seller).approve(escrow.address,1);
        await transaction.wait();
        //list property call the list funciton
        transaction=await escrow.connect(seller).list(1,buyer.address,tokens(10),tokens(5));//here connect means that seller calling the fucntion
        await transaction.wait();
    })
    //here lets test code as does arguments sent here to escrow mint are matching to here vairables address
    describe('Deployement',()=>{
        let result;
        //testing are they are working cooorectly run npx hardhat test
        it('Returns NFT address', async()=>{
            result=await escrow.nftAddress();//this is nftadress variabl in escrow contract
            expect(result).to.be.equal(realEstate.address);
        })
        it('Returns seller', async()=>{
            result=await escrow.seller();
            expect(result).to.be.equal(seller.address);
        })
        it('Returns lender', async()=>{
            result=await escrow.lender();
            expect(result).to.be.equal(lender.address);
        })
        it('Returns inspector', async()=>{
            result=await escrow.inspector();
            expect(result).to.be.equal(inspector.address);
        })
    })
    //lets test the listing fucntion 
    describe('Listing',()=>{
        it('is updates listed',async()=>{
            const result=await escrow.isListed(1);
            expect(result).to.be.equal(true);
        })
        it('transfer ownership', async()=>{
            //ownerOf gives the owner
            //it gives etheruem address who is currently owning this nftid
            const result=await realEstate.ownerOf(1);
            expect(result).to.be.equal(escrow.address);

        })
        it('returns buyer',async()=>{
            const result=await escrow.buyer(1);
            expect(result).to.be.equal(buyer.address);
        })
        it('retusn purchase price',async()=>{
            const result=await escrow.purchasePrice(1);
            expect(result).to.be.equal(tokens(10))
        })
        it('returns escrow amount',async()=>{
            const result=await escrow.escrowAmount(1);
            expect(result).to.be.equal(tokens(5));
        })
    })
    describe('Deposits',()=>{
        it('updates contract balance',async()=>{
            const trasaction=await escrow.connect(buyer).depositEarnest(1,{value:tokens(5)});//here value is the buyer sending money with this trasaction

            await trasaction.wait();
            const result=await escrow.getBalance();
            expect(result).to.be.equal(tokens(5));
        })
    })
    describe('Inspection',()=>{
        it('inspection returns',async()=>{
            const transaction=await escrow.connect(inspector).updateInspectionStatus(1,true);
            await transaction.wait();
            const result=await escrow.inspectionPassed(1);
            expect(result).to.be.equal(true);
        })
    })
    //tesst approval function
    describe('Approval',()=>{
        it('buyer returns approval',async()=>{
            const transaction=await escrow.connect(buyer).approveSale(1);
            await transaction.wait();
            const result=await escrow.approval(1,buyer.address);
            expect(result).to.be.equal(true);
        })
        it('seller returns approval',async()=>{
            const transaction=await escrow.connect(seller).approveSale(1);
            await transaction.wait();
            const result=await escrow.approval(1,seller.address);
            expect(result).to.be.equal(true);
        })
        it('lender returns approval',async()=>{
            const transaction=await escrow.connect(lender).approveSale(1);
            await transaction.wait();
            const result=await escrow.approval(1,lender.address);
            expect(result).to.be.equal(true);
        })
    })
    describe('sale',async()=>{
        beforeEach(async()=>{
            //this is intail deposit of 5 ether
            let transaction=await escrow.connect(buyer).depositEarnest(1,{value:tokens(5)});//here value is the buyer sending money with this trasaction
            await transaction.wait();
            transaction=await escrow.connect(inspector).updateInspectionStatus(1,true);
            await transaction.wait();
            transaction=await escrow.connect(buyer).approveSale(1);
            await transaction.wait();
            transaction=await escrow.connect(seller).approveSale(1);
            await transaction.wait();
            transaction=await escrow.connect(lender).approveSale(1);
            await transaction.wait();
            //lender is bank escrow is broker
            await lender.sendTransaction({to: escrow.address,value: tokens(5)});
            transaction=await escrow.connect(seller).finalizeSale(1);
            await transaction.wait();

        })

        //it runs if top bfore each completed
        it("works",async()=>{

        })
        //check is final fund transfer done properly
        it('updates balance at final',async()=>{
            expect(await escrow.getBalance()).to.be.equal(0);
        })
        it('updates ownership',async()=>{
            expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address);
        })
    })
    it('saves the addresses' ,async()=>{
        


    })
})
