// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EIP3009USDC
 * @notice ERC-20 token with EIP-3009 support for x402 protocol
 * @dev Implements transferWithAuthorization for gasless payments
 */
contract EIP3009USDC is ERC20, Ownable {
    // EIP-712 Domain Separator
    bytes32 public DOMAIN_SEPARATOR;
    
    // EIP-3009 TransferWithAuthorization typehash
    bytes32 public constant TRANSFER_WITH_AUTHORIZATION_TYPEHASH = 
        keccak256(
            "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
        );
    
    // Track authorization states
    mapping(address => mapping(bytes32 => bool)) public authorizationState;
    
    // Events
    event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce);
    event AuthorizationCanceled(address indexed authorizer, bytes32 indexed nonce);
    
    /**
     * @notice Constructor
     * @param name Token name
     * @param symbol Token symbol
     * @param decimals_ Token decimals
     * @param initialSupply Initial supply (will be multiplied by 10^decimals)
     */
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        // Calculate EIP-712 domain separator
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name)),
                keccak256(bytes("2")),
                block.chainid,
                address(this)
            )
        );
        
        // Mint initial supply
        _mint(msg.sender, initialSupply * 10 ** decimals_);
    }
    
    /**
     * @notice Returns 6 decimals (USDC standard)
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    /**
     * @notice Execute transfer with signed authorization
     * @param from Payer's address
     * @param to Payee's address
     * @param value Amount to transfer
     * @param validAfter Authorization valid after this timestamp
     * @param validBefore Authorization valid before this timestamp
     * @param nonce Unique nonce
     * @param v v component of signature
     * @param r r component of signature
     * @param s s component of signature
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(block.timestamp > validAfter, "Authorization not yet valid");
        require(block.timestamp < validBefore, "Authorization expired");
        require(!authorizationState[from][nonce], "Authorization already used");
        
        // Construct digest
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        TRANSFER_WITH_AUTHORIZATION_TYPEHASH,
                        from,
                        to,
                        value,
                        validAfter,
                        validBefore,
                        nonce
                    )
                )
            )
        );
        
        // Verify signature
        address recoveredAddress = ecrecover(digest, v, r, s);
        require(recoveredAddress != address(0), "Invalid signature");
        require(recoveredAddress == from, "Invalid signer");
        
        // Mark nonce as used
        authorizationState[from][nonce] = true;
        
        // Execute transfer
        _transfer(from, to, value);
        
        emit AuthorizationUsed(from, nonce);
    }
    
    /**
     * @notice Cancel an authorization
     * @param authorizer Authorizer's address
     * @param nonce Nonce to cancel
     * @param v v component of signature
     * @param r r component of signature
     * @param s s component of signature
     */
    function cancelAuthorization(
        address authorizer,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(!authorizationState[authorizer][nonce], "Authorization already used");
        
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        keccak256("CancelAuthorization(address authorizer,bytes32 nonce)"),
                        authorizer,
                        nonce
                    )
                )
            )
        );
        
        address recoveredAddress = ecrecover(digest, v, r, s);
        require(recoveredAddress == authorizer, "Invalid signature");
        
        authorizationState[authorizer][nonce] = true;
        emit AuthorizationCanceled(authorizer, nonce);
    }
    
    /**
     * @notice Mint new tokens (only owner)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @notice Burn tokens (only owner)
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external onlyOwner {
        _burn(msg.sender, amount);
    }
}


