export const tutorialStorageKey = "dropwatch.tutorial.dismissed";

type TutorialStorage = Pick<Storage, "getItem" | "setItem">;

export function shouldShowTutorial(storage: TutorialStorage | null | undefined) {
  try {
    return storage?.getItem(tutorialStorageKey) !== "1";
  } catch {
    return true;
  }
}

export function dismissTutorial(storage: TutorialStorage | null | undefined) {
  try {
    storage?.setItem(tutorialStorageKey, "1");
  } catch {
    // Tutorial visibility should never block the dashboard.
  }
}
