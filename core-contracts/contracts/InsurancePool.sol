// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./CoverLib.sol";

interface IERC20Extended is IERC20 {
    function decimals() external view returns (uint8);
}

interface ICover {
    function updateMaxAmount(uint256 _coverId) external;
    function getDepositClaimableDays(address user, uint256 _poolId) external view returns (uint256);
    function getLastClaimTime(address user, uint256 _poolId) external view returns (uint256);
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

    struct VaultDeposit {
        address lp;
        uint256 amount;
        uint256 vaultId;
        uint256 dailyPayout;
        uint256 vaultApy;
        CoverLib.Status status;
        uint256 daysLeft;
        uint256 startDate;
        uint256 expiryDate;
        uint256 withdrawalInitiated;
        uint256 accruedPayout;
        CoverLib.AssetDepositType assetType;
        address asset;
    }

    function getVault(uint256 vaultId) external view returns (Vault memory);
    function getVaultCount() external view returns (uint256);
    function getUserVaultDeposit(uint256 vaultId, address user) external view returns (VaultDeposit memory);
    function setUserVaultDepositToZero(uint256 vaultId, address user) external;
}

interface IbqBTC {
    function bqMint(address account, uint256 amount) external;
    function burn(address account, uint256 amount) external;
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IGov {
    struct ProposalParams {
        address user;
        CoverLib.RiskType riskType;
        uint256 coverId;
        string txHash;
        string description;
        uint256 poolId;
        uint256 claimAmount;
        CoverLib.AssetDepositType adt;
        address asset;
    }

    struct Proposal {
        uint256 id;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 createdAt;
        uint256 deadline;
        uint256 timeleft;
        ProposalStaus status;
        bool executed;
        ProposalParams proposalParam;
    }

    enum ProposalStaus {
        Submitted,
        Pending,
        Approved,
        Claimed,
        Rejected
    }

    function getProposalDetails(uint256 _proposalId) external returns (Proposal memory);
    function updateProposalStatusToClaimed(uint256 proposalId) external;
    function setUserVaultDepositToZero(uint256 vaultId, address user) external;
    function setUserVaultDepositToWithdrawn(uint256 vaultId, address user) external;
}

contract InsurancePool is ReentrancyGuard, Ownable {
    AggregatorV3Interface internal bnbPriceFeed;
    AggregatorV3Interface internal wbtcPriceFeed;
    AggregatorV3Interface internal busdPriceFeed;
    AggregatorV3Interface internal usdtPriceFeed;

    mapping(address => AggregatorV3Interface) public assetPriceFeeds;

    using CoverLib for *;

    mapping(address => mapping(uint256 => mapping(CoverLib.DepositType => CoverLib.Deposits))) deposits;
    mapping(uint256 => CoverLib.Cover[]) poolToCovers;
    mapping(uint256 => CoverLib.Pool) public pools;
    uint256 public poolCount;
    address public governance;
    ICover public ICoverContract;
    IVault public IVaultContract;
    IGov public IGovernanceContract;
    IbqBTC public bqBTC;
    address public bqBTCAddress;
    address private nullAsset = 0x0000000000000000000000000000000000000000;
    address public coverContract;
    address public vaultContract;
    address public poolCanister;
    address public initialOwner;
    address[] public participants;
    mapping(address => uint256) public participation;

    event Deposited(address indexed user, uint256 amount, string pool);
    event Withdraw(address indexed user, uint256 amount, string pool);
    event ClaimPaid(address indexed recipient, string pool, uint256 amount);
    event PoolCreated(uint256 indexed id, string poolName);
    event PoolUpdated(uint256 indexed poolId, uint256 apy, uint256 _minPeriod);
    event ClaimAttempt(uint256, uint256, address);

    constructor(address _initialOwner, address _bqBtc) Ownable(_initialOwner) {
        initialOwner = _initialOwner;
        bnbPriceFeed = AggregatorV3Interface(0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526);
        wbtcPriceFeed = AggregatorV3Interface(0x5741306c21795FdCBb9b265Ea0255F499DFe515C);
        busdPriceFeed = AggregatorV3Interface(0x9331b55D9830EF609A2aBCfAc0FBCE050A52fdEa);
        usdtPriceFeed = AggregatorV3Interface(0xEca2605f0BCF2BA5966372C99837b1F182d3D620);

        assetPriceFeeds[nullAsset] = bnbPriceFeed;
        assetPriceFeeds[0x6ce8dA28E2f864420840cF74474eFf5fD80E65B8] = wbtcPriceFeed;
        assetPriceFeeds[_bqBtc] = wbtcPriceFeed;
        assetPriceFeeds[0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee] = busdPriceFeed;
        assetPriceFeeds[0x337610d27c682E347C9cD60BD4b3b107C9d34dDd] = usdtPriceFeed;

        bqBTC = IbqBTC(_bqBtc);
        bqBTCAddress = _bqBtc;
    }

    function createPool(CoverLib.PoolParams memory params) public onlyOwner {
        require(params.adt == CoverLib.AssetDepositType.Native || params.asset != address(0), "Wrong Asset for Deposit");

        poolCount += 1;
        CoverLib.Pool storage newPool = pools[params.poolId];
        newPool.id = params.poolId;
        newPool.poolName = params.poolName;
        newPool.rating = params.rating;
        newPool.apy = params.apy;
        newPool.totalUnit = 0;
        newPool.minPeriod = params.minPeriod;
        newPool.tvl = 0;
        newPool.coverUnits = 0;
        newPool.baseValue = 0;
        newPool.isActive = true;
        newPool.riskType = params.riskType;
        newPool.investmentArmPercent = params.investmentArm;
        newPool.leverage = params.leverage;
        newPool.percentageSplitBalance = 100 - params.investmentArm;
        newPool.assetType = params.adt;
        newPool.asset = params.asset;

        emit PoolCreated(params.poolId, params.poolName);
    }

    function updatePool(uint256 _poolId, uint256 _apy, uint256 _minPeriod) public onlyOwner {
        require(pools[_poolId].isActive, "Pool does not exist or is inactive");
        require(_apy > 0, "Invalid APY");
        require(_minPeriod > 0, "Invalid minimum period");

        pools[_poolId].apy = _apy;
        pools[_poolId].minPeriod = _minPeriod;

        emit PoolUpdated(_poolId, _apy, _minPeriod);
    }

    function reducePercentageSplit(uint256 _poolId, uint256 __poolPercentageSplit) public onlyCover {
        pools[_poolId].percentageSplitBalance -= __poolPercentageSplit;
    }

    function increasePercentageSplit(uint256 _poolId, uint256 __poolPercentageSplit) public onlyCover {
        pools[_poolId].percentageSplitBalance += __poolPercentageSplit;
    }

    function deactivatePool(uint256 _poolId) public onlyOwner {
        require(pools[_poolId].isActive, "Pool is not active");
        pools[_poolId].isActive = false;
    }

    function getPool(uint256 _poolId) public view returns (CoverLib.Pool memory) {
        CoverLib.Pool memory pool = pools[_poolId];

        return pool;
    }

    function getAllPools() public view returns (CoverLib.Pool[] memory) {
        CoverLib.Pool[] memory result = new CoverLib.Pool[](poolCount);
        for (uint256 i = 1; i <= poolCount; i++) {
            CoverLib.Pool memory pool = getPool(i);
            result[i - 1] = pool;
        }
        return result;
    }

    function updatePoolCovers(uint256 _poolId, CoverLib.Cover memory _cover) public onlyCover {
        for (uint256 i = 0; i < poolToCovers[_poolId].length; i++) {
            if (poolToCovers[_poolId][i].id == _cover.id) {
                poolToCovers[_poolId][i] = _cover;
                break;
            }
        }
    }

    function addPoolCover(uint256 _poolId, CoverLib.Cover memory _cover) public onlyCover {
        poolToCovers[_poolId].push(_cover);
    }

    function getPoolCovers(uint256 _poolId) public view returns (CoverLib.Cover[] memory) {
        return poolToCovers[_poolId];
    }

    function getPoolsByAddress(address _userAddress) public view returns (CoverLib.PoolInfo[] memory) {
        uint256 resultCount = 0;
        for (uint256 i = 1; i <= poolCount; i++) {
            if (deposits[_userAddress][i][CoverLib.DepositType.Normal].amount > 0) {
                resultCount++;
            }
        }

        CoverLib.PoolInfo[] memory result = new CoverLib.PoolInfo[](resultCount);

        uint256 resultIndex = 0;

        for (uint256 i = 1; i <= poolCount; i++) {
            CoverLib.Pool storage pool = pools[i];
            CoverLib.Deposits memory userDeposit = deposits[_userAddress][i][CoverLib.DepositType.Normal];
            uint256 claimableDays = ICoverContract.getDepositClaimableDays(_userAddress, i);
            uint256 accruedPayout = userDeposit.dailyPayout * claimableDays;
            if (deposits[_userAddress][i][CoverLib.DepositType.Normal].amount > 0) {
                result[resultIndex++] = CoverLib.PoolInfo({
                    poolName: pool.poolName,
                    rating: pool.rating,
                    risk: pool.riskType,
                    poolId: i,
                    dailyPayout: deposits[_userAddress][i][CoverLib.DepositType.Normal].dailyPayout,
                    depositAmount: deposits[_userAddress][i][CoverLib.DepositType.Normal].amount,
                    apy: pool.apy,
                    minPeriod: pool.minPeriod,
                    totalUnit: pool.totalUnit,
                    tcp: pool.tcp,
                    isActive: pool.isActive,
                    accruedPayout: accruedPayout
                });
            }
        }
        return result;
    }

    function poolWithdrawal(uint256 _poolId) public nonReentrant {
        CoverLib.Pool memory selectedPool = pools[_poolId];
        CoverLib.Deposits storage userDeposit = deposits[msg.sender][_poolId][CoverLib.DepositType.Normal];

        uint256 expiry = userDeposit.startDate + (selectedPool.minPeriod * 1 days);

        require(userDeposit.amount > 0, "No deposit found for this address");
        require(userDeposit.status == CoverLib.Status.Active, "Deposit is not active");
        require(block.timestamp >= expiry, "Deposit period has not ended");

        userDeposit.status = CoverLib.Status.Withdrawn;
        userDeposit.withdrawalInitiated = block.timestamp;

        uint256 decimals;
        uint256 priceInUSD;
        userDeposit.status = CoverLib.Status.Withdrawn;
        selectedPool.totalUnit -= userDeposit.amount;
        uint256 amount = userDeposit.amount;
        uint256 baseValue =
            selectedPool.totalUnit - ((selectedPool.investmentArmPercent * selectedPool.totalUnit) / 100);

        uint256 coverUnits = baseValue * selectedPool.leverage;
        selectedPool.coverUnits = coverUnits;
        selectedPool.baseValue = baseValue;
        CoverLib.Cover[] memory poolCovers = getPoolCovers(_poolId);
        for (uint256 i = 0; i < poolCovers.length; i++) {
            ICoverContract.updateMaxAmount(poolCovers[i].id);
        }

        userDeposit.amount = 0;
        if (selectedPool.assetType == CoverLib.AssetDepositType.ERC20) {
            bool success = IERC20(selectedPool.asset).transfer(msg.sender, amount);
            require(success, "ERC20 transfer failed");
        } else {
            (bool success,) = msg.sender.call{value: amount}("");
            require(success, "Native asset transfer failed");
        }

        emit Withdraw(msg.sender, amount, selectedPool.poolName);
    }

    function initialVaultWithdrawUpdate(address depositor, uint256 _poolId, CoverLib.DepositType pdt)
        public
        nonReentrant
        onlyVault
    {
        CoverLib.Pool memory selectedPool = pools[_poolId];
        CoverLib.Deposits storage userDeposit = deposits[depositor][_poolId][pdt];
        uint256 expiry = userDeposit.startDate + (selectedPool.minPeriod * 1 days);

        require(userDeposit.amount > 0, "No deposit found for this address");
        require(userDeposit.status == CoverLib.Status.Active, "Deposit is not active");
        require(block.timestamp >= expiry, "Deposit period has not ended");

        userDeposit.withdrawalInitiated = block.timestamp;
        userDeposit.status = CoverLib.Status.Withdrawn;

        uint256 decimals;
        uint256 priceInUSD;

        selectedPool.totalUnit -= userDeposit.amount;

        uint256 baseValue =
            selectedPool.totalUnit - ((selectedPool.investmentArmPercent * selectedPool.totalUnit) / 100);

        uint256 coverUnits = baseValue * selectedPool.leverage;
        selectedPool.coverUnits = coverUnits;
        selectedPool.baseValue = baseValue;
        selectedPool.tvl -= userDeposit.amount;
        CoverLib.Cover[] memory poolCovers = getPoolCovers(_poolId);
        for (uint256 i = 0; i < poolCovers.length; i++) {
            ICoverContract.updateMaxAmount(poolCovers[i].id);
        }

        emit Withdraw(depositor, userDeposit.amount, selectedPool.poolName);
    }

    function vaultWithdraw(uint256 _vaultId) public nonReentrant {
        IVault.VaultDeposit memory userVaultDeposit = IVaultContract.getUserVaultDeposit(_vaultId, msg.sender);
        require(userVaultDeposit.amount > 0, "No active withdrawal for user");
        require(userVaultDeposit.status == CoverLib.Status.Withdrawn, "Deposit is not ready for withdrawals");
        IVault.Vault memory vault = IVaultContract.getVault(_vaultId);
        CoverLib.AssetDepositType adt = vault.assetType;
        if (adt == CoverLib.AssetDepositType.ERC20) {
            bool success = IERC20(vault.asset).transfer(msg.sender, userVaultDeposit.amount);
            require(success, "ERC20 transfer failed");
        } else {
            (bool success,) = msg.sender.call{value: userVaultDeposit.amount}("");
            require(success, "Native asset transfer failed");
        }

        IVaultContract.setUserVaultDepositToZero(_vaultId, msg.sender);
    }

    function deposit(CoverLib.DepositParams memory depositParam)
        public
        payable
        nonReentrant
        returns (uint256, uint256)
    {
        CoverLib.Pool storage selectedPool = pools[depositParam.poolId];

        require(selectedPool.isActive, "Pool is inactive or does not exist");
        require(selectedPool.assetType == depositParam.adt, "Pool does not accept this deposit type");
        require(selectedPool.asset == depositParam.asset, "Pool does not accept this asset");

        uint256 price;
        uint256 decimals;
        uint256 priceInUSD;

        if (selectedPool.assetType == CoverLib.AssetDepositType.ERC20) {
            require(depositParam.amount > 0, "Amount must be greater than 0");
            bool success =
                IERC20(depositParam.asset).transferFrom(depositParam.depositor, address(this), depositParam.amount);
            require(success, "Token transfer failed");
            selectedPool.totalUnit += depositParam.amount;
            selectedPool.tvl += depositParam.amount;
            price = depositParam.amount;
        } else {
            require(msg.value > 0, "Deposit cannot be zero");
            selectedPool.totalUnit += msg.value;
            selectedPool.tvl += msg.value;
            price = msg.value;
        }

        uint256 baseValue =
            selectedPool.totalUnit - ((selectedPool.investmentArmPercent * selectedPool.totalUnit) / 100);

        uint256 coverUnits = baseValue * selectedPool.leverage;

        selectedPool.coverUnits = coverUnits;
        selectedPool.baseValue = baseValue;
        uint256 dailyPayout;

        if (deposits[depositParam.depositor][depositParam.poolId][depositParam.pdt].amount > 0) {
            uint256 newPrice = deposits[depositParam.depositor][depositParam.poolId][depositParam.pdt].amount + price;
            price = newPrice;
            dailyPayout = (newPrice * selectedPool.apy) / 100 / 365;
            CoverLib.Deposits memory userDeposit = CoverLib.Deposits({
                lp: depositParam.depositor,
                amount: newPrice,
                poolId: depositParam.poolId,
                dailyPayout: dailyPayout,
                status: CoverLib.Status.Active,
                daysLeft: selectedPool.minPeriod,
                startDate: block.timestamp,
                withdrawalInitiated: 0,
                accruedPayout: 0,
                pdt: depositParam.pdt
            });

            if (depositParam.pdt == CoverLib.DepositType.Normal) {
                deposits[depositParam.depositor][depositParam.poolId][CoverLib.DepositType.Normal] = userDeposit;
            } else {
                deposits[depositParam.depositor][depositParam.poolId][CoverLib.DepositType.Vault] = userDeposit;
            }
        } else {
            dailyPayout = (price * selectedPool.apy) / 100 / 365;
            CoverLib.Deposits memory userDeposit = CoverLib.Deposits({
                lp: depositParam.depositor,
                amount: price,
                poolId: depositParam.poolId,
                dailyPayout: dailyPayout,
                status: CoverLib.Status.Active,
                daysLeft: selectedPool.minPeriod,
                startDate: block.timestamp,
                withdrawalInitiated: 0,
                accruedPayout: 0,
                pdt: depositParam.pdt
            });

            if (depositParam.pdt == CoverLib.DepositType.Normal) {
                deposits[depositParam.depositor][depositParam.poolId][CoverLib.DepositType.Normal] = userDeposit;
            } else {
                deposits[depositParam.depositor][depositParam.poolId][CoverLib.DepositType.Vault] = userDeposit;
            }
        }

        CoverLib.Cover[] memory poolCovers = getPoolCovers(depositParam.poolId);
        for (uint256 i = 0; i < poolCovers.length; i++) {
            ICoverContract.updateMaxAmount(poolCovers[i].id);
        }

        bool userExists = false;
        for (uint256 i = 0; i < participants.length; i++) {
            if (participants[i] == depositParam.depositor) {
                userExists = true;
                break;
            }
        }

        if (!userExists) {
            participants.push(depositParam.depositor);
        }

        participation[depositParam.depositor] += 1;

        emit Deposited(depositParam.depositor, depositParam.amount, selectedPool.poolName);

        return (price, dailyPayout);
    }

    // function claimProposalFunds(uint256 _proposalId) public nonReentrant {
    //     IGov.Proposal memory proposal = IGovernanceContract.getProposalDetails(
    //         _proposalId
    //     );
    //     IGov.ProposalParams memory proposalParam = proposal.proposalParam;
    //     require(
    //         proposal.status == IGov.ProposalStaus.Approved && proposal.executed,
    //         "Proposal not approved"
    //     );
    //     CoverLib.Pool storage pool = pools[proposalParam.poolId];
    //     require(msg.sender == proposalParam.user, "Not a valid proposal");
    //     require(pool.isActive, "Pool is not active");
    //     require(
    //         pool.totalUnit >= proposalParam.claimAmount,
    //         "Not enough funds in the pool"
    //     );

    //     pool.tcp += proposalParam.claimAmount;
    //     pool.totalUnit -= proposalParam.claimAmount;
    //     CoverLib.Cover[] memory poolCovers = getPoolCovers(
    //         proposalParam.poolId
    //     );
    //     for (uint i = 0; i < poolCovers.length; i++) {
    //         ICoverContract.updateMaxAmount(poolCovers[i].id);
    //     }

    //     IGovernanceContract.updateProposalStatusToClaimed(_proposalId);

    //     emit ClaimAttempt(
    //         proposalParam.poolId,
    //         proposalParam.claimAmount,
    //         proposalParam.user
    //     );

    //     if (proposalParam.adt == CoverLib.AssetDepositType.ERC20) {
    //         bool success = IERC20(proposalParam.asset).transfer(
    //             msg.sender,
    //             proposalParam.claimAmount
    //         );
    //         require(success, "ERC20 transfer failed");
    //     } else {
    //         (bool success, ) = msg.sender.call{value: proposalParam.claimAmount}("");
    //         require(success, "Native asset transfer failed");
    //     }

    //     bqBTC.bqMint(msg.sender, proposalParam.claimAmount);

    //     emit ClaimPaid(msg.sender, pool.poolName, proposalParam.claimAmount);
    // }

    function getUserPoolDeposit(uint256 _poolId, address _user) public view returns (CoverLib.Deposits memory) {
        CoverLib.Deposits memory userDeposit = deposits[_user][_poolId][CoverLib.DepositType.Normal];
        CoverLib.Pool memory selectedPool = pools[_poolId];
        uint256 expiry = userDeposit.startDate + (selectedPool.minPeriod * 1 days);
        uint256 claimTime = ICoverContract.getLastClaimTime(_user, _poolId);
        uint256 lastClaimTime;
        if (claimTime == 0) {
            lastClaimTime = userDeposit.startDate;
        } else {
            lastClaimTime = claimTime;
        }
        uint256 currentTime = block.timestamp;
        if (userDeposit.status != CoverLib.Status.Active) {
            currentTime = userDeposit.withdrawalInitiated;
        }
        // if (currentTime > expiry) {
        //     currentTime = expiry;
        // }
        uint256 claimableDays = (currentTime - lastClaimTime) / 1 days;
        userDeposit.accruedPayout = userDeposit.dailyPayout * claimableDays;
        if (expiry <= block.timestamp) {
            userDeposit.daysLeft = 0;
        } else {
            uint256 timeLeft = expiry - block.timestamp;
            userDeposit.daysLeft = (timeLeft + 1 days - 1) / 1 days;
        }
        return userDeposit;
    }

    function getUserGenericDeposit(uint256 _poolId, address _user, CoverLib.DepositType pdt)
        public
        view
        returns (CoverLib.GenericDepositDetails memory)
    {
        CoverLib.Deposits memory userDeposit = deposits[_user][_poolId][pdt];
        CoverLib.Pool memory pool = pools[_poolId];
        uint256 expiry = userDeposit.startDate + (pool.minPeriod * 1 days);
        uint256 claimTime = ICoverContract.getLastClaimTime(_user, _poolId);
        uint256 lastClaimTime;
        if (claimTime == 0) {
            lastClaimTime = userDeposit.startDate;
        } else {
            lastClaimTime = claimTime;
        }
        uint256 currentTime = block.timestamp;
        if (userDeposit.status != CoverLib.Status.Active) {
            currentTime = userDeposit.withdrawalInitiated;
        }
        // if (currentTime > expiry) {
        //     currentTime = expiry;
        // }
        uint256 claimableDays = (currentTime - lastClaimTime) / 1 days;
        userDeposit.accruedPayout = userDeposit.dailyPayout * claimableDays;
        if (expiry <= block.timestamp) {
            userDeposit.daysLeft = 0;
        } else {
            uint256 timeLeft = expiry - block.timestamp;
            userDeposit.daysLeft = (timeLeft + 1 days - 1) / 1 days;
        }

        return CoverLib.GenericDepositDetails({
            lp: userDeposit.lp,
            amount: userDeposit.amount,
            poolId: userDeposit.poolId,
            dailyPayout: userDeposit.dailyPayout,
            status: userDeposit.status,
            daysLeft: userDeposit.daysLeft,
            startDate: userDeposit.startDate,
            withdrawalInitiated: userDeposit.withdrawalInitiated,
            accruedPayout: userDeposit.accruedPayout,
            pdt: userDeposit.pdt,
            adt: pool.assetType,
            asset: pool.asset
        });
    }

    function setUserDepositToZero(uint256 poolId, address user, CoverLib.DepositType pdt)
        public
        nonReentrant
        onlyPoolCanister
    {
        deposits[user][poolId][pdt].amount = 0;
    }

    function getPoolTVL(uint256 _poolId) public view returns (uint256) {
        CoverLib.Pool memory pool = pools[_poolId];

        return pool.tvl;
    }

    function getTotalTVL() public view returns (uint256) {
        uint256 totalTVl;

        for (uint256 i = 1; i <= poolCount; i++) {
            uint256 poolTvl = getPoolTVL(i);
            totalTVl += poolTvl;
        }

        return totalTVl;
    }

    function poolActive(uint256 poolId) public view returns (bool) {
        CoverLib.Pool storage pool = pools[poolId];
        return pool.isActive;
    }

    // function getAllParticipants() public view returns (address[] memory) {
    //     return participants;
    // }

    // function getUserParticipation(address user) public view returns (uint256) {
    //     return participation[user];
    // }
    function setGovernance(address _governance) external onlyOwner {
        require(governance == address(0), "Governance already set");
        require(_governance != address(0), "Governance address cannot be zero");
        governance = _governance;
        IGovernanceContract = IGov(_governance);
    }

    function setCover(address _coverContract) external onlyOwner {
        require(coverContract == address(0), "Cover already set");
        require(_coverContract != address(0), "Cover address cannot be zero");
        ICoverContract = ICover(_coverContract);
        coverContract = _coverContract;
    }

    function setVault(address _vaultContract) external onlyOwner {
        require(vaultContract == address(0), "Vault already set");
        require(_vaultContract != address(0), "Vault address cannot be zero");
        IVaultContract = IVault(_vaultContract);
        vaultContract = _vaultContract;
    }

    modifier onlyGovernance() {
        require(msg.sender == governance || msg.sender == initialOwner, "Caller is not the governance contract");
        _;
    }

    modifier onlyCover() {
        require(msg.sender == coverContract || msg.sender == initialOwner, "Caller is not the cover contract");
        _;
    }

    modifier onlyVault() {
        require(msg.sender == vaultContract || msg.sender == initialOwner, "Caller is not the vault contract");
        _;
    }

    modifier onlyPoolCanister() {
        require(msg.sender == poolCanister || msg.sender == initialOwner, "Caller is not the pool canister");
        _;
    }
}
