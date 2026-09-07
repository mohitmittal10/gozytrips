# Hardcoded Content Audit — All Itinerary Formats

This document lists all hardcoded strings, fallback values, labels, and UI text found across every theme file in `src/components/pdf/themes/`.

---

## 1. Shared / All Themes

These patterns repeat across every theme file with minor wording differences:

| Category | Hardcoded Value | Location |
|---|---|---|
| **Fallback client name** | `"Valued Guest"` | classic-theme |
| **Fallback client name** | `""` (empty) | editorial, minimalist, dark, corporate |
| **Fallback tagline** | `"Your custom travel blueprint, prepared by experts."` | `utils.ts` → `getAgentInfo()` |
| **Invoice line (no manual options)** | `"Consolidated Package Cost"` | classic-theme |
| **Invoice line (no manual options)** | `"Curated Journey Cost"` | editorial-theme |
| **Invoice line (no manual options)** | `"Package Cost"` | minimalist, dark, corporate, desert, tropical, luxury |
| **Invoice section heading** | `"Package Invoice"` | classic |
| **Invoice section heading** | `"Investment Summary"` | editorial |
| **Invoice section heading** | `"Invoice & Schedule"` | minimalist |
| **Invoice section heading** | `"Investment Details"` | dark |
| **Cover subtitle (no client)** | `"A bespoke luxury travel itinerary"` | luxury |
| **Cover subtitle (with client)** | `` `A bespoke travel itinerary prepared for ${clientNameResolved}` `` | luxury |
| **Cover subtitle** | `` `${n}-Day Curated Journey • Designed by ${agent.agentName}` `` | editorial |
| **Cover subtitle** | `` `${n}-day bespoke journey · Curated by ${agent.agentName}` `` | minimalist |
| **Footer brand fallback** | `"GozyTrips"` | luxury |

---

## 2. [classic-theme.tsx](file:///d:/gozytrips/src/components/pdf/themes/classic-theme.tsx)

### Labels / Headings
| Hardcoded Text | Line |
|---|---|
| `"Prepared For"` | 164 |
| `"Valued Guest"` (client name fallback) | 165 |
| `"Prepared By"` | 175 |
| `"Client Details"` (stat card) | 187 |
| `"Duration"` | 194 |
| `"Total Budget"` | 198 |
| `"About The Destination"` | 215 |
| `"Travel & Logistics"` | 333 |
| `"Inclusions"` | 423 |
| `"Exclusions"` | 433 |
| `"Package Invoice"` | 448 |
| `"Complete cost breakdown & payment schedule"` | 449 |
| `"Description"`, `"Qty"`, `"Rate"`, `"Amount"` (table headers) | 462–465 |
| `"Consolidated Package Cost"` (invoice fallback) | 485 |
| `"Subtotal (Base Cost):"`, `"Service Fee / Markup:"` | 497–499 |
| `"Grand Total:"` | 512 |
| `"Payment Schedule"` | 519 |
| `"Installment"`, `"Due Date"`, `"Percentage"`, `"Amount"` | 531–534 |
| `"Agency Details"` (footer heading) | 482 |
| `"Bank Account"`, `"Tax / GST"`, `"UPI Payment"` | 486, 496, 503 |

### Fallback values
| Hardcoded | Description |
|---|---|
| `"#a855f7"` | Default accent color in `hexToRgb()` |
| `2` adults | Default `adultPax` |

---

## 3. [editorial-theme.tsx](file:///d:/gozytrips/src/components/pdf/themes/editorial-theme.tsx)

### Labels / Headings
| Hardcoded Text | Line |
|---|---|
| `"Prepared For"` | 133 |
| `"About The Destination"` | 170 |
| `"Travel & Logistics"` | 237 |
| `"Inclusions"` | 313 |
| `"Exclusions"` | 323 |
| `"Investment Summary"` (pricing heading) | 337 |
| `"Description"`, `"Qty"`, `"Rate"`, `"Amount"` | 351–354 |
| `"Curated Journey Cost"` (invoice fallback) | 374 |
| `"Subtotal (Base Cost)"`, `"Service Fee / Markup"` | 386–388 |
| `"Total Valuation"` | 401 |
| `"Payment Terms"` | 410 |
| `"Installment"`, `"Due Date"`, `"Percentage"`, `"Amount"` | 421–424 |
| `"Payment Methods"` | 450 |
| `"Cancellation Policy"` | 458 |
| `"Terms & Conditions"` | 468 |
| `"Agency Details"` | 482 |
| `"Days Away"`, `"Bespoke Valuation"`, `"Events"` | 143, 148, 153 |

### Fallback values
| Hardcoded | Description |
|---|---|
| `"b8860b"` | Default gold color |
| `` `${n}-Day Curated Journey • Designed by ${agent.agentName}` `` | Cover tagline fallback |

---

## 4. [minimalist-theme.tsx](file:///d:/gozytrips/src/components/pdf/themes/minimalist-theme.tsx)

### Labels / Headings
| Hardcoded Text | Line |
|---|---|
| `"👤 Client Details"` | 148 |
| `"Client Name"` | 151 |
| `"Adults"`, `"Children"`, `"Infants"` | 156, 160, 165 |
| `"🏢 Agency Details"` | 175 |
| `"Consultant:"` | 177 |
| `"About Destination"` | 196 |
| `"Guest / Client"`, `"Travelers"`, `"Duration"`, `"Est. Budget"` | 134–137 |
| `"Travel & Logistics"` | 269 |
| `"Inclusions"` | 362 |
| `"Exclusions"` | 375 |
| `"Invoice & Schedule"` | 391 |
| `"Package Cost"` (invoice fallback) | 428 |
| `"Subtotal (Base Cost)"`, `"Service Fee / Markup"` | 440–442 |
| `"Grand Total"` | 455 |
| `"Payment Schedule"` | 461 |
| `"Payment Methods"` | 501 |
| `"Cancellation Policy"` | 509 |
| `"Terms & Conditions"` | 519 |
| `"Bank Account"`, `"Tax Information"`, `"UPI Payment"` | 533, 543, 549 |

### Fallback values
| Hardcoded | Description |
|---|---|
| `"#000000"` | Default accent color |
| `` `${n}-day bespoke journey · Curated by ${agent.agentName}` `` | Cover tagline fallback |

---

## 5. [dark-theme.tsx](file:///d:/gozytrips/src/components/pdf/themes/dark-theme.tsx)

### Labels / Headings
| Hardcoded Text | Line |
|---|---|
| `"Prepared By: {agentName}"` | 131 |
| `"Duration"`, `"Est. Budget"`, `"Activities"` | 144–146 |
| `"{n} Nights"`, `"Total Price"`, `"Scheduled"` | 144–146 |
| `"👤 Client Details"` | 160 |
| `"Client Name"`, `"Adults"`, `"Children"`, `"Infants"` | 163, 168, 172, 177 |
| `"✨ Agency Consultant"` | 187 |
| `"Destination"` | 207 |
| `"Travel & Logistics"` | 278 |
| `"Inclusions"` | 371 |
| `"Exclusions"` | 384 |
| `"Investment Details"` | 400 |
| `"Package Cost"` (invoice fallback) | 438 |
| `"Subtotal (Base Cost)"`, `"Service Fee / Markup"` | 450–452 |
| `"Grand Total"` | 465 |
| `"Payment Schedule"` | 472 |
| `"Cancellation Policy"` | 512 |
| `"Payment Methods"` | 520 |
| `"Terms & Conditions"` | 530 |

### Fallback values
| Hardcoded | Description |
|---|---|
| `"#a855f7"` | Default accent + `"168, 85, 247"` RGB |
| `"070a13"` | Background color |
| `"#ec4899"` | Hardcoded pink for "Consultant" card border |

---

## 6. [luxury-theme.tsx](file:///d:/gozytrips/src/components/pdf/themes/luxury-theme.tsx)

### Labels / Headings
| Hardcoded Text | Line |
|---|---|
| `"A bespoke luxury travel itinerary"` | ~1109 |
| `"A bespoke travel itinerary prepared for {client}"` | ~1109 |
| `"Consultant"` | ~1157 |
| `"Client Details"` | ~1168 |
| `"GozyTrips"` (footer brand fallback) | ~1629 |
| Default cancellation policy — 4 hardcoded strings | ~18–23 |

### Hardcoded Cancellation Defaults
```
'60+ days pre-departure: 10% cancellation fee'
'30–59 days pre-departure: 40% cancellation fee'
'15–29 days pre-departure: 70% cancellation fee'
'Less than 15 days pre-departure: 100% cancellation fee'
```

---

## 7. [corporate-theme.tsx](file:///d:/gozytrips/src/components/pdf/themes/corporate-theme.tsx) & [desert-theme.tsx](file:///d:/gozytrips/src/components/pdf/themes/desert-theme.tsx) & [tropical-theme.tsx](file:///d:/gozytrips/src/components/pdf/themes/tropical-theme.tsx)

These follow the same patterns. Key shared hardcoded values:
- `"Package Cost"` — invoice fallback line
- `"Private Transfer"` — cab type fallback
- `"Tourist Bus"` — bus type fallback
- `"Local"` — cab route fallback
- `"Inclusions"`, `"Exclusions"`, `"Travel & Logistics"`, `"Payment Schedule"` — section headings
- `"Grand Total"` or `"Total Valuation"` — totals label

---

## 8. Cross-Theme Fallbacks (every theme)

| Hardcoded | Source |
|---|---|
| `"Private Transfer"` | Cab `vehicleType` fallback |
| `"Tourist Bus"` | Bus `busType` fallback |
| `"Local"` | Cab `route` fallback |
| `"Your Journey"` | Itinerary title fallback (luxury) |
| `"2 Adults"` | Traveller summary fallback (luxury) |
| `"#a855f7"` / `"168, 85, 247"` | Accent color defaults in classic, dark |
| `DEFAULT_CURRENCY` from `@/types/pricing` | Currency fallback |

---

## 9. utils.ts — `getAgentInfo()` Defaults

```ts
primaryColor: "#a855f7",
agentName: "The Lab",
companyName: "Wander Labs",
tagline: "Your custom travel blueprint, prepared by experts."
```

All are hardcoded fallbacks used if no `userProfile` data exists.

---

## Summary by Category

| Category | # Instances | Severity |
|---|---|---|
| Section/UI labels (Inclusions, Payments, etc.) | ~50+ | Low — cosmetic |
| Invoice fallback descriptions ("Package Cost") | 7 | Medium — customer-facing |
| Cover subtitles / taglines | 6 | Medium — brand voice |
| Client/agency labels (Prepared For, etc.) | 10+ | Low — standard |
| Brand fallbacks (`"GozyTrips"`, `"Wander Labs"`) | 3 | **High** — wrong branding if agency settings missing |
| Color defaults (`#a855f7`) | 5+ | Low — visual only |
| Luxury cancellation policy defaults | 4 | Medium — legally significant |
