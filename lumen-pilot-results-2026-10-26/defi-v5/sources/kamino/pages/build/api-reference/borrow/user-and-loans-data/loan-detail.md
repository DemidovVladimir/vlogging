> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get information about a loan (obligation)

> Fetches information about a loan



## OpenAPI

````yaml kamino-api.json GET /klend/loans/{pubkey}
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
  /klend/loans/{pubkey}:
    get:
      tags:
        - Kamino Lend User Loans
      summary: Get information about a loan (obligation)
      description: Fetches information about a loan
      parameters:
        - schema:
            $ref: '#/components/schemas/AddressBase58'
          required: true
          description: Valid base58-encoded address
          name: pubkey
          in: path
        - schema:
            type: string
            enum:
              - mainnet-beta
              - devnet
              - localnet
            default: mainnet-beta
            description: Solana cluster environment
            example: mainnet-beta
          required: false
          description: Solana cluster environment
          name: env
          in: query
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoanInfo'
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
        '422':
          description: Unprocessable Entity
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: >-
                      Error message describing why the request could not be
                      processed
                    example: The requested calculation is not supported for this asset
                required:
                  - error
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '503':
          description: Service Unavailable
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                required:
                  - error
components:
  schemas:
    AddressBase58:
      type: string
      description: Valid base58-encoded address
      example: VEG1EMtttdHunMbSza8uoms1R18VXmYSph2bBpHcSJd
    LoanInfo:
      type: object
      properties:
        loanId:
          type: string
          description: The loan (obligation) public key
          example: wGzt1J5Nr182HHqAc1zsfD9SLoe1MJb25VWih5NRY
        marketId:
          type: string
          description: The market public key
          example: 6HT16972HHiY4RM33GfUc22pHZ3VLDPpXFWhQ7XJzA
        user:
          type: string
          description: The loan owner public key
          example: 7yexZcPbepXgWw3Cxc7YB2eLaxwyuyshRbAF8XHDi2g
        timestamp:
          type: number
          description: UTC timestamp when this report was produced
          example: 1760707165421
        solanaSlot:
          type: number
          description: Solana slot when this report was produced
          example: 373973788
        elevationGroup:
          type: number
          description: >-
            The elevation group assigned to this obligation for isolation of
            risks
          example: 0
        leverage:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Current leverage ratio of the position
              example: '0.5'
        loanInfo:
          type: object
          properties:
            collateral:
              type: object
              properties:
                deposits:
                  type: array
                  items:
                    $ref: '#/components/schemas/LoanDepositInfo'
                  description: Array of collateral deposits
              required:
                - deposits
            debt:
              type: object
              properties:
                borrows:
                  type: array
                  items:
                    $ref: '#/components/schemas/LoanBorrowInfo'
                  description: Array of debt borrows
              required:
                - borrows
            currentLtv:
              type: number
              description: >-
                Current loan-to-value ratio (debt value × borrow factor /
                collateral value); liquidate when >= liquidationLtv
              example: 0.0554213869045533
            maxLtv:
              type:
                - number
                - 'null'
              description: >-
                weighted average max LTV from all the collateral reserves (risks
                actions borrows or withdrawals are blocked when userLtv >=
                maxLtv)
              example: 0.74
            liquidationLtv:
              type: number
              description: LTV threshold when liquidation occurs
              example: 0.75
            closeFactor:
              type: number
              description: >-
                Maximum percentage of total debt that can be repaid in a single
                liquidation
              example: 0.1
          required:
            - collateral
            - debt
            - currentLtv
            - maxLtv
            - liquidationLtv
            - closeFactor
      required:
        - loanId
        - marketId
        - user
        - timestamp
        - solanaSlot
        - elevationGroup
        - leverage
        - loanInfo
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
    LoanDepositInfo:
      type: object
      properties:
        tokenMint:
          type: string
          description: The token mint address
          example: So11111111111111111111111111111111111111112
        tokenName:
          type: string
          description: The token name/symbol from the reserve
          example: SOL
        tokenAmount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Token amount in decimal format (not lamports)
              example: '0.0100002082771212'
        tokenValue:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: USD value (tokenAmount × tokenPrice)
              example: '1.80421579010444'
        maxLtv:
          type: number
          description: Maximum loan-to-value ratio for this collateral reserve
          example: 0.74
        liquidationLtv:
          type: number
          description: Liquidation threshold LTV for this collateral reserve
          example: 0.75
        maxWithdrawableAmount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: >-
                Maximum token amount (decimals) that can be withdrawn while
                currentLtv <= maxLtv
              example: '51225.5590659256'
        maxWithdrawableValue:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: >-
                Maximum USD value that can be withdrawn while currentLtv <=
                maxLtv
              example: '9242003.76257327'
        tokenPrice:
          type: number
          description: Latest price from the oracle
          example: 180.41782132
      required:
        - tokenMint
        - tokenName
        - tokenAmount
        - tokenValue
        - maxLtv
        - liquidationLtv
        - maxWithdrawableAmount
        - maxWithdrawableValue
        - tokenPrice
    LoanBorrowInfo:
      type: object
      properties:
        tokenMint:
          type: string
          description: The token mint address
          example: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
        tokenName:
          type: string
          description: The token name/symbol
          example: USDC
        tokenAmount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Token amount in decimal format
              example: '0.100002775657846'
        tokenValue:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: USD value (tokenAmount × tokenPrice)
              example: '0.0999921413626825'
        maxBorrowableAmount:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: Maximum amount that can be borrowed while currentLtv <= maxLtv
              example: '1.30084031718889'
        maxBorrowableValue:
          allOf:
            - $ref: '#/components/schemas/Decimal'
            - description: >-
                Maximum USD value that can be borrowed while currentLtv <=
                maxLtv
              example: '1.30070198582957'
        tokenPrice:
          type: number
          description: Latest price from the oracle
          example: 0.99989366
        borrowFactor:
          type: number
          description: >-
            Extra weight given to debt token in LTV calculation (debt value is
            multiplied by this factor))
          example: 1
      required:
        - tokenMint
        - tokenName
        - tokenAmount
        - tokenValue
        - maxBorrowableAmount
        - maxBorrowableValue
        - tokenPrice
        - borrowFactor

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.