// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { HowItWorks } from "../client/src/pages/Home";

describe("How it works tutorial", () => {
  beforeEach(() => window.localStorage.clear());

  it("dismisses and reopens from the persistent How it works trigger", async () => {
    render(React.createElement(HowItWorks));
    expect(screen.getByRole("heading", { name: "How DropWatch works" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss tutorial" }));
    expect(screen.queryByRole("heading", { name: "How DropWatch works" })).toBeNull();
    expect(window.localStorage.getItem("dropwatch.tutorial.dismissed")).toBe("1");

    window.dispatchEvent(new CustomEvent("dropwatch:open-tutorial"));
    await waitFor(() => expect(screen.getByRole("heading", { name: "How DropWatch works" })).toBeTruthy());
  });
});

  it("exposes a labeled dismiss control that can receive keyboard focus", () => {
    render(React.createElement(HowItWorks));
    const dismissButton = screen.getByRole("button", { name: "Dismiss tutorial" });
    expect(screen.getByRole("heading", { name: "How DropWatch works" })).toBeTruthy();
    dismissButton.focus();
    expect(document.activeElement).toBe(dismissButton);
  });
