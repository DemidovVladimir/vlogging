> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get current KVault metrics

> Get current Kamino Earn Vault metrics for a given vault



## OpenAPI

````yaml kamino-api.json GET /kvaults/vaults/{pubkey}/metrics
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
  /kvaults/vaults/{pubkey}/metrics:
    get:
      tags:
        - Kamino Earn Vaults
      summary: Get current KVault metrics
      description: Get current Kamino Earn Vault metrics for a given vault
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
                $ref: '#/components/schemas/KvaultMetrics'
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
    KvaultMetrics:
      type: object
      properties:
        apy7d:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: 7-day Annual Percentage Yield of the kvault
        apy14d:
          anyOf:
            - $ref: '#/components/schemas/Apy'
            - type: 'null'
          description: >-
            14-day Annual Percentage Yield of the kvault, null until the
            historian has computed it
        apy24h:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: 24-hour Annual Percentage Yield of the kvault
        apy30d:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: 30-day Annual Percentage Yield of the kvault
        apy90d:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: 90-day Annual Percentage Yield of the kvault
        apy180d:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: 180-day Annual Percentage Yield of the kvault
        apy365d:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: 365-day Annual Percentage Yield of the kvault
        tvlUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total value locked in USD
        tvlSol:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total value locked in SOL
        deposit_cap:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Maximum deposits accepted by the kvault
        vaultType:
          type: string
          description: KVault type
        tokenPrice:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Price of the kvault token
        solPrice:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Price of SOL
        tokensAvailable:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Number of tokens available in the kvault
        tokensAvailableUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: USD value of tokens available in the kvault
        tokensInvested:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Number of tokens invested in the kvault
        tokensInvestedUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: USD value of tokens invested in the kvault
        sharePrice:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Price per share of the kvault
        tokensPerShare:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Number of tokens per share in the kvault
        apy:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Annual Percentage Yield of the kvault
        apyTheoretical:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Theoretical Annual Percentage Yield of the kvault
        apyActual:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Actual Annual Percentage Yield of the kvault
        apyFarmRewards:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Annual Percentage Yield from farm rewards in the kvault
        apyIncentives:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Annual Percentage Yield from incentives in the kvault
        apyReservesIncentives:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Annual Percentage Yield from reserves incentives in the kvault
        numberOfHolders:
          type: number
          description: Number of holders of the kvault
        sharesIssued:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total shares issued by the kvault
        cumulativeInterestEarned:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative interest earned in the kvault token amount
        cumulativeInterestEarnedUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative interest earned in USD for the kvault
        cumulativeInterestEarnedSol:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative interest earned in SOL for the kvault
        interestEarnedPerSecond:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Interest earned per second in the kvault token amount
        interestEarnedPerSecondUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Interest earned per second in USD for the kvault
        interestEarnedPerSecondSol:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Interest earned per second in SOL for the kvault
        cumulativePerformanceFees:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative performance fees in the kvault token amount
        cumulativePerformanceFeesUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative performance fees in USD for the kvault
        cumulativePerformanceFeesSol:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative performance fees in SOL for the kvault
        cumulativeManagementFees:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative management fees in the kvault token amount
        cumulativeManagementFeesUsd:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative management fees in USD for the kvault
        cumulativeManagementFeesSol:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Cumulative management fees in SOL for the kvault
      required:
        - apy7d
        - apy24h
        - apy30d
        - apy90d
        - apy180d
        - apy365d
        - tokenPrice
        - solPrice
        - tokensAvailable
        - tokensAvailableUsd
        - tokensInvested
        - tokensInvestedUsd
        - sharePrice
        - tokensPerShare
        - apy
        - apyTheoretical
        - apyActual
        - apyFarmRewards
        - apyIncentives
        - apyReservesIncentives
        - numberOfHolders
        - sharesIssued
        - cumulativeInterestEarned
        - cumulativeInterestEarnedUsd
        - cumulativeInterestEarnedSol
        - interestEarnedPerSecond
        - interestEarnedPerSecondUsd
        - interestEarnedPerSecondSol
        - cumulativePerformanceFees
        - cumulativePerformanceFeesUsd
        - cumulativePerformanceFeesSol
        - cumulativeManagementFees
        - cumulativeManagementFeesUsd
        - cumulativeManagementFeesSol
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
    Apy:
      type: string
      description: >-
        APY in decimal format (not percentage) represented as string. Multiply
        by 100 to get percentage (%) - 0.1 in API response is 10%.
      example: '0.2'
      examples:
        - '0.123'
        - '0'
        - '1'
        - '1.23'
        - '-0.5'
        - '999999.999999'
    Decimal:
      type: string
      description: Decimal value represented as string
      example: '1234.56789'

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.