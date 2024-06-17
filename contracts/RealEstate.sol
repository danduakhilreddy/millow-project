//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
contract RealEstate is ERC721URIStorage{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    constructor() ERC721("Real Estate","ITM") {

    }
    //mint is nothing but creaing new nfts ,function for creaign new nfts
    function mint(string memory tokenURI) public returns (uint256){
        _tokenIds.increment();

        uint256 newItemId= _tokenIds.current();
        _mint(msg.sender,newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }
    //this fucntion give count of nfts
    function totalSupply() public view returns(uint256){
        return _tokenIds.current();
    }


}
