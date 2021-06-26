// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.7.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@chainlink/contracts/src/v0.7/dev/VRFConsumerBase.sol";

/**
 * @title RaffleStore
 * @dev Keeps track of different raffles
 */
contract RaffleStore is IERC721Receiver, VRFConsumerBase {
    enum RaffleStatus {
        ONGOING,
        PENDING_COMPLETION,
        COMPLETE
    }

    struct Raffle {
        address creator;
        address nftContractAddress;
        uint256 nftId;
        uint256 totalPrice;
        uint256 totalTickets;
        address payable[] tickets;
        RaffleStatus status;
    }

    // Contract owner address
    address public owner;
    // NFT escrow Contract
    address public escrowContract;
    // stores raffles
    Raffle[] public raffles;

    // params for Chainlink VRF
    bytes32 internal keyHash;
    uint256 internal fee;

    // map VRF request to raffle
    mapping(bytes32 => uint256) internal randomnessRequestToRaffle;

    constructor(
        address _vrfCoordinator,
        address _linkToken,
        uint256 _fee,
        bytes32 _keyHash
    ) VRFConsumerBase(_vrfCoordinator, _linkToken) {
        owner = msg.sender;
        keyHash = _keyHash;
        fee = _fee;
    }

    // approves the NFT transfer from the owner to this contract
    function approveRaffle(address _contractAddress, uint256 _nftId) public {
        IERC721(_contractAddress).approve(address(this), _nftId);
    }

    // creates a new raffle
    function createRaffle(
        address _nftContract,
        uint256 _nftId,
        uint256 _numTickets,
        uint256 _totalPrice
    ) public {
        // TODO: encode these values to bytes
        // bytes memory raffleData = bytes((_numTickets, _totalPrice));
        bytes memory raffleData = "replace me";

        // do the nft transfer - TODO: wrap in require?
        IERC721(_nftContract).safeTransferFrom(
            msg.sender,
            address(this),
            _nftId,
            raffleData
        );
    }

    // complete raffle creation when receiving ERC721
    function onERC721Received(
        address operator,
        address _from,
        uint256 _tokenId,
        bytes memory data
    ) public override returns (bytes4) {
        // get the number of tickets and price
        // TODO: decode these values from the data param
        // (uint256 _numTickets, uint256 _totalPrice) = data;
        uint256 _numTickets = 10;
        uint256 _totalPrice = 1;

        // init tickets
        address payable[] memory _tickets; // = new address payable[](_numTickets);
        // create raffle
        Raffle memory _raffle = Raffle(
            msg.sender,
            _from,
            _tokenId,
            _totalPrice,
            _numTickets,
            _tickets,
            RaffleStatus.ONGOING
        );
        // store raffle in state
        raffles.push(_raffle);

        // emit event
        emit RaffleCreated(raffles.length - 1, msg.sender);

        // return funciton singature to confirm safe transfer
        return
            bytes4(
                keccak256("onERC721Received(address,address,uint256,bytes)")
            );
    }

    // enters a user in the draw for a given raffle
    function enterRaffle(uint256 raffleId, uint256 tickets) public payable {
        // validate purchase
        require(
            raffles[raffleId].status == RaffleStatus.ONGOING,
            "Raffle no longer active"
        );
        require(
            raffles[raffleId].tickets.length + tickets <=
                raffles[raffleId].totalTickets,
            "Not enough tickets available"
        );
        require(
            msg.value >=
                (raffles[raffleId].totalPrice /
                    raffles[raffleId].totalTickets) *
                    tickets,
            "Ticket price not paid"
        );

        // add tickets
        for (uint256 i = 0; i < tickets; i++) {
            raffles[raffleId].tickets.push(payable(msg.sender));
        }

        emit TicketsPurchased(raffleId, msg.sender, tickets);

        // award prizes if this was the last ticket purchased
        // TODO: this is a bug because the array is fixed length. Rather check the value of the last element?
        if (
            raffles[raffleId].tickets.length == raffles[raffleId].totalTickets
        ) {
            raffles[raffleId].status = RaffleStatus.PENDING_COMPLETION;
            chooseWinner(raffleId);
        }
    }

    function chooseWinner(uint256 _raffleId) internal {
        // Request a random number from Chainlink
        require(
            LINK.balanceOf(address(this)) > fee,
            "Not enough LINK - top up to contract complete raffle"
        );

        bytes32 requestId = requestRandomness(keyHash, fee);
        randomnessRequestToRaffle[requestId] = _raffleId;
    }

    // This function needs to use < 200k gas otherwise it will revert!
    // (award winner)
    function fulfillRandomness(bytes32 requestId, uint256 randomness)
        internal
        override
    {
        Raffle memory raffle = raffles[randomnessRequestToRaffle[requestId]];

        // map randomness to value between 0 and raffle.tickets.length
        // (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
        uint256 winnerIndex = ((randomness - 0) * (raffle.tickets.length - 0)) /
            (2**256 - 1 - 0) +
            0;

        // award winner
        IERC721(raffle.nftContractAddress).transferFrom(
            address(this),
            raffle.tickets[winnerIndex],
            raffle.nftId
        );

        // pay raffle creator
        payable(raffle.creator).transfer(raffle.totalPrice);

        raffles[randomnessRequestToRaffle[requestId]].status = RaffleStatus
        .COMPLETE;
        emit RaffleComplete(
            randomnessRequestToRaffle[requestId],
            raffle.tickets[winnerIndex]
        );
    }

    // allows us to claim back our link if we need to
    function withdrawLink() public {
        require(msg.sender == owner);
        require(
            LINK.transfer(msg.sender, LINK.balanceOf(address(this))),
            "Unable to transfer"
        );
    }

    event RaffleCreated(uint256 id, address creater);
    event TicketsPurchased(uint256 raffleId, address buyer, uint256 numTickets);
    event RaffleComplete(uint256 id, address winner);
}
