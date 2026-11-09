> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get user KLend rewards

> Fetches KLend reward data for a specific user and points source



## OpenAPI

````yaml kamino-api.json GET /klend/users/{pubkey}/rewards
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
  /klend/users/{pubkey}/rewards:
    get:
      tags:
        - Kamino Lend Yield
      summary: Get user KLend rewards
      description: Fetches KLend reward data for a specific user and points source
      parameters:
        - schema:
            $ref: '#/components/schemas/AddressBase58'
          required: true
          description: Valid base58-encoded address
          name: pubkey
          in: path
        - schema:
            type: string
            description: Points source identifier
            example: Season1
            examples:
              - Season1
              - Season2
              - Season3
              - Season4
          required: false
          description: Points source identifier
          name: source
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/KlendUserRewardMetrics'
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
    KlendUserRewardMetrics:
      type: object
      properties:
        avgBaseApy:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Weighted average Base Annual Percentage Yield for the user
        avgBoostedApy:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Weighted average Boosted Annual Percentage Yield for the user
        avgMaxApy:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Weighted average Max Annual Percentage Yield for the user
        rewards:
          type: array
          items:
            $ref: '#/components/schemas/KlendUserRewardMetric'
          description: List of klend user reward metrics
      required:
        - avgBaseApy
        - avgBoostedApy
        - avgMaxApy
        - rewards
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
    KlendUserRewardMetric:
      type: object
      properties:
        depositReserve:
          anyOf:
            - $ref: '#/components/schemas/AddressBase58'
            - type: 'null'
          description: Deposit reserve public key, if applicable
        borrowReserve:
          anyOf:
            - $ref: '#/components/schemas/AddressBase58'
            - type: 'null'
          description: Borrow reserve public key, if applicable
        market:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Market public key
        rewardMint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Mint address of the reward token
        lastCalculated:
          type: string
          format: date-time
          description: Timestamp of the last calculation
        tokensEarned:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total number of reward tokens earned by the user
        tokensPerSecond:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Number of reward tokens distributed per second to the user
        stakingBoost:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Staking boost percentage applied to the user
        effectiveStakingBoost:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Effective staking boost percentage for the user
        baseApy:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Base Annual Percentage Yield from rewards for the user
        boostedApy:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Boosted Annual Percentage Yield from rewards for the user
        maxApy:
          allOf:
            - $ref: '#/components/schemas/Apy'
            - description: Max Annual Percentage Yield from rewards for the user
        usdAmount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Total USD amount of rewards earned by the user without boost
        usdAmountBoosted:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: >-
                Total USD amount of rewards earned by the user with boost
                applied
      required:
        - depositReserve
        - borrowReserve
        - market
        - rewardMint
        - lastCalculated
        - tokensEarned
        - tokensPerSecond
        - stakingBoost
        - effectiveStakingBoost
        - baseApy
        - boostedApy
        - maxApy
        - usdAmount
        - usdAmountBoosted
    Decimal:
      type: string
      description: Decimal value represented as string
      example: '1234.56789'

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.