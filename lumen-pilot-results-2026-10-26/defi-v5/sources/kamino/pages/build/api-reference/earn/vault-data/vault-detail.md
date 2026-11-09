> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get KVault by address

> Get a single Kamino Earn Vault by the KVault account address



## OpenAPI

````yaml kamino-api.json GET /kvaults/vaults/{pubkey}
openapi: 3.1.0
info:
  version: 1.0.0
  title: Kamino Public API
  description: >
    The Kamino API provides a comprehensive way to interact with Kamino without
    reading directly from the blockchain.


    The API also provides the ability to fetch data that might not be available
    from just reading the chain.


    The API is rate-limited for unauthenticated users. If you feel you need to
    make more requests or run into rate-limit issues, please reach out.
servers:
  - url: https://api.kamino.finance
security: []
paths:
  /kvaults/vaults/{pubkey}:
    get:
      tags:
        - Kamino Earn Vaults
      summary: Get KVault by address
      description: Get a single Kamino Earn Vault by the KVault account address
      parameters:
        - schema:
            $ref: '#/components/schemas/AddressBase58'
          required: true
          description: Valid base58-encoded address
          name: pubkey
          in: path
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  address:
                    allOf:
                      - $ref: '#/components/schemas/AddressBase58'
                      - description: Public key of the vault
                  state:
                    $ref: '#/components/schemas/The vault state object'
                  programId:
                    allOf:
                      - $ref: '#/components/schemas/AddressBase58'
                      - description: Public key of the kvault program which owns the vault
                required:
                  - address
                  - state
                  - programId
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: High-level error message describing the failure
                    example: Invalid query params
                  details:
                    type: array
                    items:
                      type: object
                      additionalProperties: {}
                    description: >-
                      Detailed validation issues (present only for validation
                      errors)
                required:
                  - error
                description: Bad request response (400)
                example:
                  error: Invalid query request
                  details:
                    - code: invalid_union
                      errors:
                        - - code: custom
                            path: []
                            message: Invalid date string
                        - - expected: number
                            code: invalid_type
                            path: []
                            message: 'Invalid input: expected number, received string'
                      path:
                        - start
                      message: Invalid input
        '404':
          description: Not Found
          content:
            application/json:
              schema:
                type: object
                properties:
                  metadata:
                    type: string
                    description: Error message describing why it was not found
                    example: Account could not be found
                required:
                  - metadata
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
components:
  schemas:
    AddressBase58:
      type: string
      description: Valid base58-encoded address
      example: VEG1EMtttdHunMbSza8uoms1R18VXmYSph2bBpHcSJd
    The vault state object:
      type: object
      properties:
        vaultAdminAuthority:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Public key of the vault admin authority
        baseVaultAuthority:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Public key of the base vault authority
        baseVaultAuthorityBump:
          type: number
          description: Bump seed for the base vault authority
        tokenMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Public key of the token mint
        tokenMintDecimals:
          type: number
          description: Decimals of the token mint
        tokenVault:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Public key of the token vault
        tokenProgram:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Public key of the token program
        sharesMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Public key of the shares mint
        sharesMintDecimals:
          type: number
          description: Decimals of the shares mint
        tokenAvailable:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Amount of tokens available in the vault
        sharesIssued:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total shares issued by the vault
        availableCrankFunds:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Available crank funds in the vault
        performanceFeeBps:
          type: number
          description: Performance fee in basis points
        managementFeeBps:
          type: number
          description: Management fee in basis points
        lastFeeChargeTimestamp:
          type: number
          description: Timestamp of the last fee charge
        prevAum:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Previous assets under management scaled factor
        pendingFees:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Pending fees scaled factor
        vaultAllocationStrategy:
          type: array
          items:
            type: object
            properties:
              reserve:
                allOf:
                  - $ref: '#/components/schemas/AddressBase58'
                  - description: Public key of the reserve
              ctokenVault:
                allOf:
                  - $ref: '#/components/schemas/AddressBase58'
                  - description: Public key of the cToken vault
              targetAllocationWeight:
                type: number
                description: Target allocation weight as a whole number
              tokenAllocationCap:
                type: string
                description: Token allocation cap in lamports
              ctokenVaultBump:
                type: number
                description: cToken vault bump seed
              ctokenAllocation:
                type: string
                description: cToken allocation in lamports
              lastInvestSlot:
                type: string
                description: Last invest slot
              tokenTargetAllocation:
                allOf:
                  - $ref: '#/components/schemas/Decimal'
                  - description: Token target allocation scaled factor
            required:
              - reserve
              - ctokenVault
              - targetAllocationWeight
              - tokenAllocationCap
              - ctokenVaultBump
              - ctokenAllocation
              - lastInvestSlot
              - tokenTargetAllocation
            description: Vault allocation strategy entry
          description: List of vault allocation strategies
        minDepositAmount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Minimum deposit amount in lamports
        minWithdrawAmount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Minimum withdraw amount in lamports
        minInvestAmount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Minimum invest amount in lamports
        minInvestDelaySlots:
          type: number
          description: Minimum invest delay in slots
        crankFundFeePerReserve:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Crank fund fee per reserve
        pendingAdmin:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Public key of the pending admin
        cumulativeEarnedInterest:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative earned interest in decimal format
        cumulativeMgmtFees:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative management fees in decimal format
        cumulativePerfFees:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative performance fees in decimal format
        name:
          type: string
          description: Name of the vault
        vaultLookupTable:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Public key of the vault lookup table
        vaultFarm:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Public key of the vault farm
        creationTimestamp:
          type: number
          description: Timestamp of vault creation
        allocationAdmin:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Public key of the allocation admin
        depositCap:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: >-
                Maximum vault AUM net of pending fees that deposits can reach,
                in token lamports. 0 and 18446744073709551615 (u64::MAX) mean
                the vault is uncapped
      required:
        - vaultAdminAuthority
        - baseVaultAuthority
        - baseVaultAuthorityBump
        - tokenMint
        - tokenMintDecimals
        - tokenVault
        - tokenProgram
        - sharesMint
        - sharesMintDecimals
        - tokenAvailable
        - sharesIssued
        - availableCrankFunds
        - performanceFeeBps
        - managementFeeBps
        - lastFeeChargeTimestamp
        - prevAum
        - pendingFees
        - vaultAllocationStrategy
        - minDepositAmount
        - minWithdrawAmount
        - minInvestAmount
        - minInvestDelaySlots
        - crankFundFeePerReserve
        - pendingAdmin
        - cumulativeEarnedInterest
        - cumulativeMgmtFees
        - cumulativePerfFees
        - name
        - vaultLookupTable
        - vaultFarm
        - creationTimestamp
        - allocationAdmin
        - depositCap
    Error:
      type: object
      properties:
        error:
          type: string
          description: Error message for internal server failure
          example: An internal error occurred
      required:
        - error
      description: Internal server error response (500)
      example:
        error: An internal error occurred
    Decimal:
      type: string
      description: Decimal value represented as string
      example: '1234.56789'

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.