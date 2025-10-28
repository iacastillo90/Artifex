// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// ============================================================================
// CONTRATO 1: ArtifexCreatorProfile
// La capa de Identidad y Social Graph (ERC-721)
// ============================================================================

/**
 * @title ArtifexCreatorProfile
 * @dev Gestiona perfiles de creador como NFTs (ERC-721).
 */
contract ArtifexCreatorProfile is ERC721, ERC721URIStorage, Ownable, Pausable {
    using Counters for Counters.Counter;
    Counters.Counter private _profileIdCounter;

    mapping(address => uint256) public profileIdOf;
    mapping(string => address) public creatorOf;

    event ProfileCreated(uint256 indexed profileId, address indexed owner, string handle, string profileURI);
    event ProfileUpdated(uint256 indexed profileId, string newProfileURI);

    /**
     * @dev CORRECCIÓN: Se añade initialOwner al constructor para Ownable (OpenZeppelin 5.x).
     */
    constructor(address initialOwner)
        ERC721("Artifex Creator Profile", "ARTX-PROFILE")
        Ownable(initialOwner)
    {}

    function createProfile(string memory handle, string memory profileURI) external whenNotPaused {
        require(profileIdOf[msg.sender] == 0, "Address already has a profile");
        require(bytes(handle).length > 3, "Handle must be > 3 chars");
        require(creatorOf[handle] == address(0), "Handle is already taken");

        _profileIdCounter.increment();
        uint256 newProfileId = _profileIdCounter.current();

        profileIdOf[msg.sender] = newProfileId;
        creatorOf[handle] = msg.sender;

        _safeMint(msg.sender, newProfileId);
        _setTokenURI(newProfileId, profileURI);

        emit ProfileCreated(newProfileId, msg.sender, handle, profileURI);
    }

    function updateProfileURI(string memory newProfileURI) external {
        uint256 profileId = profileIdOf[msg.sender];
        require(profileId != 0, "No profile found");
        require(ownerOf(profileId) == msg.sender, "Not profile owner");

        _setTokenURI(profileId, newProfileURI);
        emit ProfileUpdated(profileId, newProfileURI);
    }

    // --- Overrides Requeridos ---

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://";
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}


// ============================================================================
// CONTRATO 2: ArtifexContent
// Gestiona el contenido como NFTs (ERC-721)
// ============================================================================
contract ArtifexContent is ERC721, Ownable, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;

    struct Content {
        address creator;
        string ipfsHash;
        ContentType contentType;
        AccessType accessType;
        uint256 price;
        uint256 publishedAt;
        bool isActive;
    }

    enum ContentType { VIDEO, GALLERY, ARTICLE, AUDIO }
    enum AccessType { PUBLIC, SUBSCRIBERS_ONLY, PAY_PER_VIEW }

    Counters.Counter private _tokenIdCounter;
    mapping(uint256 => Content) public contents;
    mapping(address => uint256[]) public creatorContents;
    mapping(uint256 => mapping(address => bool)) public hasAccess;

    address public subscriptionContract;
    address public treasuryContract;

    IERC20 public usdc;

    event ContentPublished(uint256 indexed tokenId, address indexed creator, string ipfsHash, ContentType contentType, AccessType accessType);
    event ContentPurchased(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event ContentDeactivated(uint256 indexed tokenId);

    /**
     * @dev CORRECCIÓN: Se añade initialOwner al constructor para Ownable (OpenZeppelin 5.x).
     */
    constructor(address _usdc, address initialOwner)
        ERC721("Artifex Content", "ARTC")
        Ownable(initialOwner)
    {
        usdc = IERC20(_usdc);
    }

    function publishContent(
        string memory ipfsHash,
        ContentType contentType,
        AccessType accessType,
        uint256 price
    ) external whenNotPaused returns (uint256) {
        require(bytes(ipfsHash).length > 0, "IPFS hash required");

        if (accessType == AccessType.PAY_PER_VIEW) {
            require(price > 0, "Price must be > 0 for pay-per-view");
        }

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(msg.sender, tokenId);

        contents[tokenId] = Content({
            creator: msg.sender,
            ipfsHash: ipfsHash,
            contentType: contentType,
            accessType: accessType,
            price: price,
            publishedAt: block.timestamp,
            isActive: true
        });

        creatorContents[msg.sender].push(tokenId);

        emit ContentPublished(tokenId, msg.sender, ipfsHash, contentType, accessType);

        return tokenId;
    }

    function purchaseContent(uint256 tokenId) external nonReentrant whenNotPaused {
        Content memory content = contents[tokenId];

        require(content.isActive, "Content not active");
        require(content.accessType == AccessType.PAY_PER_VIEW, "Not pay-per-view content");
        require(!hasAccess[tokenId][msg.sender], "Already have access");

        uint256 price = content.price;
        uint256 protocolFee = (price * 100) / 10000;
        uint256 creatorAmount = price - protocolFee;

        require(
            usdc.transferFrom(msg.sender, content.creator, creatorAmount),
            "Creator payment failed"
        );
        require(
            usdc.transferFrom(msg.sender, treasuryContract, protocolFee),
            "Protocol fee payment failed"
        );

        hasAccess[tokenId][msg.sender] = true;

        emit ContentPurchased(tokenId, msg.sender, price);
    }

    function canAccess(uint256 tokenId, address user) external view returns (bool) {
        Content memory content = contents[tokenId];
        if (!content.isActive) return false;
        if (content.accessType == AccessType.PUBLIC) return true;
        if (content.accessType == AccessType.PAY_PER_VIEW) {
            return hasAccess[tokenId][user];
        }
        if (content.accessType == AccessType.SUBSCRIBERS_ONLY) {
            return IArtifexSubscriptions(subscriptionContract).isSubscribed(content.creator, user);
        }
        return false;
    }

    function deactivateContent(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not the creator");
        contents[tokenId].isActive = false;
        emit ContentDeactivated(tokenId);
    }

    function getCreatorContents(address creator) external view returns (uint256[] memory) {
        return creatorContents[creator];
    }

    // ============ ADMIN FUNCTIONS ============

    function setSubscriptionContract(address _subscription) external onlyOwner {
        subscriptionContract = _subscription;
    }
    function setTreasuryContract(address _treasury) external onlyOwner {
        treasuryContract = _treasury;
    }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}

// ============================================================================
// CONTRATO 3: ArtifexSubscriptions
// Gestiona suscripciones (ERC-1155)
// ============================================================================
contract ArtifexSubscriptions is ERC1155, Ownable, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;

    struct Subscription {
        address creator;
        address subscriber;
        uint256 expiresAt;
        uint256 monthlyPrice;
        bool autoRenew;
    }

    struct CreatorProfile {
        uint256 monthlyPrice;
        uint256 subscriberCount;
        bool isActive;
    }

    mapping(address => CreatorProfile) public creators;
    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => mapping(address => uint256)) public userSubscription;

    Counters.Counter private _tokenIdCounter;
    uint256 public constant PROTOCOL_FEE_BPS = 100;

    address public treasuryContract;
    IERC20 public usdc;

    event CreatorRegistered(address indexed creator, uint256 monthlyPrice);
    event Subscribed(uint256 indexed tokenId, address indexed creator, address indexed subscriber, uint256 expiresAt, uint256 price);
    event SubscriptionRenewed(uint256 indexed tokenId, uint256 newExpiresAt);
    event SubscriptionCancelled(uint256 indexed tokenId);
    event PriceUpdated(address indexed creator, uint256 newPrice);

    /**
     * @dev CORRECCIÓN: Se añade initialOwner al constructor para Ownable (OpenZeppelin 5.x).
     */
    constructor(address _usdc, address initialOwner)
        ERC1155("https://api.artifex.io/subscription/{id}.json")
        Ownable(initialOwner)
    {
        usdc = IERC20(_usdc);
    }

    function registerCreator(uint256 monthlyPrice) external {
        require(monthlyPrice > 0, "Price must be > 0");
        require(!creators[msg.sender].isActive, "Already registered");

        creators[msg.sender] = CreatorProfile({
            monthlyPrice: monthlyPrice,
            subscriberCount: 0,
            isActive: true
        });

        emit CreatorRegistered(msg.sender, monthlyPrice);
    }

    function subscribe(address creator, uint256 months) external nonReentrant whenNotPaused {
        require(creators[creator].isActive, "Creator not registered");
        require(months > 0 && months <= 12, "Months must be 1-12");

        uint256 price = creators[creator].monthlyPrice * months;
        uint256 protocolFee = (price * PROTOCOL_FEE_BPS) / 10000;
        uint256 creatorAmount = price - protocolFee;

        require(
            usdc.transferFrom(msg.sender, creator, creatorAmount),
            "Creator payment failed"
        );
        require(
            usdc.transferFrom(msg.sender, treasuryContract, protocolFee),
            "Protocol fee failed"
        );

        uint256 existingTokenId = userSubscription[creator][msg.sender];
        uint256 expiresAt = block.timestamp + (30 days * months);

        if (existingTokenId != 0) {
            Subscription storage sub = subscriptions[existingTokenId];
            require(sub.expiresAt < block.timestamp, "Already subscribed");

            sub.expiresAt = expiresAt;
            emit SubscriptionRenewed(existingTokenId, expiresAt);

        } else {
            _tokenIdCounter.increment();
            uint256 tokenId = _tokenIdCounter.current();

            _mint(msg.sender, tokenId, 1, "");

            subscriptions[tokenId] = Subscription({
                creator: creator,
                subscriber: msg.sender,
                expiresAt: expiresAt,
                monthlyPrice: creators[creator].monthlyPrice,
                autoRenew: false
            });

            userSubscription[creator][msg.sender] = tokenId;
            creators[creator].subscriberCount++;

            emit Subscribed(tokenId, creator, msg.sender, expiresAt, price);
        }
    }

    function renewSubscription(uint256 tokenId, uint256 months) external nonReentrant {
        Subscription storage sub = subscriptions[tokenId];
        require(sub.subscriber == msg.sender, "Not your subscription");
        require(sub.expiresAt > block.timestamp, "Subscription lapsed, use subscribe()");
        require(months > 0 && months <= 12, "Months must be 1-12");

        uint256 price = sub.monthlyPrice * months;
        uint256 protocolFee = (price * PROTOCOL_FEE_BPS) / 10000;
        uint256 creatorAmount = price - protocolFee;

        require(
            usdc.transferFrom(msg.sender, sub.creator, creatorAmount),
            "Creator payment failed"
        );
        require(
            usdc.transferFrom(msg.sender, treasuryContract, protocolFee),
            "Protocol fee failed"
        );

        sub.expiresAt = sub.expiresAt + (30 days * months);

        emit SubscriptionRenewed(tokenId, sub.expiresAt);
    }

    function cancelSubscription(uint256 tokenId) external {
        Subscription storage sub = subscriptions[tokenId];
        require(sub.subscriber == msg.sender, "Not your subscription");
        sub.autoRenew = false;
        emit SubscriptionCancelled(tokenId);
    }

    function isSubscribed(address creator, address user) external view returns (bool) {
        uint256 tokenId = userSubscription[creator][user];
        if (tokenId == 0) return false;
        return subscriptions[tokenId].expiresAt > block.timestamp;
    }

    function getSubscriptionInfo(address creator, address user)
        external
        view
        returns (bool isActive, uint256 expiresAt, uint256 tokenId)
    {
        tokenId = userSubscription[creator][user];
        if (tokenId == 0) return (false, 0, 0);

        Subscription memory sub = subscriptions[tokenId];
        isActive = sub.expiresAt > block.timestamp;
        expiresAt = sub.expiresAt;
    }

    function updatePrice(uint256 newPrice) external {
        require(creators[msg.sender].isActive, "Not registered");
        require(newPrice > 0, "Price must be > 0");
        creators[msg.sender].monthlyPrice = newPrice;
        emit PriceUpdated(msg.sender, newPrice);
    }

    // ============ ADMIN FUNCTIONS ============

    function setTreasuryContract(address _treasury) external onlyOwner {
        treasuryContract = _treasury;
    }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}

// ============================================================================
// CONTRATO 4: ArtifexTreasury
// Tesorería de protocolo P2P (solo recibe fees)
// ============================================================================
contract ArtifexTreasury is Ownable, Pausable {

    IERC20 public usdc;

    event ProtocolWithdrawal(address indexed to, uint256 amount);

    /**
     * @dev CORRECCIÓN: Se añade initialOwner al constructor para Ownable (OpenZeppelin 5.x).
     */
    constructor(address _usdc, address initialOwner)
        Ownable(initialOwner)
    {
        usdc = IERC20(_usdc);
    }

    function withdrawProtocolFees(address to, uint256 amount) external onlyOwner whenNotPaused {
        uint256 balance = usdc.balanceOf(address(this));
        require(amount <= balance, "Insufficient balance");

        require(usdc.transfer(to, amount), "Transfer failed");

        emit ProtocolWithdrawal(to, amount);
    }

    function withdrawAllProtocolFees(address to) external onlyOwner whenNotPaused {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");

        require(usdc.transfer(to, balance), "Transfer failed");

        emit ProtocolWithdrawal(to, balance);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}

// ============================================================================
// CONTRATO 5: ArtifexTipping
// Contrato simple de propinas P2P
// ============================================================================
contract ArtifexTipping is Ownable, ReentrancyGuard, Pausable {

    IERC20 public usdc;
    address public treasuryContract;

    uint256 public constant PROTOCOL_FEE_BPS = 100;

    event TipSent(address indexed from, address indexed to, uint256 amount, string message);

    /**
     * @dev CORRECCIÓN: Se añade initialOwner al constructor para Ownable (OpenZeppelin 5.x).
     */
    constructor(address _usdc, address initialOwner)
        Ownable(initialOwner)
    {
        usdc = IERC20(_usdc);
    }

    function sendTip(
        address creator,
        uint256 amount,
        string memory message
    ) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(creator != address(0), "Invalid creator");

        uint256 protocolFee = (amount * PROTOCOL_FEE_BPS) / 10000;
        uint256 creatorAmount = amount - protocolFee;

        require(
            usdc.transferFrom(msg.sender, creator, creatorAmount),
            "Creator payment failed"
        );
        require(
            usdc.transferFrom(msg.sender, treasuryContract, protocolFee),
            "Protocol fee failed"
        );

        emit TipSent(msg.sender, creator, amount, message);
    }

    function setTreasuryContract(address _treasury) external onlyOwner {
        treasuryContract = _treasury;
    }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}

// ============================================================================
// INTERFAZ
// ============================================================================

interface IArtifexSubscriptions {
    function isSubscribed(address creator, address user) external view returns (bool);
}
