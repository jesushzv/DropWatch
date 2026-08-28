// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const update = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false }));
const invalidate = vi.hoisted(() => vi.fn());

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ watchedRecords: { get: { invalidate }, list: { invalidate } } }),
    watchedRecords: { update: { useMutation: () => update } },
  },
}));

import { EditWatch } from "../client/src/pages/Home";

const detail = {
  record: {
    id: 11,
    originalRequest: "Headphones under $250",
    productName: "Sony WH-1000XM5",
    thresholdCents: 25000,
    alertBasis: "item_price",
    destinationPostalCode: null,
    observationMode: false,
  },
} as never;

describe("advanced watch settings disclosure", () => {
  afterEach(() => cleanup());

  it("opens and closes with mouse and keyboard", async () => {
    const user = userEvent.setup();
    render(React.createElement(EditWatch, { detail, onClose: vi.fn() }));
    const details = screen.getByText("Advanced alert settings").closest("details");
    expect(details).toBeTruthy();
    expect(details?.open).toBe(false);

    await user.click(screen.getByText("Advanced alert settings"));
    expect(details?.open).toBe(true);

    const summary = screen.getByText("Advanced alert settings");
    summary.focus();
    expect(document.activeElement).toBe(summary);
    await user.click(summary);
    expect(details?.open).toBe(false);
  });
});
