//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    
    address public lender;
    address public inspector;
    address payable public seller;//seller reiceves money 
    address public nftAddress;
    mapping(uint256=>bool) public isListed;//this saves the houses(nfts) that already listed(nftId,true)
    //is this property listed means sold or not
    //mappings for purchaseprice,escrowamount,buyer
    mapping(uint256=>uint256) public purchasePrice;
    mapping(uint256=>uint256) public escrowAmount;
    mapping(uint256=>address) public buyer;
    //each nft(house) has a id  
    //create modifier as only seller can call list fucntion as he can only sell
    //is inspection passed or not
    mapping(uint=>bool) public inspectionPassed;
    //map for approval who approved this selling
    mapping(uint=>mapping(address=>bool)) public approval;
    constructor(address _nftAddress,address payable _seller,address _inspector,address _lender){
        nftAddress=_nftAddress;
        seller=_seller;
        inspector=_inspector;
        lender=_lender;
    }
    modifier onlySeller(){
        require(msg.sender==seller,"only seller can call this method");
        _;
    } 
    modifier onlyBuyer(uint256 _nftID){
        require(msg.sender==buyer[_nftID],"only buyer can call this");
        _;
    }
    modifier onlyInspector(){
        require(msg.sender==inspector,"only inspector can call this");
        _;
    }
    
    function list(uint256 _nftID,address _buyer,uint256 _purchasePower,uint256 _escrowAmount) public payable onlySeller{
        //transfer nft from seller(we sent to seller in escrow) to this contract
        //we use transfer from by creating objecct for interface
        //this here means this smartcontract address from the seller
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);
        //approve this in js file by seller to transfer this nft
        //make property listed
        isListed[_nftID]=true;//we used id from 1 for each nft
        //now check in js
        purchasePrice[_nftID]=_purchasePower;
        escrowAmount[_nftID]=_escrowAmount;
        buyer[_nftID]=_buyer;
    }
    //now deposit money , this is down payement or advance
    function depositEarnest(uint256 _nftID) public payable onlyBuyer(_nftID){
        require(msg.value>=escrowAmount[_nftID]);
    }
    //call revice fucntion to reciver ether to contract in above step
    //receive() external payable{}
    //function for inspection
    function updateInspectionStatus(uint256 _nftID,bool _passed) public onlyInspector{
        inspectionPassed[_nftID]=_passed;
    }
    
    //write test for each fucntion in js
    //write function with the one who approves the sale
    //buyer seller and lender all should approve
    function approveSale(uint256 _nftID) public{
        approval[_nftID][msg.sender]=true;
    }
    //finalizesale fucntion sends money to seller and tranfer ownership to buyer
    //works
    //require inspection status (add more items like appraisal)
    //require sale to be authorized
    //require funds to be correct amount
    //transfer nft to buyer
    //transfer funds to seller
    function finalizeSale(uint256 _nftID) public{
        require(inspectionPassed[_nftID]);
        require(approval[_nftID][buyer[_nftID]]);
        require(approval[_nftID][seller]);
        require(approval[_nftID][lender]);
        require(address(this).balance>=purchasePrice[_nftID]);
        //now this nft is sold so make listed false
        isListed[_nftID]=false;
        //send ether to seller
        (bool success,)=payable(seller).call{value:address(this).balance}("");
        require(success);
        //now transfer nft ownership to buyer
        IERC721(nftAddress).transferFrom(address(this),buyer[_nftID], _nftID);

    }
    //cancel sale
    //if inspection status is not approved, then refund earnest desposit that is advnce
    function cancelSale(uint256 _nftID) public{
        if(inspectionPassed[_nftID]==false){
            payable(buyer[_nftID]).transfer(address(this).balance);
        }else{
            payable(seller).transfer(address(this).balance);
        }
    }
    receive() external payable{}
    //gives balance of this user
    function getBalance() public view returns(uint256){
        return address(this).balance;
    }

}
