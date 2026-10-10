import {
  EMPTY_SENDER_PROFILE,
  loadSenderProfile,
  saveSenderProfile,
  SENDER_CONTACT_MAX_LENGTH,
  SENDER_NAME_MAX_LENGTH,
  SENDER_PROFILE_STORAGE_KEY,
} from "@/features/client-summary/sender-profile";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    data,
  };
}

describe("sender profile", () => {
  it("round-trips a cleaned profile", () => {
    const storage = memoryStorage();
    expect(
      saveSenderProfile(
        { name: " Asha\u0000  Rao ", contact: "a@b.in" },
        storage,
      ),
    ).toBe(true);
    expect(loadSenderProfile(storage)).toEqual({
      name: "Asha Rao",
      contact: "a@b.in",
    });
    expect(JSON.parse(storage.data.get(SENDER_PROFILE_STORAGE_KEY)!)).toEqual({
      storageVersion: 1,
      name: "Asha Rao",
      contact: "a@b.in",
    });
  });

  it("limits field lengths", () => {
    const storage = memoryStorage();
    saveSenderProfile(
      { name: "n".repeat(500), contact: "c".repeat(500) },
      storage,
    );
    const loaded = loadSenderProfile(storage);
    expect(loaded.name).toHaveLength(SENDER_NAME_MAX_LENGTH);
    expect(loaded.contact).toHaveLength(SENDER_CONTACT_MAX_LENGTH);
  });

  it("removes the stored key when both fields are empty", () => {
    const storage = memoryStorage();
    saveSenderProfile({ name: "A", contact: "" }, storage);
    expect(storage.data.has(SENDER_PROFILE_STORAGE_KEY)).toBe(true);
    saveSenderProfile({ name: " ", contact: "" }, storage);
    expect(storage.data.has(SENDER_PROFILE_STORAGE_KEY)).toBe(false);
  });

  it.each([
    ["corrupt JSON", "{"],
    [
      "wrong version",
      JSON.stringify({ storageVersion: 2, name: "A", contact: "" }),
    ],
    [
      "extra keys",
      JSON.stringify({ storageVersion: 1, name: "A", contact: "", x: 1 }),
    ],
    [
      "wrong types",
      JSON.stringify({ storageVersion: 1, name: 5, contact: "" }),
    ],
  ])("falls back to empty for %s", (_label, raw) => {
    expect(
      loadSenderProfile(memoryStorage({ [SENDER_PROFILE_STORAGE_KEY]: raw })),
    ).toEqual(EMPTY_SENDER_PROFILE);
  });

  it("works without storage", () => {
    expect(loadSenderProfile(null)).toEqual(EMPTY_SENDER_PROFILE);
    expect(saveSenderProfile({ name: "A", contact: "" }, null)).toBe(false);
  });

  it("reports a write failure without throwing", () => {
    const storage = {
      ...memoryStorage(),
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(saveSenderProfile({ name: "A", contact: "" }, storage)).toBe(false);
  });
});
