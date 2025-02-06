// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./CoverLib.sol";

interface IbqBTC {
    function bqMint(address account, uint256 amount) external;
    function burn(address account, uint256 amount) external;
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

interface IVault {
    struct Vault {
        uint256 id;
        string vaultName;
        CoverLib.RiskType risk;
        CoverLib.Pool[] pools;
        uint256 amount;
        uint256 apy;
        uint256 minInv;
        uint256 maxInv;
        uint256 minPeriod;
        CoverLib.AssetDepositType assetType;
        address asset;
    }

    function getUserVaultPoolDeposits(
        uint256 vaultId,
        address user
    ) external view returns (CoverLib.Deposits[] memory);

    function getVault(uint256 vaultId) external view returns (Vault memory);
}

interface ILP {
    enum Status {
        Active,
        Expired
    }

    enum AssetDepositType {
        Native,
        ERC20
    }

    function getUserPoolDeposit(
        uint256 _poolId,
        address _user
    ) external view returns (CoverLib.Deposits memory);

    function getPool(
        uint256 _poolId
    )
        external
        view
        returns (CoverLib.Pool memory);

    function reducePercentageSplit(
        uint256 _poolId,
        uint256 __poolPercentageSplit
    ) external;
    function increasePercentageSplit(
        uint256 _poolId,
        uint256 __poolPercentageSplit
    ) external;
    function addPoolCover(
        uint256 _poolId,
        CoverLib.Cover memory _cover
    ) external;
    function updatePoolCovers(
        uint256 _poolId,
        CoverLib.Cover memory _cover
    ) external;
    function getPoolCovers(
        uint256 _poolId
    ) external view returns (CoverLib.Cover[] memory);
}

contract InsuranceCover is ReentrancyGuard, Ownable {
    using CoverLib for *;
    using Math for uint256;

    error LpNotActive();
    error InsufficientPoolBalance();
    error NoClaimableReward();
    error InvalidCoverDuration();
    error CoverNotAvailable();
    error UserHaveAlreadyPurchasedCover();
    error NameAlreadyExists();
    error InvalidAmount();
    error UnsupportedCoverType();
    error WrongPool();

    uint public coverFeeBalance;
    ILP public lpContract;
    IbqBTC public bqBTC;
    IVault public vaultContract;
    address public bqBTCAddress;
    address public lpAddress;
    address public governance;
    address public vaultAddress;
    address[] public participants;
    mapping(address => uint256) public participation;

    mapping(uint256 => bool) public coverExists;
    mapping(address => mapping(uint256 => uint256)) public NextLpClaimTime;
    mapping(address => mapping(uint256 => uint256)) public LastVaultClaimTime;

    mapping(address => mapping(uint256 => CoverLib.GenericCoverInfo))
        public userCovers;
    mapping(uint256 => CoverLib.Cover) public covers;

    uint256 public coverCount;
    uint256[] public coverIds;

    event CoverCreated(
        uint256 indexed coverId,
        string name,
        CoverLib.RiskType riskType
    );
    event CoverPurchased(
        address indexed user,
        uint256 coverValue,
        uint256 coverFee,
        CoverLib.RiskType riskType
    );
    event PayoutClaimed(
        address indexed user,
        uint256 indexed poolId,
        uint256 amount
    );
    event CoverUpdated(
        uint256 indexed coverId,
        string coverName,
        CoverLib.RiskType riskType
    );

    constructor(
        address _lpContract,
        address _vaultContract,
        address _initialOwner,
        address _bqBTC,
        address _gov
    ) Ownable(_initialOwner) {
        lpContract = ILP(_lpContract);
        vaultContract = IVault(_vaultContract);
        vaultAddress = _vaultContract;
        lpAddress = _lpContract;
        bqBTC = IbqBTC(_bqBTC);
        bqBTCAddress = _bqBTC;
        governance = _gov;
    }

    function createCover(
        uint256 coverId,
        string memory _cid,
        CoverLib.RiskType _riskType,
        string memory _coverName,
        string memory _chains,
        uint256 _capacity,
        uint256 _poolId
    ) public onlyOwner {
        (uint256 _maxAmount, address _asset, CoverLib.AssetDepositType _adt) = _validateAndGetPoolInfo(
            _coverName,
            _poolId,
            _riskType,
            _capacity
        );

        lpContract.reducePercentageSplit(_poolId, _capacity);

        coverCount++;
        CoverLib.Cover memory cover = CoverLib.Cover({
            id: coverId,
            coverName: _coverName,
            riskType: _riskType,
            chains: _chains,
            capacity: _capacity,
            capacityAmount: _maxAmount,
            coverValues: 0,
            maxAmount: _maxAmount,
            poolId: _poolId,
            CID: _cid,
            adt: _adt,
            asset: _asset
        });
        covers[coverId] = cover;
        coverIds.push(coverId);
        lpContract.addPoolCover(_poolId, cover);
        coverExists[coverId] = true;

        emit CoverCreated(coverId, _coverName, _riskType);
    }

    function _validateAndGetPoolInfo(
        string memory _coverName,
        uint256 poolId,
        CoverLib.RiskType riskType,
        uint256 capacity
    ) internal view returns (uint256, address, CoverLib.AssetDepositType) {
        CoverLib.Cover[] memory coversInPool = lpContract.getPoolCovers(poolId);
        for (uint256 i = 0; i < coversInPool.length; i++) {
            if (
                keccak256(abi.encodePacked(coversInPool[i].coverName)) ==
                keccak256(abi.encodePacked(_coverName))
            ) {
                revert NameAlreadyExists();
            }
        }
        CoverLib.Pool memory pool = lpContract.getPool(poolId);

        if (pool.riskType != riskType || capacity > pool.percentageSplitBalance) {
            revert WrongPool();
        }

        uint256 maxAmount = (pool.totalUnit * capacity) / 100;
        return (maxAmount, pool.asset, pool.assetType);
    }
}