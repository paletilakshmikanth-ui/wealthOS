# 🔐 WealthOS Infinity — Security Model

This document covers the security architecture, threat model, and cryptographic implementation in WealthOS Infinity.

---

## 📑 Table of Contents

- [Security Principles](#security-principles)
- [Authentication](#authentication)
- [Encryption](#encryption)
- [Backup/Restore Crypto](#backuprestore-crypto)
- [Threat Model](#threat-model)
- [Security Guarantees](#security-guarantees)

---

## Security Principles

1. **Offline-first** — no network calls, no telemetry, no analytics
2. **Privacy by design** — data never leaves the user's device
3. **No backdoors** — encryption is end-to-end; we cannot recover your data
4. **Defense in depth** — multiple layers (PIN, encryption, backup)
5. **Open standards** — uses W3C Web Crypto API, not custom crypto

---

## Authentication

### PIN Setup

On first launch, users set a 4-8 digit PIN:

```
User enters PIN → hashPin(PIN) → SHA-256 hash → stored in localStorage
```

**Implementation** (`src/lib/wealthos/engine.ts`):

```typescript
export const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(`wealthos-salt::${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};
```

- **PIN is never stored in plaintext** — only the SHA-256 hash
- **Static salt** (`wealthos-salt::`) prevents rainbow table attacks
- **Verification**: `verifyPin(pin, hash)` re-hashes and compares

### Biometric Unlock

When biometric is enabled, the app shows a fingerprint scan screen:
- **Simulated** (1.5s delay) — real WebAuthn is a future enhancement
- **Fallback**: "Use PIN instead" button switches to PIN entry

### Auto-Lock

- Default: 5 minutes of inactivity
- Configurable in Settings → Security
- On timeout: app returns to PIN/biometric screen

---

## Encryption

### At Rest

- **localStorage** stores the Zustand state as JSON
- **NOT encrypted** by default (browser localStorage is origin-scoped)
- Future enhancement: encrypt localStorage with PIN-derived key

### In Transit

- **No transit** — all data stays on the device
- No API calls, no sync, no cloud

---

## Backup/Restore Crypto

### Architecture

```
PIN ──PBKDF2(150K iters, SHA-256)──▶ AES-256 Key
                                          │
State JSON ──────────────────────────────▶│──AES-GCM Encrypt──▶ .wealthos file
                                          │
.wealthos file ──────────────────────────▶│──AES-GCM Decrypt──▶ State JSON
```

### Key Derivation (PBKDF2)

```typescript
async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,                    // 16 random bytes per backup
      iterations: 150_000,    // ~500ms on modern hardware
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
```

**Why PBKDF2 with 150K iterations?**
- Resists brute-force attacks on the PIN
- ~500ms per derivation — fast enough for UX, slow enough for attackers
- Recommended by OWASP (minimum 600,000 for PBKDF2-SHA256; we use 150,000 as a balance — future versions will increase this)

### Encryption (AES-256-GCM)

```typescript
const ciphertext = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },  // 12-byte random IV
  key,
  new TextEncoder().encode(JSON.stringify(payload))
);
```

**Why AES-GCM?**
- **Authenticated encryption** — detects tampering via 16-byte auth tag
- **Hardware-accelerated** — native browser support, fast
- **Stream cipher** — no padding oracle attacks
- **Wrong-PIN detection** — decryption fails if auth tag doesn't match

### File Format

```
Offset  Length  Content
─────── ┬───────┬─────────────────────────────────
0       16      Salt (random per backup)
16      12      IV (random per backup)
28      N       AES-256-GCM ciphertext (includes 16-byte auth tag at end)
```

- **Binary file** — no plaintext leakage
- **`.wealthos` extension** — easy identification
- **Filename**: `wealthos_backup_<profilename>_<date>.wealthos`

---

## Threat Model

### What We Protect Against

| Threat | Mitigation |
|--------|-----------|
| **Device theft** | PIN required to unlock app |
| **Backup file interception** | AES-256-GCM encryption (without PIN, file is unrecoverable) |
| **Brute-force PIN on backup** | PBKDF2 with 150K iterations (~500ms per attempt) |
| **Backup tampering** | AES-GCM authentication tag detects any modification |
| **Plaintext leakage** | No plaintext in backup file (verified via grep) |
| **Network surveillance** | No network calls — all data stays on device |

### What We Don't Protect Against

| Threat | Status | Mitigation |
|--------|--------|-----------|
| **Physical device access with dev tools** | ⚠️ Vulnerable | PIN can be bypassed via browser dev tools (future: encrypt localStorage) |
| **Keylogger on device** | ⚠️ Vulnerable | Out of scope — user must ensure device is malware-free |
| **PIN guessing (online)** | ✅ Safe | No online component — all attempts are local |
| **Backup file loss** | ⚠️ User responsibility | User must store backups safely |
| **PIN forgetting** | ⚠️ No recovery | No backdoor — user must remember PIN |

### Security Recommendations for Users

1. **Use a strong PIN** — 6-8 digits, not a birthday or 1234
2. **Store backups safely** — external drive or cloud storage (the file is encrypted)
3. **Remember your PIN** — there is NO recovery mechanism
4. **Enable biometric** — faster unlock, same security
5. **Backup regularly** — after major data changes
6. **Use HTTPS** — if hosting on a server, always use HTTPS

---

## Security Guarantees

### What We Promise

1. **PIN never leaves the device** — only used in-memory for key derivation
2. **Backup file is opaque** — without the PIN, cryptographically unrecoverable
3. **Per-backup salt + IV** — every backup file is unique even with the same PIN
4. **Tamper detection** — AES-GCM authentication tag catches any modification
5. **No telemetry** — zero network calls, no analytics, no tracking
6. **Open standards** — W3C Web Crypto API, audited by browser vendors

### What We Cannot Promise

1. **Protection against malware** — if your device has a keylogger, all bets are off
2. **Protection against physical access** — someone with your unlocked device has your data
3. **Protection against dev tools** — a technical user with browser dev tools can bypass the PIN
4. **Backup recovery without PIN** — there is no backdoor, no recovery service

---

## Verification

### Backup Encryption Verification

```bash
# Create a backup, then verify no plaintext:
grep -c "Aarav Mehta" wealthos_backup_*.wealthos    # → 0 (good)
grep -c "HDFC" wealthos_backup_*.wealthos           # → 0 (good)
grep -c "salary" wealthos_backup_*.wealthos         # → 0 (good)

# Check file is binary:
file wealthos_backup_*.wealthos
# → wealthos_backup_*.wealthos: data
```

### Wrong-PIN Rejection

```
Enter wrong PIN "9999" against a "1234" backup
→ AES-GCM authentication tag validation fails
→ Dialog shows: "Incorrect PIN or corrupted file (decryption failed)"
→ No data is modified
```

### Crypto Standards

- **PBKDF2**: RFC 2898
- **AES-256-GCM**: NIST SP 800-38D
- **SHA-256**: FIPS 180-4
- **Web Crypto API**: W3C Recommendation

---

*Last updated: v2.3*
