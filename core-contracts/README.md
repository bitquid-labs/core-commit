# BQ Labs Insurance Contracts

# Insurance Pool

### createPool

```
    poolId
    riskType - could be slashing, smart contract, protocol
    poolName
    apy
    minPeriod,
    leverage
    investmentarm,
    adt - the asset deposit type could be a native deposits or ERC 20 deposits
    asset - the address of the asset if it is an ERC 20 deposit type
```

### getPool:

Takes the `id` of the pool and returns a `Pool`:

```
struct Pool {
    uint256 id;
    string poolName;
    CoverLib.RiskType riskType;
    uint256 apy;
    uint256 minPeriod;
    uint256 tvl;
    uint256 baseValue;
    uint256 coverTvl;
    uint256 tcp;
    bool isActive;
    uint256 percentageSplitBalance;
    uint256 investmentArmPercent;
    uint8 leverage;
    address asset;
    CoverLib.AssetDepositType assetType;
}
```

### getAllPools:

Returns an array of `Pool`

### getPoolCovers:

Gets the covers associated with a specific pool. Takes the pool `id` and returns an array of `Cover`:

```
struct Cover {
    uint256 id;
    string coverName;
    RiskType riskType;
    string chains;
    uint256 capacity;
    uint256 cost;
    uint256 capacityAmount;
    uint256 coverValues;
    uint256 maxAmount;
    uint256 poolId;
    string CID;
}
```

### getPoolsByAddress

Gets the pools for a users by taking the `user address` and returns an an array of the user `PoolInfo`:

```
struct PoolInfo {
    string poolName;
    uint256 poolId;
    uint256 dailyPayout;
    uint256 depositAmount;
    uint256 apy;
    uint256 minPeriod;
    uint256 tvl;
    uint256 tcp; // Total claim paid to users
    bool isActive; // Pool status to handle soft deletion
    uint256 accruedPayout;
}
```

### poolWithdraw:

Called by users to withdraw their funds deposited into a pool. Takes the `poolid` as parameter

### vaultWithdraw:

Called by users to withdraw their funds deposited into a vault. Takes the `vaultid` as parameter

### deposit

Called by users to deposit funds into a pool. Takes a `DepositParam` as parameter:

```
struct DepositParams {
    address depositor;
    uint256 poolId;
    uint256 amount;
    uint256 period;
    CoverLib.DepositType pdt - pool deposit type, could be pool a pool deposit or a vault depost. Would be a pool deposit in this cases
    CoverLib.AssetDepositType adt - the asset deposit type could be a native deposits or ERC 20 deposits
    address asset - the address of the asset if it is an ERC 20 deposit type
}
```

### claimProposalFunds

Called by users to claim their funds from an approved proposal. Takes the `proposalid` as parameter

### getUserDeposit

Gets the deposit for a users into a pool by taking the `poolid` and the `user address` and return the user `Deposit`

```
struct Deposits {
    address lp;
    uint256 amount;
    uint256 poolId;
    uint256 dailyPayout;
    CoverLib.Status status;
    uint256 daysLeft;
    uint256 startDate;
    uint256 expiryDate;
    uint256 accruedPayout;
    CoverLib.DepositType pdt; // Vault deposit or normal pool deposit?
}
```

# Vaults

### createVault

```
    vaultname
    poolIds - the ids of the pools that would be added to the vault
    poolPercentageSplit -  the percentage split of the pools. Must be the same number with the pools and the sum must be = 100
    minIv - vault min investment accepted
    maxIv - vault max investment accepted
    minPeriod - vault min period accepted
    adt - the asset deposit type could be a native deposits or ERC 20 deposits
    asset - the address of the asset if it is an ERC 20 deposit type
```

### vaultDeposit

Called by users to deposit funds into a vault. Takes the `vaultId`, the `period` for deposit and the `amount`. It is also a `payable` function, so if the `adt` is native the `amount` would be `0` and the `msg.value` would be used, if otherwise the `amount` must be more than 0 and the vault's `asset` is accepted as deposit for the user.

### getVault

Takes the `id` of the vault and returns a `Vault`:

```
struct Vault {
    uint256 id;
    string vaultName;
    CoverLib.Pool[] pools;
    uint256 minInv;
    uint256 maxInv;
    uint256 minPeriod;
    CoverLib.AssetDepositType assetType;
    address asset;
}
```

### getVaultPools

Gets the pools associated with a specific vault. Takes the `vaultid` and returns an array of `Pool`:

```
struct Pool {
    uint256 id;
    string poolName;
    CoverLib.RiskType riskType;
    uint256 apy;
    uint256 minPeriod;
    uint256 tvl;
    uint256 baseValue;
    uint256 coverTvl;
    uint256 tcp;
    bool isActive;
    uint256 percentageSplitBalance;
    uint256 investmentArmPercent;
    uint8 leverage;
    address asset;
    CoverLib.AssetDepositType assetType;
}
```

### getUserVaultPoolDeposits

Gets the users individual pool deposits in a vault taking the `vaultid` and the `user address` and return an array of the user individual `Deposit`

```
struct Deposits {
    address lp;
    uint256 amount;
    uint256 poolId;
    uint256 dailyPayout;
    CoverLib.Status status;
    uint256 daysLeft;
    uint256 startDate;
    uint256 expiryDate;
    uint256 accruedPayout;
    CoverLib.DepositType pdt; // Vault deposit or normal pool deposit?
}
```

### getUserVaultPoolDeposit

Gets the users vault deposit by taking the `vaultid` and the `user address` and returning the user `VaultDeposit`

```
struct VaultDeposit {
    address lp;
    uint256 amount;
    uint256 vaultId;
    uint256 dailyPayout;
    CoverLib.Status status;
    uint256 daysLeft;
    uint256 startDate;
    uint256 expiryDate;
    uint256 accruedPayout;
}
```

# Contract Address

**BQ BTC Address**: 0xa1EcB7aD03c31740109d88c7a693bE5a008C6D5b

**Pool Address**: 0x043acf6719835c3435f9f5212C7D21D0Fe44644F

**Cover Address**: 0x31ec64f65E9608cE20092034Aa7A524a7B4B5d49

**Vault Address**: 0x6DD69b56af1156A9fF45D95e3F1506B8b09b5B41

**Gov Address**: 0xAEF44f26efE41C2F360C27461B47C143879B9F08

# Changes

## Pool Contract

- getUserBalanceinUSD : To get user balance in USD

- getTotalUserDepositAmountinUSD: Get user total deposit in USD

# Cover IDs

| Network       | Testnet Chain ID |
| ------------- | ---------------- |
| Babylon       | 1                |
| Infstone      | 2                |
| DAIC          | 3                |
| Core DAO      | 1115             |
| Stakecito     | 4                |
| Pier2         | 5                |
| BIMA          | 6                |
| Satoshi       | 7                |
| LstBTC        | 8                |
| BounceBit_BTC | 9                |
| FDUSD         | 10               |
| Lorenzo       | 83291            |
| LBTC          | 11               |
| TUSD          | 12               |
| USDe          | 13               |
| Bedrock       | 14               |
