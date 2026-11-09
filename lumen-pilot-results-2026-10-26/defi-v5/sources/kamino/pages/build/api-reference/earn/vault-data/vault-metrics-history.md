> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get historical KVault metrics

> Get historical Kamino Earn Vault metrics for a given vault, between an optional range of dates



## OpenAPI

````yaml kamino-api.json GET /kvaults/vaults/{pubkey}/metrics/history
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
  /kvaults/vaults/{pubkey}/metrics/history:
    get:
      tags:
        - Kamino Earn Vaults
      summary: Get historical KVault metrics
      description: >-
        Get historical Kamino Earn Vault metrics for a given vault, between an
        optional range of dates
      parameters:
        - schema:
            $ref: '#/components/schemas/AddressBase58'
          required: true
          description: Valid base58-encoded address
          name: pubkey
          in: path
        - schema:
            anyOf:
              - type: string
              - type: number
            default: '1970-01-01T00:00:00.000Z'
            description: >-
              Start date of the range (defaults to Unix epoch). Accepts ISO
              string or epoch in ms.
            examples:
              - '1970-01-01T00:00:00.000Z'
              - 0
          required: false
          description: >-
            Start date of the range (defaults to Unix epoch). Accepts ISO string
            or epoch in ms.
          name: start
          in: query
        - schema:
            anyOf:
              - type: string
              - type: number
            description: >-
              End date of the range (defaults to current time). Accepts ISO
              string or epoch in ms.
            examples:
              - '2025-01-01T00:00:00.000Z'
              - 1735689600000
          required: false
          description: >-
            End date of the range (defaults to current time). Accepts ISO string
            or epoch in ms.
          name: end
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    timestamp:
                      $ref: '#/components/schemas/SnapshotDateTime'
                    tvl:
                      allOf:
                        - $ref: '#/components/schemas/Decimal'
                        - description: Total Value Locked in token denomination
                    solTvl:
                      allOf:
                        - $ref: '#/components/schemas/Decimal'
                        - description: Total Value Locked in SOL
                    apy:
                      allOf:
                        - $ref: '#/components/schemas/Apy'
                        - description: Annual Percentage Yield
                    apyTheoretical:
                      allOf:
                        - $ref: '#/components/schemas/Apy'
                        - description: Theoretical Annual Percentage Yield
                    apyActual:
                      allOf:
                        - $ref: '#/components/schemas/Apy'
                        - description: Actual Annual Percentage Yield
                    apyFarmRewards:
                      allOf:
                        - $ref: '#/components/schemas/Apy'
                        - description: Annual Percentage Yield from Farm Rewards
                    apyReservesIncentives:
                      allOf:
                        - $ref: '#/components/schemas/Apy'
                        - description: Annual Percentage Yield from Reserves Incentives
                    apyIncentives:
                      allOf:
                        - $ref: '#/components/schemas/Apy'
                        - description: Annual Percentage Yield from Incentives
                    sharePrice:
                      allOf:
                        - $ref: '#/components/schemas/Decimal'
                        - description: Share Price of the vault
                    interest:
                      allOf:
                        - $ref: '#/components/schemas/Decimal'
                        - description: Interest earned in token denomination
                    interestUsd:
                      allOf:
                        - $ref: '#/components/schemas/Decimal'
                        - description: Interest earned in USD
                    interestSol:
                      allOf:
                        - $ref: '#/components/schemas/Decimal'
                        - description: Interest earned in SOL
                    reserves:
                      type: array
                      items:
                        type: object
                        properties:
                          pubkey:
                            allOf:
                              - $ref: '#/components/schemas/AddressBase58'
                              - description: Public key of the reserve
                          supplyApy:
                            allOf:
                              - $ref: '#/components/schemas/Apy'
                              - description: Supply Annual Percentage Yield
                          rewardsApy:
                            allOf:
                              - $ref: '#/components/schemas/Apy'
                              - description: Rewards Annual Percentage Yield
                          allocationRatio:
                            allOf:
                              - $ref: '#/components/schemas/Decimal'
                              - description: Allocation Ratio
                          rewardTokens:
                            type: array
                            items:
                              type: object
                              properties:
                                tokenMint:
                                  allOf:
                                    - $ref: '#/components/schemas/AddressBase58'
                                    - description: Token mint address
                                apy:
                                  allOf:
                                    - $ref: '#/components/schemas/Apy'
                                    - description: >-
                                        Annual Percentage Yield for the reward
                                        token
                              required:
                                - tokenMint
                                - apy
                            description: List of reward tokens for the reserve
                        required:
                          - pubkey
                          - supplyApy
                          - rewardsApy
                          - allocationRatio
                          - rewardTokens
                      description: List of reserves with rewards
                    vaultRewards:
                      type: array
                      items:
                        type: object
                        properties:
                          tokenMint:
                            allOf:
                              - $ref: '#/components/schemas/AddressBase58'
                              - description: Token mint address
                          apy:
                            allOf:
                              - $ref: '#/components/schemas/Apy'
                              - description: >-
                                  Annual Percentage Yield for the vault reward
                                  token
                        required:
                          - tokenMint
                          - apy
                      description: List of vault reward tokens
                  required:
                    - timestamp
                    - tvl
                    - solTvl
                    - apy
                    - apyTheoretical
                    - apyActual
                    - apyFarmRewards
                    - apyReservesIncentives
                    - apyIncentives
                    - sharePrice
                    - interest
                    - interestUsd
                    - interestSol
                    - reserves
                    - vaultRewards
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
    SnapshotDateTime:
      type: string
      format: date-time
      description: Timestamp when the snapshot was created (ISO 8601 format)
      example: '2025-03-01T12:00:00.000Z'
    Decimal:
      type: string
      description: Decimal value represented as string
      example: '1234.56789'
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

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.