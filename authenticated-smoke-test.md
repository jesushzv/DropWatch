# Authenticated DropWatch Smoke Test

**Date:** 2026-08-28

The signed-in preview was opened with the owner account visible in the dashboard header. The first-run dashboard rendered the `How DropWatch works` tutorial, including the three-step explanation: create one watch, check supported sources, and read the signal. The primary plain-English alert builder was visible without requiring store selection.

A temporary alert, `Nintendo Switch 2 under $399`, was entered through the plain-English builder. The app displayed `Structuring watch`, then navigated to the created watch detail page with a success message confirming that Nintendo Switch 2 was added to the list. The detail page displayed the target of `$399.00`, all supported retailer sources, watch activity, and the item-price alert basis.

The detail page displayed the trust evidence explanation: no offer evidence had yet been recorded, ZIP is stored as context, and shipping and tax appear when the provider supplies them. This confirms that unknown shipping and tax are not silently represented as zero. The dashboard also displayed the existing Sony WH-1000XM5 provider state as `No qualifying offer`, with Amazon and eBay shown as `no match`, confirming the terminal no-match presentation. After the temporary and prior acceptance watches were removed with owner authorization, the dashboard was reopened and showed `All 0`, `Active 0`, `Paused 0`, `Target met 0`, `No watches yet`, and the first-run tutorial and primary alert builder still visible. This confirms the clean authenticated onboarding state.

The browser initially timed out during UI removal, so the authorized cleanup was completed safely at the database layer: the temporary Nintendo Switch 2 watch and the owner’s prior active Sony acceptance watch were removed, while unrelated database fixtures were left untouched. No price was logged and no provider alert was sent. The owner account was then verified in the signed-in dashboard with zero active watches.
