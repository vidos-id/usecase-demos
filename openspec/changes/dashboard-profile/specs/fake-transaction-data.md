# fake-transaction-data

## ADDED Requirements

### Requirement: Fake transaction generator
The system SHALL provide a function to generate fake transaction data for demo purposes.

#### Scenario: Transaction data structure
- **WHEN** fake transactions are generated
- **THEN** each transaction includes date, merchant, amount, and currency fields

#### Scenario: Transaction count
- **WHEN** fake transactions are requested
- **THEN** the system returns 2-3 transactions for display

### Requirement: Realistic transaction data
The system SHALL use realistic merchant names and amounts for demo transactions.

#### Scenario: Merchant names
- **WHEN** fake transactions are generated
- **THEN** merchant names represent realistic businesses (e.g., "Supermart", "Coffee Corner", "Salary Deposit")

#### Scenario: Transaction amounts
- **WHEN** fake transactions are generated
- **THEN** amounts are realistic values in EUR currency

#### Scenario: Debit transactions
- **WHEN** a transaction is a debit (expense)
- **THEN** the amount is negative (e.g., -45.20)

#### Scenario: Credit transactions
- **WHEN** a transaction is a credit (income)
- **THEN** the amount is positive (e.g., 3200.00)

### Requirement: Transaction date formatting
The system SHALL include properly formatted dates for transactions.

#### Scenario: Date format
- **WHEN** fake transactions are generated
- **THEN** dates are in YYYY-MM-DD format (e.g., "2026-02-10")

#### Scenario: Recent dates
- **WHEN** fake transactions are generated
- **THEN** dates represent recent transactions (within the last few days)

### Requirement: Static demo data
The system SHALL use a static array of transactions rather than randomized generation.

#### Scenario: Consistent data
- **WHEN** fake transactions are requested multiple times
- **THEN** the same transaction data is returned each time

#### Scenario: User-independent data
- **WHEN** different users view transactions
- **THEN** all users see identical transaction data
