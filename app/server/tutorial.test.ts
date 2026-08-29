import { describe, expect, it } from "vitest";
import { dismissTutorial, shouldShowTutorial, tutorialStorageKey } from "../client/src/lib/tutorial";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("tutorial persistence", () => {
  it("shows the tutorial for a new storage context", () => {
    expect(shouldShowTutorial(memoryStorage())).toBe(true);
  });

  it("hides the tutorial after dismissal and persists the decision", () => {
    const storage = memoryStorage();
    dismissTutorial(storage);
    expect(storage.getItem(tutorialStorageKey)).toBe("1");
    expect(shouldShowTutorial(storage)).toBe(false);
  });

  it("fails open when storage is unavailable", () => {
    const unavailable = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };
    expect(shouldShowTutorial(unavailable)).toBe(true);
    expect(() => dismissTutorial(unavailable)).not.toThrow();
  });
});
