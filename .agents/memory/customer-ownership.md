---
name: Customer ownership model
description: Authentication and ownership decision for customer digital products, especially Absensi Toko.
---

Customer accounts use a separate email/password session from the existing admin password session. Passwords are hashed server-side with Node's built-in scrypt; the browser's anonymous localStorage session ID is not an identity or authorization mechanism.

`ABSENSI TOKO` access is granted only when a confirmed order is linked to the authenticated customer. Every Absensi endpoint requires the customer session and resolves records through the store owner, so IDs or shared URLs cannot cross account boundaries.

**Why:** The original storefront had only admin auth and anonymous customer checkout. Using email, order ID, or localStorage session IDs for ownership would let another person access a customer's attendance records.

**How to apply:** Any future customer-owned product must link the order to `customerUserId`, gate entitlement on the existing confirmed status, and perform backend ownership checks on every read/write/delete endpoint.