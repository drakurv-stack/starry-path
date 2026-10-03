---
name: UrgeWatch privacy boundary
description: Storage and upload constraints for camera-derived readings, urge labels, and support contacts.
---

Keep UrgeWatch readings, labels, estimator comparisons, optional reference pulse values, and support contact in browser storage. Process camera frames in memory and do not upload or persist raw frames. CSV export remains user-initiated. Do not move this feature to server-side storage or add synchronization unless the user asks.

VitalLens' local POS method is face-based, so keep it in a separate front-camera comparison mode; do not mix face results into the fingertip baseline. Do not use its hosted processing unless the user explicitly approves sending video off-device.

**Why:** The user asked to adapt the feature into Orbit without changing the existing storage stack; these records also contain sensitive health context.

**How to apply:** Future changes to UrgeWatch persistence, analytics, exports, or camera processing must preserve this browser-local boundary and keep camera modalities distinct unless the user explicitly approves a different data flow.