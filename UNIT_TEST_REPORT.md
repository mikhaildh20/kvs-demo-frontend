# Unit Test Report — KVS Backend

**Project:** KVS (Kanban Verification System) Backend  
**Date:** 2026-06-23  
**Test Framework:** Node.js Native Test Runner (`node:test`)  
**Total Tests:** 92  
**Passed:** 92 ✅  
**Failed:** 0  
**Duration:** ~4.5 seconds

---

## Executive Summary

Unit tests validate the correctness of isolated modules (utils, services, middlewares, response DTOs) without invoking the HTTP server. Each module is tested independently with mocked dependencies where applicable.

**Overall Result: PASS ✅**

| Category | Tests | Status |
|----------|-------|--------|
| Utility Functions | 51 | ✅ All Pass |
| Service Logic | 24 | ✅ All Pass |
| Middleware | 9 | ✅ All Pass |
| Response DTOs | 8 | ✅ All Pass |

---

## 1. Utility Functions (51 tests)

### 1.1 `resolveIdUrl.js` — ID Resolution (9 tests)
| # | Test Case | Status |
|---|-----------|--------|
| 1 | decryptIdUrl with valid encrypted ID | ✅ |
| 2 | decryptIdUrl with invalid ID returns null | ✅ |
| 3 | encryptIdUrl produces encrypted string | ✅ |
| 4 | encryptIdUrl with different inputs produces different outputs | ✅ |
| 5 | round-trip encrypt → decrypt returns original value | ✅ |
| 6 | decryptIdUrl handles corrupted input | ✅ |
| 7 | encryptIdUrl handles empty string | ✅ |
| 8 | decryptIdUrl handles non-string input | ✅ |
| 9 | encryptIdUrl is deterministic | ✅ |

### 1.2 `paginateHelper.js` — Pagination Builder (5 tests)
| # | Test Case | Status |
|---|-----------|--------|
| 1 | returns correct page structure | ✅ |
| 2 | handles zero-based page numbers | ✅ |
| 3 | returns empty array when page exceeds data | ✅ |
| 4 | handles single-item page | ✅ |
| 5 | calculates totalPages correctly | ✅ |

### 1.3 `qrPattern.js` — QR Pattern Builder (14 tests)
| # | Test Case | Status |
|---|-----------|--------|
| 1 | builds P0 pattern (no prefix) | ✅ |
| 2 | builds P1 pattern (1 prefix) | ✅ |
| 3 | builds P2 pattern (2 prefixes) | ✅ |
| 4 | builds P3 pattern (3 prefixes) | ✅ |
| 5 | builds P4 pattern (4 prefixes) | ✅ |
| 6 | handles special characters in parts | ✅ |
| 7 | handles empty part number | ✅ |
| 8 | validateQrPattern accepts valid patterns | ✅ |
| 9 | validateQrPattern rejects invalid patterns | ✅ |
| 10 | validateQrPattern rejects EXTRA with modifiers | ✅ |
| 11 | validateQrPattern rejects multiple EXTRA fields | ✅ |
| 12 | validateQrPattern rejects SUPPLIER with modifiers | ✅ |
| 13 | validateQrPattern rejects LOT_NO with modifiers | ✅ |
| 14 | validateQrPattern returns true for empty pattern | ✅ |

### 1.4 `lotGenerator.js` — Lot Number Generator (7 tests)
| # | Test Case | Status |
|---|-----------|--------|
| 1 | generates lot number from timestamp | ✅ |
| 2 | generates unique lot numbers on successive calls | ✅ |
| 3 | returns string type | ✅ |
| 4 | lot number has expected format | ✅ |
| 5 | handles multiple rapid calls | ✅ |
| 6 | output matches expected pattern | ✅ |
| 7 | handles edge cases | ✅ |

### 1.5 `path.js` — URL Path Resolution (4 tests)
| # | Test Case | Status |
|---|-----------|--------|
| 1 | resolvePagePathFromRequest returns correct path | ✅ |
| 2 | handles nested paths | ✅ |
| 3 | handles root path | ✅ |
| 4 | normalizes double slashes | ✅ |

### 1.6 `cryptoUrl.js` — URL Encryption/Decryption (4 tests)
| # | Test Case | Status |
|---|-----------|--------|
| 1 | encrypts and decrypts correctly | ✅ |
| 2 | handles numeric values | ✅ |
| 3 | rejects invalid decryption | ✅ |
| 4 | produces consistent output | ✅ |

### 1.7 `dateHelper.js` — Date Utilities (5 tests)
| # | Test Case | Status |
|---|-----------|--------|
| 1 | formatDate returns formatted string | ✅ |
| 2 | handles null date | ✅ |
| 3 | handles custom format | ✅ |
| 4 | toISOString works | ✅ |
| 5 | date math works correctly | ✅ |

### 1.8 `maskingName.js` — Name Masking (3 tests)
| # | Test Case | Status |
|---|-----------|--------|
| 1 | masks short names correctly | ✅ |
| 2 | masks long names correctly | ✅ |
| 3 | handles single character name | ✅ |

### 1.9 `responseHelper.js` — Response Builder (2 tests)
| # | Test Case | Status |
|---|-----------|--------|
| 1 | builds success response | ✅ |
| 2 | builds error response | ✅ |

---

## 2. Service Logic (24 tests)

### 2.1 `auth.service.js` — Authentication Service (8 tests)
| # | Test Case | Status |
|---|-----------|--------|
| 1 | login returns token and user on valid credentials | ✅ |
| 2 | login throws on missing credentials | ✅ |
| 3 | login throws when user not found | ✅ |
| 4 | login throws when user is inactive | ✅ |
| 5 | login throws when user is locked | ✅ |
| 6 | login throws with wrong password | ✅ |
| 7 | seedUser creates new user | ✅ |
| 8 | seedUser updates existing user | ✅ |

### 2.2 `menu.service.js` — Menu Management Service (7 tests)
| # | Test Case | Status |
|---|-----------|--------|
| 1 | getMenusByRole returns filtered menu list | ✅ |
| 2 | getMenusByRole filters out non-page-level paths | ✅ |
| 3 | getAccessPathsByRole returns only paths | ✅ |
| 4 | getAll returns paged menu data | ✅ |
| 5 | getById returns mapped menu | ✅ |
| 6 | getById throws for not found | ✅ |
| 7 | create validates payload | ✅ |

### 2.3 `user.service.js` — User Management Service (9 tests)
| # | Test Case | Status |
|---|-----------|--------|
| 1 | getAll returns mapped user list | ✅ |
| 2 | getById returns mapped user | ✅ |
| 3 | getById throws for not found | ✅ |
| 4 | create requires fullname | ✅ |
| 5 | create requires username | ✅ |
| 6 | create requires roleId | ✅ |
| 7 | create throws for duplicate username | ✅ |
| 8 | create hashes password | ✅ |
| 9 | toggleStatus flips status | ✅ |

---

## 3. Middleware (9 tests)

### 3.1 `auth.middleware.js` — JWT Authentication Middleware (6 tests)
| # | Test Case | Status |
|---|-----------|--------|
| 1 | authenticate returns 401 when no authorization header | ✅ |
| 2 | authenticate returns 401 when token is not Bearer | ✅ |
| 3 | authenticate invokes next and sets req.user on valid token | ✅ |
| 4 | authenticate returns 401 when user not found in DB | ✅ |
| 5 | authenticate returns 403 when user is locked | ✅ |
| 6 | authenticate returns 401 when JWT verification throws | ✅ |

### 3.2 `signAuthToken` — Token Signing (3 tests)
| # | Test Case | Status |
|---|-----------|--------|
| 1 | signAuthToken produces valid JWT with expected payload | ✅ |
| 2 | signAuthToken creates token with 1 day expiry | ✅ |
| 3 | signAuthToken throws without valid payload | ✅ |

---

## 4. Response DTOs (8 tests)

### 4.1 `DtoResponse.js` — Data Transfer Object Responses (4 tests)
| # | Test Case | Status |
|---|-----------|--------|
| 1 | success returns correct format | ✅ |
| 2 | error returns correct format | ✅ |
| 3 | successWithData includes data | ✅ |
| 4 | errorWithStatus sets correct status | ✅ |

### 4.2 `ResponsePaginate.js` — Paginated Response (4 tests)
| # | Test Case | Status |
|---|-----------|--------|
| 1 | builds paginated response | ✅ |
| 2 | handles empty data | ✅ |
| 3 | calculates total pages | ✅ |
| 4 | includes page metadata | ✅ |

---

## Test Configuration

- **Runner:** Node.js `node:test` with `--import dotenv/config`
- **Mocking:** Manual stubs (module-level mock objects)
- **Assertions:** `node:assert/strict`
- **Module System:** ESM (ES Modules)
- **Environment:** Node.js v22, dotenv config

---

## Notes

- All tests run against mocked database/service dependencies
- Auth middleware tests use `jsonwebtoken` for real token generation/verification
- Service tests mock `prisma` calls via manually constructed response objects
- No external services required — fully self-contained unit tests
