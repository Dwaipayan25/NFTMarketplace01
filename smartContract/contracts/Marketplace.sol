// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract Marketplace is ReentrancyGuard{
    address payable public feeAccount;
    uint public immutable feePercent;
    uint public itemCount;

    struct Item{
        uint itemId;
        IERC721 nft;
        uint tokenId;
        uint price;
        address payable seller;
        bool sold;
    }

    event Offered(uint itemId,address indexed nft,uint tokenId,uint price,address indexed seller);
    event Bought(uint itemId,address indexed nft,uint tokenId,uint price,address indexed seller,address indexed buyer);

    //itemId=>Item
    mapping(uint => Item) public items;

    constructor(uint _feePercent){
        feeAccount = payable(msg.sender);
        feePercent = _feePercent;
    }

    function makeItem(IERC721 _nft,uint tokenId, uint price) external nonReentrant{
        require(price > 0,"Price must be greater than 0");
        itemCount++;
        _nft.transferFrom(msg.sender,address(this),tokenId);
        items[itemCount] = Item(
            itemCount,
            _nft,
            tokenId,
            price,
            payable(msg.sender),
            false
        );
        emit Offered(itemCount,address(_nft),tokenId,price,msg.sender);
    }

    function purchaseItem(uint _id)external payable nonReentrant{
        uint _totalPrice = getTotalPrice(_id);
        Item storage item = items[_id];
        require(_id>0 && _id<=itemCount,"Invalid Item Id");
        require(msg.value >= _totalPrice,"Not enough funds");
        require(item.sold == false,"Item is already sold");

        item.seller.transfer(item.price);
        feeAccount.transfer(_totalPrice - item.price);
        //update item to sold
        item.sold = true;
        //transfer ownership of nft to buyer
        item.nft.transferFrom(address(this),msg.sender,item.tokenId);
        //emit bought event
        emit Bought(_id,address(item.nft),item.tokenId,item.price,item.seller,msg.sender);
    }

    function getTotalPrice(uint _id) public view returns(uint){
        Item memory item = items[_id];
        uint totalPrice = item.price + (item.price * feePercent / 100);
        return totalPrice;
    }

}