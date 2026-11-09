> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get transaction to deposit into a klend reserve

> Deposit tokens into the specified Kamino Lend market reserve. An optional `memo` is added to the transaction as an SPL memo instruction.



## OpenAPI

````yaml ktx-api.json POST /ktx/klend/deposit
openapi: 3.1.0
info:
  title: Kamino Transactions API
  version: 1.0.0
servers:
  - url: https://api.kamino.finance
security: []
paths:
  /ktx/klend/deposit:
    post:
      tags:
        - Kamino Lend Deposit
      summary: Get transaction to deposit into a klend reserve
      description: >-
        Deposit tokens into the specified Kamino Lend market reserve. An
        optional `memo` is added to the transaction as an SPL memo instruction.
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
                market:
                  description: Target Kamino Lend market address
                  format: solana-base58-address
                  minLength: 32
                  maxLength: 44
                  type: string
                  example: 7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF
                reserve:
                  description: >-
                    Target Kamino Lend Reserve address. The reserve must belong
                    to the specified market
                  format: solana-base58-address
                  minLength: 32
                  maxLength: 44
                  type: string
                  example: D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59
                amount:
                  description: >-
                    Amount of liquidity token to deposit (in decimal format, not
                    lamports)
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
              required:
                - wallet
                - market
                - reserve
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