// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createFromRequest = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false }));
const createManual = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false }));
const invalidate = vi.hoisted(() => vi.fn());

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ watchedRecords: { list: { invalidate } } }),
    watchedRecords: {
      createFromRequest: { useMutation: () => createFromRequest },
      create: { useMutation: () => createManual },
    },
  },
}));

import { AlertBuilder, HowItWorks } from "../client/src/pages/Home";

describe("simplified watch builder", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    vi.clearAllMocks();
    createFromRequest.mutateAsync.mockResolvedValue({ record: { id: 501, productName: "Sony WH-1000XM5" } });
    createManual.mutateAsync.mockResolvedValue({ record: { id: 502, productName: "Nintendo Switch" } });
  });

  it("creates a watch from plain English", async () => {
    const onCreated = vi.fn();
    render(React.createElement(AlertBuilder, { onCreated }));
    fireEvent.change(screen.getByPlaceholderText("Example: Sony WH-1000XM5 under $250"), { target: { value: "Sony WH-1000XM5 under $250" } });
    fireEvent.click(screen.getByRole("button", { name: "Create watch" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(501));
    expect(createFromRequest.mutateAsync).toHaveBeenCalledWith({ request: "Sony WH-1000XM5 under $250" });
  });

  it("moves by keyboard from the tutorial to the primary watch controls", async () => {
    const user = userEvent.setup();
    render(React.createElement(React.Fragment, null, React.createElement(HowItWorks), React.createElement(AlertBuilder, { onCreated: vi.fn() })));

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Dismiss tutorial" }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByPlaceholderText("Example: Sony WH-1000XM5 under $250"));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Prefer to enter the details yourself?" }));
    await user.tab();
    const createButton = screen.getByRole("button", { name: "Create watch" });
    expect(document.activeElement).toBe(createButton);
    expect(createButton.className).toContain("focus-visible");
  });

  it("keeps manual entry available for users who prefer it", async () => {
    const onCreated = vi.fn();
    render(React.createElement(AlertBuilder, { onCreated }));
    fireEvent.click(screen.getByRole("button", { name: "Prefer to enter the details yourself?" }));
    fireEvent.change(screen.getByPlaceholderText("Product name"), { target: { value: "Nintendo Switch" } });
    fireEvent.change(screen.getByPlaceholderText("Target price"), { target: { value: "299" } });
    fireEvent.click(screen.getByRole("button", { name: "Save watch" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(502));
    expect(createManual.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      productName: "Nintendo Switch",
      thresholdCents: 29900,
      sources: ["google_shopping", "amazon", "ebay"],
    }));
  });
});
