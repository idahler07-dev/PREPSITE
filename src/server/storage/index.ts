import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

/**
 * Private file storage. Nothing is ever public: files are served only through
 * authenticated routes, which stream them (local driver) or redirect to a
 * short-lived signed URL (S3 driver).
 */
export interface StorageDriver {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
  /** Short-lived URL for direct download, or null when the driver streams through the app. */
  signedUrl(key: string, opts: { expiresInSec: number; contentType?: string; filename?: string }): Promise<string | null>;
}

function safeKey(key: string): string {
  if (!/^[a-zA-Z0-9/_.-]+$/.test(key) || key.includes("..") || key.startsWith("/")) {
    throw new Error(`Invalid storage key: ${key}`);
  }
  return key;
}

class LocalDriver implements StorageDriver {
  constructor(private root: string) {}
  private file(key: string) {
    return path.join(this.root, safeKey(key));
  }
  async put(key: string, body: Uint8Array) {
    const f = this.file(key);
    await mkdir(path.dirname(f), { recursive: true });
    await writeFile(f, body);
  }
  async get(key: string) {
    try {
      return new Uint8Array(await readFile(this.file(key)));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }
  async delete(key: string) {
    await rm(this.file(key), { force: true });
  }
  async signedUrl() {
    return null;
  }
}

class S3Driver implements StorageDriver {
  private clientPromise: Promise<import("@aws-sdk/client-s3").S3Client>;
  constructor(private bucket: string) {
    const e = env();
    this.clientPromise = import("@aws-sdk/client-s3").then(
      ({ S3Client }) =>
        new S3Client({
          endpoint: e.S3_ENDPOINT,
          region: e.S3_REGION,
          forcePathStyle: e.S3_FORCE_PATH_STYLE,
          credentials: { accessKeyId: e.S3_ACCESS_KEY_ID ?? "", secretAccessKey: e.S3_SECRET_ACCESS_KEY ?? "" },
        }),
    );
  }
  async put(key: string, body: Uint8Array, contentType: string) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await (await this.clientPromise).send(
      new PutObjectCommand({ Bucket: this.bucket, Key: safeKey(key), Body: body, ContentType: contentType }),
    );
  }
  async get(key: string) {
    const { GetObjectCommand, NoSuchKey } = await import("@aws-sdk/client-s3");
    try {
      const res = await (await this.clientPromise).send(new GetObjectCommand({ Bucket: this.bucket, Key: safeKey(key) }));
      return res.Body ? new Uint8Array(await res.Body.transformToByteArray()) : null;
    } catch (e) {
      if (e instanceof NoSuchKey) return null;
      throw e;
    }
  }
  async delete(key: string) {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    await (await this.clientPromise).send(new DeleteObjectCommand({ Bucket: this.bucket, Key: safeKey(key) }));
  }
  async signedUrl(key: string, opts: { expiresInSec: number; contentType?: string; filename?: string }) {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: safeKey(key),
      ResponseContentType: opts.contentType,
      ResponseContentDisposition: opts.filename ? `inline; filename="${opts.filename.replace(/"/g, "")}"` : undefined,
    });
    return getSignedUrl(await this.clientPromise, cmd, { expiresIn: opts.expiresInSec });
  }
}

let driver: StorageDriver | undefined;

export function storage(): StorageDriver {
  if (driver) return driver;
  const e = env();
  if (e.STORAGE_DRIVER === "s3") {
    if (!e.S3_BUCKET || !e.S3_ENDPOINT) throw new Error("S3_BUCKET and S3_ENDPOINT are required for STORAGE_DRIVER=s3");
    driver = new S3Driver(e.S3_BUCKET);
  } else {
    driver = new LocalDriver(path.resolve(process.cwd(), e.STORAGE_LOCAL_DIR));
  }
  return driver;
}

export function newStorageKey(folder: "questions" | "sources" | "imports", ext: string): string {
  const d = new Date();
  const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return `${folder}/${month}/${randomUUID()}${ext.startsWith(".") ? ext : `.${ext}`}`;
}

export function sha256(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

export const IMAGE_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/** Identify an image from its first bytes; never trust the browser's MIME type. */
export function sniffImageType(bytes: Uint8Array): keyof typeof IMAGE_TYPES | null {
  const b = bytes;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP")
    return "image/webp";
  if (b.length >= 6 && String.fromCharCode(...b.slice(0, 3)) === "GIF") return "image/gif";
  return null;
}

/** PNG/JPEG dimensions without decoding the image (best effort). */
export function imageSize(bytes: Uint8Array, type: string): { width: number; height: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (type === "image/png" && bytes.length >= 24) return { width: view.getUint32(16), height: view.getUint32(20) };
  if (type === "image/jpeg") {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) return null;
      const marker = bytes[i + 1]!;
      const len = view.getUint16(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: view.getUint16(i + 5), width: view.getUint16(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}
