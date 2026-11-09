# Oracles

Reference for the `aave-oracle` Move package.

## Overview

The Aave Oracle is a contract that manages asset prices and price sources for the Aave Protocol on Aptos. It allows authorized administrators to set, update, and remove price feeds for assets, and provides functions to query asset prices.

## Write Methods

### set_asset_feed_id

```move=
public entry fun set_asset_feed_id(account: &signer, asset: address, feed_id: vector<u8>)
```

Sets the price feed ID for a given asset.

This method can only be called by a `POOL_ADMIN` or `ASSET_LISTING_ADMIN`. Please look at the ACLManager contract for further details on system roles.

**Input Parameters:**

| Name    | Type         | Description                                      |
| ------- | ------------ | ------------------------------------------------ |
| account | &signer      | The signer with admin privileges                 |
| asset   | address      | The address of the asset for which feed is set   |
| feed_id | vector\<u8\> | The ID of the Chainlink price feed for the asset |

### batch_set_asset_feed_ids

```move=
public entry fun batch_set_asset_feed_ids(account: &signer, assets: vector<address>, feed_ids: vector<vector<u8>>)
```

Sets the price feed IDs for multiple assets in a single transaction.

This method can only be called by a `POOL_ADMIN` or `ASSET_LISTING_ADMIN`. Please look at the `acl_manage` contract for further details on system roles.

**Input Parameters:**

| Name     | Type                   | Description                                                                              |
| -------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| account  | &signer                | The signer with admin privileges                                                         |
| assets   | vector\<address\>      | The addresses of the assets for which feeds are being set                                |
| feed_ids | vector\<vector\<u8\>\> | The IDs of the Chainlink price feeds for each asset. Length must match the assets vector |

### remove_asset_feed_id

```move=
public entry fun remove_asset_feed_id(account: &signer, asset: address)
```

Removes the price feed for a given asset.

This method can only be called by a `POOL_ADMIN` or `ASSET_LISTING_ADMIN`. Please look at the `acl_manage` contract for further details on system roles.

**Input Parameters:**

| Name    | Type    | Description                                     |
| ------- | ------- | ----------------------------------------------- |
| account | &signer | The signer with admin privileges                |
| asset   | address | The address of the asset to remove the feed for |

### batch_remove_asset_feed_ids

```move=
public entry fun batch_remove_asset_feed_ids(account: &signer, assets: vector<address>)
```

Removes the price feeds for multiple assets in a single transaction.

This method can only be called by a `POOL_ADMIN` or `ASSET_LISTING_ADMIN`. Please look at the ACLManager contract for further details on system roles.

**Input Parameters:**

| Name    | Type              | Description                                     |
| ------- | ----------------- | ----------------------------------------------- |
| account | &signer           | The signer with admin privileges                |
| assets  | vector\<address\> | The addresses of the assets to remove feeds for |

## View Methods

### get_asset_price

```move=
#[view]
public fun get_asset_price(asset: address): u256
```

Returns the price of the supported asset in BASE_CURRENCY of the Aave Market in wei.

**Input Parameters:**

| Name  | Type    | Description              |
| ----- | ------- | ------------------------ |
| asset | address | The address of the asset |

**Return Values:**

| Type | Description                                                                     |
| ---- | ------------------------------------------------------------------------------- |
| u256 | The price of the asset in BASE_CURRENCY of the Aave market to its smallest unit |

### get_assets_prices

```move=
#[view]
public fun get_assets_prices(assets: vector<address>): vector<u256>
```

Returns a list of prices from a list of the supported assets addresses in BASE_CURRENCY of the Aave Market. All prices are in the smallest unit of the asset.

**Input Parameters:**

| Name   | Type              | Description                                                   |
| ------ | ----------------- | ------------------------------------------------------------- |
| assets | vector\<address\> | The list of assets addresses for which price is being queried |

**Return Values:**

| Type           | Description                                                               |
| -------------- | ------------------------------------------------------------------------- |
| vector\<u256\> | The prices of the given assets in BASE_CURRENCY of the Aave market in wei |

### get_asset_price_decimals

```move=
#[view]
public fun get_asset_price_decimals(): u8
```

Returns the number of decimals used for asset prices.

**Return Values:**

| Type | Description                                  |
| ---- | -------------------------------------------- |
| u8   | The number of decimals for asset prices (18) |

### oracle_address

```move=
#[view]
public fun oracle_address(): address
```

Returns the address of the oracle resource account.

**Return Values:**

| Type    | Description                       |
| ------- | --------------------------------- |
| address | The address of the oracle account |
