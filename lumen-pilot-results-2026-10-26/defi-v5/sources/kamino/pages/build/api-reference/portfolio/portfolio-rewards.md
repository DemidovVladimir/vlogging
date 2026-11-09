> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get pending farm rewards for a wallet

> Returns pending farm reward source rows across Kamino products. USD reward totals are composed on the client from price data.



## OpenAPI

````yaml kamino-api.json GET /portfolio/{pubkey}/rewards
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
  /portfolio/{pubkey}/rewards:
    get:
      tags:
        - Portfolio
      summary: Get pending farm rewards for a wallet
      description: >-
        Returns pending farm reward source rows across Kamino products. USD
        reward totals are composed on the client from price data.
      operationId: getPortfolioRewards
      parameters:
        - schema:
            $ref: '#/components/schemas/AddressBase58'
          required: true
          description: Valid base58-encoded address
          name: pubkey
          in: path
        - schema:
            type: string
            default: KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD
            description: KLend program ID
            example: KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD
          required: false
          description: KLend program ID
          name: programId
          in: query
        - schema:
            type: string
            pattern: ^\d+(,\d+)*$
            description: >-
              Comma-separated farm reward types to include. Defaults to 0,1 to
              match portfolio webapp rewards.
            example: 0,1
          required: false
          description: >-
            Comma-separated farm reward types to include. Defaults to 0,1 to
            match portfolio webapp rewards.
          name: rewardTypes
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              example:
                timestamp: '2026-06-12T11:16:12.684Z'
                farms:
                  - farm: A9nKRhBPVdQ2QDfzMkhpZzsAimCt59wSKxpo36bzhDiU
                    userState: JBhXSh6Zb5TPi8g6rsTpNjmuet4V7YGGtU3daou9Y2qs
                    delegatee: ARygwR6WBPvatQ2bBrSyytsyBgqrRDwxEuANWSSydfXW
                    strategy: HBuYwvq67VKnLyKxPzDjzskyRMk7ps39gwHdvaPGwdmQ
                    positionType: Liquidity
                    activeStakeAmount: '216.673457'
                    tokenMints:
                      - JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN
                      - bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1
                    rewards:
                      - mint: BLZEEuZUBVqFhj8adcCFPJvPVCiCyVmh3hkJMrU8KuJA
                        amount: '59.765598641'
                        index: 0
                        type: 0
                        tokenProgram: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
                  - farm: 9hUeaxTE3UsRFVt46NPDszSGW76gqDwK743SvJvjYUiY
                    userState: HkPCNqo1FRo41oiCwG8Kjsg664Jamsv8TE9kU7bqVP5S
                    delegatee: 5CVMEG7NSdEDVTPiz8efwL6zbXYSVEpkHovf54n2bvoZ
                    vault: NSSESC5s9Mk7uhUg7hdRiEeNaz7FQmZveJseF62Zjbc
                    positionType: Lend
                    activeStakeAmount: '0'
                    tokenMints:
                      - CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH
                    rewards:
                      - mint: CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH
                        amount: '0.446532'
                        index: 0
                        type: 0
                        tokenProgram: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
                  - farm: 3Dsn7mXKCxQ54QxDtogFsGqgMhhgWnVtN5MGLHvowh3E
                    userState: F8vs1tNCEdsvHB9ZgYCNRNnb2CbmDULEfQ68A6ZXHvwm
                    delegatee: 51rLRu3pvps8vWHVt6uSBeRgQ2UJgCPsw5TEdGsQSKkA
                    positionType: Borrow Markets
                    activeStakeAmount: '0'
                    tokenMints: []
                    rewards:
                      - mint: CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH
                        amount: '0.003248'
                        index: 0
                        type: 1
                        tokenProgram: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
              schema:
                $ref: '#/components/schemas/PortfolioRewardsResponse'
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
    PortfolioRewardsResponse:
      type: object
      properties:
        timestamp:
          type: string
          format: date-time
          description: Response timestamp as an ISO-8601 string
        farms:
          type: array
          items:
            $ref: '#/components/schemas/PortfolioFarmReward'
        partialErrors:
          $ref: '#/components/schemas/PortfolioRewardsPartialErrors'
      required:
        - timestamp
        - farms
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
    PortfolioFarmReward:
      type: object
      properties:
        farm:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Farm address
        userState:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: User state address used for claiming
        delegatee:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: >-
                Delegatee recorded on the user farm state, used to build claim
                instructions
        strategy:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Liquidity strategy associated with the farm, when applicable
        vault:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: KVault associated with the farm, when applicable
        positionType:
          type: string
          enum:
            - Liquidity
            - Lend
            - Borrow Markets
            - Multiply
            - Leverage
          description: Farm position type
          example: Lend
        activeStakeAmount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Active stake amount in farm
        tokenMints:
          type: array
          items:
            $ref: '#/components/schemas/AddressBase58'
          default: []
          description: >-
            Token mints identifying the position (e.g. tokenA+tokenB for
            liquidity)
        rewards:
          type: array
          items:
            $ref: '#/components/schemas/PortfolioRewardToken'
      required:
        - farm
        - userState
        - delegatee
        - positionType
        - activeStakeAmount
        - rewards
      description: Farm reward row; at most one of strategy or vault is present.
    PortfolioRewardsPartialErrors:
      type: object
      properties:
        positionTokenMints:
          type: array
          items:
            type: string
          description: >-
            Strategy or vault identifiers whose token mint enrichment could not
            be resolved
        seasonFarms:
          type: array
          items:
            type: string
          description: Season farm filter subcomponents that could not be loaded
        rewardMetadata:
          type: array
          items:
            type: string
          description: >-
            Farm reward rows whose SQL metadata was incomplete and could not be
            returned
    Decimal:
      type: string
      description: Decimal value represented as string
      example: '1234.56789'
    PortfolioRewardToken:
      type: object
      properties:
        mint:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Reward token mint
        amount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Pending reward amount
        index:
          type: integer
          description: Reward info index on the farm state used for claim instructions
          example: 0
        type:
          type: integer
          description: Farm reward type index used by farm rewards accounting
          example: 0
        tokenProgram:
          allOf:
            - $ref: '#/components/schemas/AddressBase58'
            - description: Token program ID for the reward token
      required:
        - mint
        - amount
        - index
        - type
        - tokenProgram

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.