---
name: Partner access boundary
description: Security assumptions for Orbit accountability partner invitations and approvals.
---

Orbit's current MVP has no real user authentication. Partner invitation URLs therefore act as bearer credentials: anyone who possesses a link can accept the invitation, see opt-in shared notes and notifications, and respond to approval requests.

**Why:** The current app retains a single mock user identity, so a verified partner account cannot be bound to an invitation yet. The private link supports a working prototype without pretending the recipient has been authenticated.

**How to apply:** Keep invite links high-entropy, avoid logging them or API response bodies, and require verified partner identity plus relationship authorization before treating this flow as production parental control.