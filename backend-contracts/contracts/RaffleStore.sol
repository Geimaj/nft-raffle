// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.7.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.7/dev/VRFConsumerBase.sol";
import "hardhat/console.sol";

/**
 * @title RaffleStore
 * @dev Keeps track of different raffles
 */
contract RaffleStore is IERC721Receiver, VRFConsumerBase {
    using SafeMath for uint256;

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
        address[] tickets;
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

    // creates a new raffle
    // nftContract.approve should be called before this
    function createRaffle(
        IERC721 _nftContract,
        uint256 _nftId,
        uint256 _numTickets,
        uint256 _totalPrice
    ) public {
        // transfer the nft from the raffle creator to this contract
        _nftContract.safeTransferFrom(
            msg.sender,
            address(this),
            _nftId,
            abi.encode(_numTickets, _totalPrice)
        );
    }

    // complete raffle creation when receiving ERC721
    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes memory data
    ) public override returns (bytes4) {
        (uint256 _numTickets, uint256 _totalPrice) = abi.decode(
            data,
            (uint256, uint256)
        );

        // init tickets
        address[] memory _tickets;
        // create raffle
        Raffle memory _raffle = Raffle(
            tx.origin,
            msg.sender,
            _tokenId,
            _totalPrice,
            _numTickets,
            _tickets,
            RaffleStatus.ONGOING
        );
        // store raffle in state
        raffles.push(_raffle);

        // emit event
        emit RaffleCreated(raffles.length - 1, tx.origin);

        // return funciton singature to confirm safe transfer
        return
            bytes4(
                keccak256("onERC721Received(address,address,uint256,bytes)")
            );
    }

    // enters a user in the draw for a given raffle
    function enterRaffle(uint256 raffleId, uint256 tickets) public payable {
        require(
            uint256(raffles[raffleId].status) == uint256(RaffleStatus.ONGOING),
            "Raffle no longer active"
        );
        require(
            tickets.add(raffles[raffleId].tickets.length) <=
                raffles[raffleId].totalTickets,
            "Not enough tickets available"
        );
        require(tickets > 0, "Not enough tickets purchased");
        require(
            msg.value ==
                tickets.mul(
                    raffles[raffleId].totalPrice.div(
                        raffles[raffleId].totalTickets
                    )
                ),
            "Ticket price not paid"
        );

        // add tickets
        for (uint256 i = 0; i < tickets; i++) {
            raffles[raffleId].tickets.push(payable(msg.sender));
        }

        emit TicketsPurchased(raffleId, msg.sender, tickets);

        // award prizes if this was the last ticket purchased
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
