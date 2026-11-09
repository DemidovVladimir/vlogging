> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get instructions to deposit into a kvault

> Instructions to deposit tokens into a specified Kamino Earn Vault. Additionally includes lookup tables to use to compress transaction size. An optional `memo` is added as an SPL memo instruction.



## OpenAPI

````yaml ktx-api.json POST /ktx/kvault/deposit-instructions
openapi: 3.1.0
info:
  title: Kamino Transactions API
  version: 1.0.0
servers:
  - url: https://api.kamino.finance
security: []
paths:
  /ktx/kvault/deposit-instructions:
    post:
      tags:
        - Kamino Earn Deposit
      summary: Get instructions to deposit into a kvault
      description: >-
        Instructions to deposit tokens into a specified Kamino Earn Vault.
        Additionally includes lookup tables to use to compress transaction size.
        An optional `memo` is added as an SPL memo instruction.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                wallet:
                  description: >-
                    User wallet address (base58) that will also sign the
                    transaction
                  format: solana-base58-address
                  minLength: 32
                  maxLength: 44
                  type: string
                  example: KUMtRazMP7vwvc2kthnGZ9Cq6ZsGRiYC97snMYepNx9
                kvault:
                  description: Target Kamino vault address
                  format: solana-base58-address
                  minLength: 32
                  maxLength: 44
                  type: string
                  example: HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E
                useStagingProgram:
                  description: >-
                    Optional. If omitted, the value is false. Set it to true to
                    target a vault owned by the staging kvault program instead
                    of the mainnet program.
                  type: boolean
                  example: true
                amount:
                  description: Amount to deposit (in decimal format, not lamports)
                  format: decimal-positive-amount
                  type: string
                  example: '0.1234'
                memo:
                  description: >-
                    The memo is optional. If provided, it must be non-empty and
                    at most 64 UTF-8 bytes. The API includes it in the deposit
                    transaction.
                  format: memo
                  minLength: 1
                  maxLength: 64
                  type: string
                skipFarm:
                  description: >-
                    Optional. If omitted, the value is false. Set it to true to
                    skip staking the received vault shares in the vault farm, so
                    the depositor keeps the shares in their wallet.
                  type: boolean
                  example: true
              required:
                - wallet
                - kvault
                - amount
        required: true
      responses:
        '200':
          description: Default Response
          content:
            application/json:
              schema:
                type: object
                properties:
                  instructions:
                    type: array
                    items:
                      type: object
                      properties:
                        accounts:
                          type: array
                          items:
                            type: object
                            properties:
                              address:
                                type: string
                              role:
                                type: string
                              signer:
                                type: object
                                properties:
                                  address:
                                    type: string
                                required:
                                  - address
                            required:
                              - address
                              - role
                            example:
                              address: 9y7uLMUMW6EiRwH1aJFSp9Zka7dVx2JdZKA3858u6YHT
                              role: WRITABLE_SIGNER
                              signer:
                                address: 9y7uLMUMW6EiRwH1aJFSp9Zka7dVx2JdZKA3858u6YHT
                        data:
                          anyOf:
                            - type: string
                            - type: 'null'
                          example: 8iPGiVLh8rYA4fUFAAAAAA==
                        programAddress:
                          type: string
                          example: KvauGMspG5k6rtzrqqn7WNn3oZdyKqLKwK2XWQ8FLjd
                      required:
                        - accounts
                        - data
                        - programAddress
                  lutsByAddress:
                    type: object
                    additionalProperties:
                      type: array
                      items:
                        description: Referenced LUT address
                        type: string
                    example:
                      9p2oT9J6BojHigd3V5qXzrwsQf4dtgMgLxtrzLVR3rwu:
                        - sadmBTQm5HJsyzWHEjV4YwG9CiahZKVDVqAyS4Wx1zH
                        - HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E
                        - EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
                required:
                  - instructions
                  - lutsByAddress
        '400':
          description: Default Response
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode:
                    description: HTTP error code
                    type: number
                    example: 400
                  message:
                    description: Error message describing the issue
                    type: string
                  error:
                    description: Short description of the http status code
                    type: string
                    example: Bad Request
                  code:
                    description: Kamino error code
                    anyOf:
                      - type: string
                        enum:
                          - DECIMAL_TO_LAMPORTS_OVERFLOW
                      - type: string
                        enum:
                          - KLEND_MARKET_NOT_FOUND
                      - type: string
                        enum:
                          - KLEND_OBLIGATION_NOT_FOUND
                      - type: string
                        enum:
                          - KLEND_RESERVE_NOT_FOUND
                      - type: string
                        enum:
                          - KVAULT_NOT_FOUND
                      - type: string
                        enum:
                          - TRANSACTION_SIZE_ERROR
                required:
                  - statusCode
                  - message
                  - error

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.