// ============================================================
// WealthOS Infinity — Encrypted Backup & Restore
// Uses Web Crypto API (PBKDF2 + AES-GCM) for real client-side encryption.
// Backup file format (.wealthos):
//   [12-byte salt][12-byte IV][ciphertext JSON]
// All crypto happens in the browser. The PIN never leaves the device.
// ============================================================

import type { WealthOSState } from './types';

const BACKUP_MAGIC = 'WEALTHOS1'; // file format version marker
const PBKDF2_ITERATIONS = 150_000; // ~500ms on modern hardware
const SALT_BYTES = 16;
const IV_BYTES = 12;

// ---------- Key Derivation (PBKDF2) ----------

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ---------- Backup (Encrypt + Serialize) ----------

export interface BackupResult {
  blob: Blob;
  filename: string;
  sizeBytes: number;
  createdAt: string;
  entriesCount: {
    assets: number;
    liabilities: number;
    income: number;
    expenses: number;
    goals: number;
    insurance: number;
    family: number;
    documents: number;
  };
}

export async function createEncryptedBackup(
  state: WealthOSState,
  pin: string,
): Promise<BackupResult> {
  if (!pin || pin.length < 4) {
    throw new Error('PIN must be at least 4 digits');
  }

  // Strip auth from backup (PIN hash should not be in the backup file itself)
  const { auth, activeView, ...dataToBackup } = state;
  void auth; void activeView;

  // Serialize state to JSON
  const jsonPayload = JSON.stringify({
    magic: BACKUP_MAGIC,
    version: 1,
    createdAt: new Date().toISOString(),
    profileName: state.settings.profileName,
    currency: state.settings.currency,
    state: dataToBackup,
  });

  // Generate salt + IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));

  // Derive key from PIN
  const key = await deriveKey(pin, salt);

  // Encrypt
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(jsonPayload),
  );

  // Build file: [salt][iv][ciphertext]
  const fileBytes = new Uint8Array(SALT_BYTES + IV_BYTES + ciphertext.byteLength);
  fileBytes.set(salt, 0);
  fileBytes.set(iv, SALT_BYTES);
  fileBytes.set(new Uint8Array(ciphertext), SALT_BYTES + IV_BYTES);

  const blob = new Blob([fileBytes], { type: 'application/octet-stream' });
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = (state.settings.profileName || 'user').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filename = `wealthos_backup_${safeName}_${dateStr}.wealthos`;

  return {
    blob,
    filename,
    sizeBytes: fileBytes.byteLength,
    createdAt: new Date().toISOString(),
    entriesCount: {
      assets: state.assets.length,
      liabilities: state.liabilities.length,
      income: state.income.length,
      expenses: state.expenses.length,
      goals: state.goals.length,
      insurance: state.insurance.length,
      family: state.family.length,
      documents: state.documents.length,
    },
  };
}

// ---------- Restore (Decrypt + Deserialize) ----------

export interface RestorePreview {
  createdAt: string;
  profileName: string;
  currency: string;
  entriesCount: {
    assets: number;
    liabilities: number;
    income: number;
    expenses: number;
    goals: number;
    insurance: number;
    family: number;
    documents: number;
    estateDocs: number;
    beneficiaries: number;
    childPlans: number;
    elderCarePlans: number;
  };
  state: Partial<WealthOSState>;
}

export interface RestoreResult {
  success: boolean;
  error?: string;
  preview?: RestorePreview;
}

// Read file as ArrayBuffer
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// Preview a backup file (requires PIN to decrypt)
export async function previewBackup(
  file: File,
  pin: string,
): Promise<RestoreResult> {
  try {
    if (!pin || pin.length < 4) {
      return { success: false, error: 'PIN must be at least 4 digits' };
    }

    const buffer = await readFileAsArrayBuffer(file);
    const bytes = new Uint8Array(buffer);

    if (bytes.length < SALT_BYTES + IV_BYTES + 1) {
      return { success: false, error: 'File is too small to be a valid backup' };
    }

    // Extract salt, IV, ciphertext
    const salt = bytes.slice(0, SALT_BYTES);
    const iv = bytes.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
    const ciphertext = bytes.slice(SALT_BYTES + IV_BYTES);

    // Derive key
    const key = await deriveKey(pin, salt);

    // Decrypt
    let plaintext: string;
    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext,
      );
      plaintext = new TextDecoder().decode(decrypted);
    } catch (e) {
      return { success: false, error: 'Incorrect PIN or corrupted file (decryption failed)' };
    }

    // Parse JSON
    let parsed: any;
    try {
      parsed = JSON.parse(plaintext);
    } catch (e) {
      return { success: false, error: 'Backup file is corrupted (invalid JSON after decryption)' };
    }

    if (parsed.magic !== BACKUP_MAGIC) {
      return { success: false, error: 'Not a WealthOS backup file (missing magic marker)' };
    }

    const state = parsed.state || {};
    const preview: RestorePreview = {
      createdAt: parsed.createdAt,
      profileName: parsed.profileName || 'Unknown',
      currency: parsed.currency || 'INR',
      entriesCount: {
        assets: state.assets?.length || 0,
        liabilities: state.liabilities?.length || 0,
        income: state.income?.length || 0,
        expenses: state.expenses?.length || 0,
        goals: state.goals?.length || 0,
        insurance: state.insurance?.length || 0,
        family: state.family?.length || 0,
        documents: state.documents?.length || 0,
        estateDocs: state.estatePlan?.documents?.length || 0,
        beneficiaries: state.estatePlan?.beneficiaries?.length || 0,
        childPlans: state.childPlans?.length || 0,
        elderCarePlans: state.elderCarePlans?.length || 0,
      },
      state,
    };

    return { success: true, preview };
  } catch (e: any) {
    return { success: false, error: e.message || 'Unknown error during backup preview' };
  }
}

// Trigger a browser download for the encrypted backup
export function downloadBackup(result: BackupResult) {
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Format file size human-readably
export function formatBackupSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
