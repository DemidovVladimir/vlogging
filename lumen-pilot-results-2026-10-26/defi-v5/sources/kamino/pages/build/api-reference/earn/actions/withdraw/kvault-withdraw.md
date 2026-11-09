> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get transaction to withdraw from a kvault

> Withdraw tokens from a specified Kamino Earn Vault. An optional `memo` is added as an SPL memo instruction.



## OpenAPI

````yaml ktx-api.json POST /ktx/kvault/withdraw
openapi: 3.1.0
info:
  title: Kamino Transactions API
  version: 1.0.0
servers:
  - url: https://api.kamino.finance
security: []
paths:
  /ktx/kvault/withdraw:
    post:
      tags:
        - Kamino Earn Withdraw
      summary: Get transaction to withdraw from a kvault
      description: >-
        Withdraw tokens from a specified Kamino Earn Vault. An optional `memo`
        is added as an SPL memo instruction.
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
                  description: >-
                    Vault share amount in token units, not lamports. To withdraw
                    all shares, use the decimal string "18446744073709551615".
                  format: decimal-positive-amount
                  type: string
                  example: '0.1234'
                memo:
                  description: >-
                    The memo is optional. If provided, it must be non-empty and
                    at most 64 UTF-8 bytes. The API includes it in the vault
                    withdrawal transaction.
                  format: memo
                  minLength: 1
                  maxLength: 64
                  type: string
                closeUserState:
                  description: >-
                    Optional. If omitted, the value is false. Set it to true to
                    request user-state closure on a full withdrawal. Closure is
                    not guaranteed.
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
                  transaction:
                    description: >-
                      Base64-encoded unsigned transaction. Sign it before
                      submission.
                    type: string
                    example: >-
                      AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAEB4U90z775Z0G20Lzbx64AwbcGsJTUS+D6M2d1yQDvRL+MXyh2DY6ZPXvcFUmkblzqU7UrFcH4BAOPAPQXUWHKZS66KvlDTwMypF/H+icat/xVYNA0OvZ+RMaheXL0QJajAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD9ps6fZhmN2HDYqYbzBnXEb4Pi9Sg0h5UvXVBWPj73qMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WQTZCvHbiTnsNf+U2WQNV9zDJ5S7Phu2b9OuhJqE3NuUsuvLnkdJfjUAGox8/57aeYKvmQtCaruy3qoGNzwovloCBQYAAQAHAxEBAQYRAAsIDw0HAgEQEREEBgoJDgwQ8iPGiVLh8rYA4fUFAAAAAAGC6dRmw0Z9LrKw2cy+tHvb9JXuHBu0d9Dar60DX6fr5AUFLxMJAQYVBAsCBwM=
                required:
                  - transaction
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