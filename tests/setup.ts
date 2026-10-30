import { vi } from "vitest";

// `server-only` throws outside a React Server Components bundle; tests run in plain Node.
vi.mock("server-only", () => ({}));

// Integration tests never touch the development database.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgresql://prep:prep@localhost:5432/prepsite_test";
process.env.AUTH_SECRET ??= "test-secret-test-secret-test-secret";
process.env.STORAGE_DRIVER = "local";
process.env.STORAGE_LOCAL_DIR = ".data/test-storage";
