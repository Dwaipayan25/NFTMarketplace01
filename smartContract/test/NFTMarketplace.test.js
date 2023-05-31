const { expect } = require("chai");

const toWei = (n) => {
    return ethers.utils.parseEther(n.toString());
}
const fromWei = (n) => {
    return ethers.utils.formatEther(n);
}

describe("NFTMarketplace", async () => {
        let nft,marketplace,deployer,addr1,addr2,emit;
        let URI="sampleURI";
        //get contract factory
        beforeEach(async () => {
            const NFT = await ethers.getContractFactory("NFT");
            const Marketplace = await ethers.getContractFactory("Marketplace");
            //get signers
            [deployer, addr1, addr2] = await ethers.getSigners();
            //deploy contracts
            nft = await NFT.deploy();
            marketplace = await Marketplace.deploy(10);
        });

        describe("Deployment", async () => {
            it("Should track name and symbol", async () => {
                expect(await nft.name()).to.equal("DApp NFT");
                expect(await nft.symbol()).to.equal("DAPP");
            });
            it("Should track the feeAccount and feePercent", async () => {
                expect(await marketplace.feeAccount()).to.equal(deployer.address);
                expect(await marketplace.feePercent()).to.equal(10);
            });
        });

        describe("Minting NFTs", async () => {
            it("Should track each minted NFT", async () => {
                //address1 mints an NFT
                await nft.connect(addr1).mint(URI);
                expect(await nft.tokenCount()).to.equal(1);
                expect(await nft.balanceOf(addr1.address)).to.equal(1);
                expect(await nft.ownerOf(1)).to.equal(addr1.address);
                expect(await nft.tokenURI(1)).to.equal(URI);
                //address2 mints an NFT
                await nft.connect(addr2).mint(URI);
                expect(await nft.tokenCount()).to.equal(2);
                expect(await nft.balanceOf(addr2.address)).to.equal(1);
                expect(await nft.ownerOf(2)).to.equal(addr2.address);
                expect(await nft.tokenURI(2)).to.equal(URI);
            });
        })

        describe("Making marketplace items", async () => {
            beforeEach(async () => {
                //address1 mints an NFT
                await nft.connect(addr1).mint(URI);
                //add1 approves marketplace to transfer NFT
                await nft.connect(addr1).setApprovalForAll(marketplace.address,true);
            })
            
            it("Should track newly created item, transfer NFT from seller to marketPlace and emit offered event", async () => {
                //address1 creates a marketplace item
                await expect(marketplace.connect(addr1).makeItem(nft.address,1,toWei(1)))
                    .to.emit(marketplace,"Offered")
                    .withArgs(
                        1,
                        nft.address,
                        1,
                        toWei(1),
                        addr1.address,
                    );
                //owner of NFT is now marketplace
                expect(await nft.ownerOf(1)).to.equal(marketplace.address);
                //marketplace has 1 item
                expect(await marketplace.itemCount()).to.equal(1);
                //get items from items mapping and check each field to ensure it is correct
                const item = await marketplace.items(1);
                expect(item.itemId).to.equal(1);
                expect(item.nft).to.equal(nft.address);
                expect(item.tokenId).to.equal(1);
                expect(item.price).to.equal(toWei(1));
                expect(item.sold).to.equal(false);
            });

            it("Should fail if price is 0", async () => {
                await expect(marketplace.connect(addr1).makeItem(nft.address,1,0))
                    .to.be.revertedWith("Price must be greater than 0");
            });
        });

        describe("Buying marketplace items", async () => {
            let price=2;
            beforeEach(async () => {
                //address1 mints an NFT
                await nft.connect(addr1).mint(URI);
                //add1 approves marketplace to transfer NFT
                await nft.connect(addr1).setApprovalForAll(marketplace.address,true);
                //address1 creates a marketplace item
                await marketplace.connect(addr1).makeItem(nft.address,1,toWei(price));
            });
            it("Should update item as sold, pay seller, transfer NFT to buyer, charge fees and emit a bought event", async () => {
                const sellerInitialBalance = await addr1.getBalance();
                const feeAccountInitialBalance = await deployer.getBalance();
                //fetch total price of item
                let totalPriceinWei = await marketplace.getTotalPrice(1);
                //adddress2 buys item
                await expect(marketplace.connect(addr2).purchaseItem(1,{value:totalPriceinWei}))
                    .to.emit(marketplace,"Bought")
                    .withArgs(
                        1,
                        nft.address,
                        1,
                        toWei(price),
                        addr1.address,
                        addr2.address
                    );
                //owner of NFT is now buyer
                expect(await nft.ownerOf(1)).to.equal(addr2.address);
                const sellerFinalBalance = await addr1.getBalance();
                const feeAccountFinalBalance = await deployer.getBalance();
                //seller should recieve price for NFT sold
                expect(+fromWei(sellerFinalBalance)).to.equal(+price + +fromWei(sellerInitialBalance));
                //calculate fee
                let fee = +price * 10 / 100;
                //feeAccount should recieve fee
                expect(+fromWei(feeAccountFinalBalance)).to.equal(+fee + +fromWei(feeAccountInitialBalance));
                //item should be marked as sold
                const item = await marketplace.items(1);
                expect(item.sold).to.equal(true);
            });
            it("Should fail for invalid item ids,sold items, if buyer does not send enough ether", async () => {
                let totalPriceinWei = await marketplace.getTotalPrice(1);
                //fails for invalid item id
                await expect(marketplace.connect(addr2).purchaseItem(2,{value:toWei(price)}))
                    .to.be.revertedWith("Invalid Item Id");
                await expect(marketplace.connect(addr2).purchaseItem(0,{value:toWei(price)}))
                    .to.be.revertedWith("Invalid Item Id");
                //fails if buyer does not send enough ether
                await expect(marketplace.connect(addr2).purchaseItem(1,{value:toWei(price)}))
                    .to.be.revertedWith("Not enough funds");
                //fails for sold item
                await marketplace.connect(addr2).purchaseItem(1,{value:totalPriceinWei});
                await expect(marketplace.connect(addr2).purchaseItem(1,{value:totalPriceinWei}))
                    .to.be.revertedWith("Item is already sold");
            });
        });
});