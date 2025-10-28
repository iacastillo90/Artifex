// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Importaciones de OpenZeppelin 5.x
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// ============================================================================
// CONTRATO 0: ArtifexRewardToken ($ARTX)
// ============================================================================

contract ArtifexRewardToken is ERC20, Ownable, Pausable {
    mapping(address => bool) public authorizedMinters;
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 Billón

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount);

    constructor(address initialOwner) ERC20("Artifex Token", "ARTX") Ownable(initialOwner) {
        _mint(initialOwner, 10_000_000 * 10**18); // 10 Millones iniciales
    }

    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid address");
        require(!authorizedMinters[minter], "Already authorized");
        authorizedMinters[minter] = true;
        emit MinterAdded(minter);
    }

    function removeMinter(address minter) external onlyOwner {
        require(authorizedMinters[minter], "Not authorized");
        authorizedMinters[minter] = false;
        emit MinterRemoved(minter);
    }

    function mintReward(address to, uint256 amount, string memory reason) external whenNotPaused {
        require(authorizedMinters[msg.sender], "Not authorized to mint");
        require(to != address(0), "Invalid address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) external {
        uint256 currentAllowance = allowance(account, msg.sender);
        require(currentAllowance >= amount, "Burn amount exceeds allowance");
        _approve(account, msg.sender, currentAllowance - amount);
        _burn(account, amount);
        emit TokensBurned(account, amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function _update(address from, address to, uint256 amount) internal override whenNotPaused {
        super._update(from, to, amount);
    }
}

// ============================================================================
// CONTRATO 1: ArtifexCreatorProfile (Compatible OZ 5.x + Rewards)
// ============================================================================

contract ArtifexCreatorProfile is ERC721, ERC721URIStorage, Ownable, Pausable {
    uint256 private _profileIdCounter;
    mapping(address => uint256) public profileIdOf;
    mapping(string => address) public creatorOf;

    ArtifexRewardToken public artxToken;
    uint256 public profileCreationReward = 100 * 10**18; // 100 $ARTX

    event ProfileCreated(uint256 indexed profileId, address indexed owner, string handle, string profileURI);
    event ProfileUpdated(uint256 indexed profileId, string newProfileURI);

    constructor(address initialOwner, address _artxToken)
        ERC721("Artifex Creator Profile", "ARTX-PROFILE")
        Ownable(initialOwner)
    {
        require(_artxToken != address(0), "Invalid ARTX token address");
        artxToken = ArtifexRewardToken(_artxToken);
    }

    function createProfile(string memory handle, string memory profileURI) external whenNotPaused {
        require(profileIdOf[msg.sender] == 0, "Address already has a profile");
        require(bytes(handle).length > 3, "Handle must be > 3 chars");
        require(creatorOf[handle] == address(0), "Handle is already taken");

        _profileIdCounter++;
        uint256 newProfileId = _profileIdCounter;

        profileIdOf[msg.sender] = newProfileId;
        creatorOf[handle] = msg.sender;

        _safeMint(msg.sender, newProfileId);
        _setTokenURI(newProfileId, profileURI);

        artxToken.mintReward(msg.sender, profileCreationReward, "Profile Creation");

        emit ProfileCreated(newProfileId, msg.sender, handle, profileURI);
    }

    function updateProfileURI(string memory newProfileURI) external {
        uint256 profileId = profileIdOf[msg.sender];
        require(profileId != 0, "No profile found");
        require(_ownerOf(profileId) == msg.sender, "Not profile owner");
        _setTokenURI(profileId, newProfileURI);
        emit ProfileUpdated(profileId, newProfileURI);
    }

    function setProfileCreationReward(uint256 newReward) external onlyOwner {
        profileCreationReward = newReward;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://";
    }

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        _requireOwned(tokenId);
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function _update(address to, uint256 tokenId, address auth)
        internal override(ERC721) whenNotPaused returns (address)
    {
        return super._update(to, tokenId, auth);
    }
}

// ============================================================================
// CONTRATO 2: ArtifexContent (Compatible OZ 5.x + Rewards + Pago Directo)
// ============================================================================

contract ArtifexContent is ERC721, Ownable, Pausable, ReentrancyGuard {
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

    uint256 private _tokenIdCounter;
    mapping(uint256 => Content) public contents;
    mapping(address => uint256[]) public creatorContents;
    mapping(uint256 => mapping(address => bool)) public hasAccess;

    address public subscriptionContract;
    address public treasuryContract;

    IERC20 public usdc;
    ArtifexRewardToken public artxToken;

    uint256 public constant PROTOCOL_FEE_BPS = 100; // 1%
    uint256 public contentCreationReward = 50 * 10**18; // 50 $ARTX
    uint256 public purchaseRewardPercentage = 10; // 10%

    event ContentPublished(uint256 indexed tokenId, address indexed creator, string ipfsHash, ContentType contentType, AccessType accessType);
    event ContentPurchased(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event ContentDeactivated(uint256 indexed tokenId);

    constructor(address _usdc, address _artxToken, address initialOwner)
        ERC721("Artifex Content", "ARTC")
        Ownable(initialOwner)
    {
        require(_usdc != address(0), "Invalid USDC address");
        require(_artxToken != address(0), "Invalid ARTX token address");
        usdc = IERC20(_usdc);
        artxToken = ArtifexRewardToken(_artxToken);
    }

    function publishContent(
        string memory ipfsHash, ContentType contentType, AccessType accessType, uint256 price
    ) external whenNotPaused returns (uint256) {
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        if (accessType == AccessType.PAY_PER_VIEW) {
            require(price > 0, "Price must be > 0 for pay-per-view");
        }

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(msg.sender, tokenId);

        contents[tokenId] = Content({
            creator: msg.sender, ipfsHash: ipfsHash, contentType: contentType,
            accessType: accessType, price: price, publishedAt: block.timestamp, isActive: true
        });
        creatorContents[msg.sender].push(tokenId);

        artxToken.mintReward(msg.sender, contentCreationReward, "Content Published");

        emit ContentPublished(tokenId, msg.sender, ipfsHash, contentType, accessType);
        return tokenId;
    }

    function purchaseContent(uint256 tokenId) external nonReentrant whenNotPaused {
        Content memory content = contents[tokenId];
        require(content.isActive, "Content not active");
        require(content.accessType == AccessType.PAY_PER_VIEW, "Not pay-per-view");
        require(!hasAccess[tokenId][msg.sender], "Already have access");
        require(treasuryContract != address(0), "Treasury not set");

        uint256 price = content.price;
        uint256 protocolFee = (price * PROTOCOL_FEE_BPS) / 10000;
        uint256 creatorAmount = price - protocolFee;

        require(usdc.transferFrom(msg.sender, content.creator, creatorAmount), "Creator payment failed");
        require(usdc.transferFrom(msg.sender, treasuryContract, protocolFee), "Protocol fee failed");

        hasAccess[tokenId][msg.sender] = true;

        uint256 rewardAmount = (price * purchaseRewardPercentage * (10**18)) / (100 * (10**6));
        artxToken.mintReward(msg.sender, rewardAmount, "Content Purchase");

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
            require(subscriptionContract != address(0), "Subscription contract not set");
            return IArtifexSubscriptions(subscriptionContract).isSubscribed(content.creator, user);
        }
        return false;
    }

    function deactivateContent(uint256 tokenId) external {
        require(_ownerOf(tokenId) == msg.sender, "Not the creator");
        contents[tokenId].isActive = false;
        emit ContentDeactivated(tokenId);
    }

    function getCreatorContents(address creator) external view returns (uint256[] memory) {
        return creatorContents[creator];
    }

    function setRewards(uint256 _creationReward, uint256 _purchasePercentage) external onlyOwner {
        contentCreationReward = _creationReward;
        purchaseRewardPercentage = _purchasePercentage;
    }
    function setSubscriptionContract(address _subscription) external onlyOwner {
        require(_subscription != address(0), "Invalid address");
        subscriptionContract = _subscription;
    }
    function setTreasuryContract(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasuryContract = _treasury;
    }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal override(ERC721) whenNotPaused returns (address)
    {
        return super._update(to, tokenId, auth);
    }
}

// ============================================================================
// CONTRATO 3: ArtifexSubscriptions (Compatible OZ 5.x + Rewards + Pago Directo)
// ============================================================================

contract ArtifexSubscriptions is ERC1155, Ownable, Pausable, ReentrancyGuard {
    struct Subscription {
        address creator; address subscriber; uint256 expiresAt;
        uint256 monthlyPrice; bool autoRenew;
    }
    struct CreatorProfile {
        uint256 monthlyPrice; uint256 subscriberCount; bool isActive;
    }

    mapping(address => CreatorProfile) public creators;
    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => mapping(address => uint256)) public userSubscriptionTokenId;

    uint256 private _subscriptionTokenIdCounter;
    uint256 public constant PROTOCOL_FEE_BPS = 100; // 1%

    address public treasuryContract;
    IERC20 public usdc;
    ArtifexRewardToken public artxToken;

    uint256 public subscriptionRewardPerMonth = 20 * 10**18; // 20 $ARTX

    event CreatorRegistered(address indexed creator, uint256 monthlyPrice);
    event Subscribed(uint256 indexed tokenId, address indexed creator, address indexed subscriber, uint256 expiresAt, uint256 pricePaid);
    event SubscriptionRenewed(uint256 indexed tokenId, uint256 newExpiresAt, uint256 pricePaid);
    event SubscriptionCancelled(uint256 indexed tokenId);
    event PriceUpdated(address indexed creator, uint256 newPrice);

    constructor(address _usdc, address _artxToken, address initialOwner)
        ERC1155("https://api.artifex.io/subscription/{id}.json")
        Ownable(initialOwner)
    {
        require(_usdc != address(0), "Invalid USDC address");
        require(_artxToken != address(0), "Invalid ARTX token address");
        usdc = IERC20(_usdc);
        artxToken = ArtifexRewardToken(_artxToken);
    }

    function registerCreator(uint256 monthlyPrice) external {
        require(monthlyPrice > 0, "Price must be > 0");
        require(!creators[msg.sender].isActive, "Already registered");
        creators[msg.sender] = CreatorProfile({
            monthlyPrice: monthlyPrice, subscriberCount: 0, isActive: true
        });
        emit CreatorRegistered(msg.sender, monthlyPrice);
    }

    function subscribe(address creator, uint256 months) external nonReentrant whenNotPaused {
        require(creators[creator].isActive, "Creator not registered");
        require(months > 0 && months <= 12, "Months must be 1-12");
        require(treasuryContract != address(0), "Treasury not set");

        uint256 existingTokenId = userSubscriptionTokenId[creator][msg.sender];
        bool isRenewal = false;
        if (existingTokenId != 0) {
            require(subscriptions[existingTokenId].expiresAt < block.timestamp, "Already actively subscribed, use renew");
            isRenewal = true;
        }

        uint256 currentPrice = creators[creator].monthlyPrice;
        uint256 totalPrice = currentPrice * months;
        uint256 protocolFee = (totalPrice * PROTOCOL_FEE_BPS) / 10000;
        uint256 creatorAmount = totalPrice - protocolFee;

        require(usdc.transferFrom(msg.sender, creator, creatorAmount), "Creator payment failed");
        require(usdc.transferFrom(msg.sender, treasuryContract, protocolFee), "Protocol fee failed");

        uint256 expiresAt = block.timestamp + (30 days * months);
        uint256 tokenIdToUse;

        if (isRenewal) {
            tokenIdToUse = existingTokenId;
            subscriptions[tokenIdToUse].expiresAt = expiresAt;
            subscriptions[tokenIdToUse].monthlyPrice = currentPrice;
            emit Subscribed(tokenIdToUse, creator, msg.sender, expiresAt, totalPrice);
        } else {
            _subscriptionTokenIdCounter++;
            tokenIdToUse = _subscriptionTokenIdCounter;
            _mint(msg.sender, tokenIdToUse, 1, "");
            subscriptions[tokenIdToUse] = Subscription({
                creator: creator, subscriber: msg.sender, expiresAt: expiresAt,
                monthlyPrice: currentPrice, autoRenew: false
            });
            userSubscriptionTokenId[creator][msg.sender] = tokenIdToUse;
            creators[creator].subscriberCount++;
            emit Subscribed(tokenIdToUse, creator, msg.sender, expiresAt, totalPrice);
        }

        uint256 rewardAmount = subscriptionRewardPerMonth * months;
        artxToken.mintReward(msg.sender, rewardAmount, "Subscription");
    }

    function renewSubscription(uint256 tokenId, uint256 months) external nonReentrant whenNotPaused {
        Subscription storage sub = subscriptions[tokenId];
        require(sub.subscriber == msg.sender, "Not your subscription");
        require(sub.expiresAt > block.timestamp, "Subscription lapsed, use subscribe()");
        require(months > 0 && months <= 12, "Months must be 1-12");
        require(treasuryContract != address(0), "Treasury not set");

        uint256 priceToUse = sub.monthlyPrice;
        uint256 totalPrice = priceToUse * months;
        uint256 protocolFee = (totalPrice * PROTOCOL_FEE_BPS) / 10000;
        uint256 creatorAmount = totalPrice - protocolFee;

        require(usdc.transferFrom(msg.sender, sub.creator, creatorAmount), "Creator payment failed");
        require(usdc.transferFrom(msg.sender, treasuryContract, protocolFee), "Protocol fee failed");

        sub.expiresAt = sub.expiresAt + (30 days * months);

        uint256 rewardAmount = subscriptionRewardPerMonth * months;
        artxToken.mintReward(msg.sender, rewardAmount, "Subscription Renewal");

        emit SubscriptionRenewed(tokenId, sub.expiresAt, totalPrice);
    }

    function cancelSubscription(uint256 tokenId) external {
        Subscription storage sub = subscriptions[tokenId];
        require(sub.subscriber == msg.sender, "Not your subscription");
        require(sub.expiresAt > block.timestamp, "Subscription already expired");
        sub.autoRenew = false;
        emit SubscriptionCancelled(tokenId);
    }

    function isSubscribed(address creator, address user) external view returns (bool) {
        uint256 tokenId = userSubscriptionTokenId[creator][user];
        if (tokenId == 0) return false;
        return subscriptions[tokenId].expiresAt > block.timestamp;
    }

    function getSubscriptionInfo(address creator, address user)
        external view returns (bool isActive, uint256 expiresAt, uint256 tokenId)
    {
        tokenId = userSubscriptionTokenId[creator][user];
        if (tokenId == 0) return (false, 0, 0);
        Subscription memory sub = subscriptions[tokenId];
        isActive = sub.expiresAt > block.timestamp;
        expiresAt = sub.expiresAt;
    }

    function updatePrice(uint256 newPrice) external {
        require(creators[msg.sender].isActive, "Not a registered creator");
        require(newPrice > 0, "Price must be > 0");
        creators[msg.sender].monthlyPrice = newPrice;
        emit PriceUpdated(msg.sender, newPrice);
    }

    function setSubscriptionReward(uint256 newReward) external onlyOwner {
        subscriptionRewardPercentage = newReward;
    }
    function setTreasuryContract(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasuryContract = _treasury;
    }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC1155) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal override(ERC1155) whenNotPaused
    {
        super._update(from, to, ids, values);
    }
}

// ============================================================================
// CONTRATO 4: ArtifexTipping (Compatible OZ 5.x + Rewards + Pago Directo)
// ============================================================================

contract ArtifexTipping is Ownable, ReentrancyGuard, Pausable {
    IERC20 public usdc;
    ArtifexRewardToken public artxToken;
    address public treasuryContract;

    uint256 public constant PROTOCOL_FEE_BPS = 100; // 1%
    uint256 public tippingRewardPercentage = 5; // 5%

    event TipSent(address indexed from, address indexed toCreator, uint256 totalAmount, uint256 creatorAmount, uint256 feeAmount, string message);

    constructor(address _usdc, address _artxToken, address initialOwner)
        Ownable(initialOwner)
    {
        require(_usdc != address(0), "Invalid USDC address");
        require(_artxToken != address(0), "Invalid ARTX token address");
        usdc = IERC20(_usdc);
        artxToken = ArtifexRewardToken(_artxToken);
    }

    function sendTip(
        address creator, uint256 amount, string memory message
    ) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(creator != address(0) && creator != msg.sender, "Invalid creator or self-tip");
        require(treasuryContract != address(0), "Treasury not set");

        uint256 protocolFee = (amount * PROTOCOL_FEE_BPS) / 10000;
        uint256 creatorAmount = amount - protocolFee;
        require(creatorAmount > 0, "Amount too small after fee");

        require(usdc.transferFrom(msg.sender, creator, creatorAmount), "Creator payment failed");
        require(usdc.transferFrom(msg.sender, treasuryContract, protocolFee), "Protocol fee failed");

        uint256 rewardAmount = (amount * tippingRewardPercentage * (10**18)) / (100 * (10**6));
        artxToken.mintReward(msg.sender, rewardAmount, "Tip Sent");

        emit TipSent(msg.sender, creator, amount, creatorAmount, protocolFee, message);
    }

    function setTippingReward(uint256 newPercentage) external onlyOwner {
        require(newPercentage <= 20, "Max 20%");
        tippingRewardPercentage = newPercentage;
    }
    function setTreasuryContract(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasuryContract = _treasury;
    }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}

// ============================================================================
// CONTRATO 5: ArtifexTreasury
// ============================================================================

contract ArtifexTreasury is Ownable, Pausable {
    IERC20 public usdc;
    event ProtocolWithdrawal(address indexed to, uint256 amount);

    constructor(address _usdc, address initialOwner) Ownable(initialOwner) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    function withdrawProtocolFees(address to, uint256 amount) external onlyOwner whenNotPaused {
        require(to != address(0), "Invalid recipient");
        uint256 balance = usdc.balanceOf(address(this));
        require(amount > 0 && amount <= balance, "Invalid amount or insufficient balance");
        bool success = usdc.transfer(to, amount);
        require(success, "Transfer failed");
        emit ProtocolWithdrawal(to, amount);
    }

    function withdrawAllProtocolFees(address to) external onlyOwner whenNotPaused {
        require(to != address(0), "Invalid recipient");
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");
        bool success = usdc.transfer(to, balance);
        require(success, "Transfer failed");
        emit ProtocolWithdrawal(to, balance);
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
