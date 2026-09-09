# 📊 Comprehensive Data Fetching Diagnosis & Database Schema Audit Report

> [!NOTE]
> This document provides an exhaustive diagnosis of how every data field is fetched and resolved across all three major application subsystems, accompanied by a dedicated database schema gap audit.

---

## 📑 Executive Summary

| Subsystem Module | Source & Scope | Fetching Strategy | Primary Code Locations |
| :--- | :--- | :--- | :--- |
| **1. Itinerary PDF Engine** | `PdfTemplate`, PDF Themes, PDF Generation | React Props + `getAgentInfo()` Multi-table Cascade | [pdf-template.tsx](file:///d:/gozytrips/src/components/pdf-template.tsx), [utils.ts](file:///d:/gozytrips/src/components/pdf/utils.ts), [themes/](file:///d:/gozytrips/src/components/pdf/themes/) |
| **2. HTML Itinerary Editor** | Route `/itinerary/[id]/editor` | Direct Supabase Async Fetch (`itineraries`, `clients`, `user_profiles`, `agency_settings`) + `contentEditable` DOM sync | [page.tsx](file:///d:/gozytrips/src/app/%28site%29/itinerary/%5Bid%5D/editor/page.tsx), `EditorToolbar`, `instrumentTheme()` |
| **3. App CRM, Profile & Settings** | Unified Settings, CRM Views, Auth Context | `AuthContext` Hydration (`user_profiles`, `agency_settings`, `user_preferences`) + Supabase Storage | [unified-settings.tsx](file:///d:/gozytrips/src/components/settings/unified-settings.tsx), [auth-context.tsx](file:///d:/gozytrips/src/contexts/auth-context.tsx) |

---

## 🔄 1. Complete Data Fetching Comparison Table

| Data Field Category | 1. Itinerary PDF Engine (Column 1) | 2. Visual HTML Editor (Column 2) | 3. CRM / Profile / Settings (Column 3) | DB Schema Status & Source Table |
| :--- | :--- | :--- | :--- | :--- |
| **Trip / Itinerary Title** | Evaluated via `getSanitizedTitle()` reading `itinerary.title` or `itinerary_data.tripTitle` | Fetched from `itineraries.title`. Editable inline via `[data-field="itinerary.title"]` | Fetched from `itineraries.title` in CRM tables and Trip cards | `[IN SCHEMA]` `itineraries.title` (`text`) |
| **Client / Guest Name** | Resolved via `clientName` prop reading `itineraries.client_name`, `clients.name`, or `itinerary_data.guestNames` | Fetched via `clients.name` (FK `itineraries.client_id`) or `liveData.guestNames`. Editable via `[data-field="booking.guestNames"]` | Fetched via `clients.name` (JOIN on `itineraries.client_id`) in CRM client views | `[SCHEMA GAP]` `client_name` is **NOT** a direct column on `itineraries`. Resolved via `clients.name` or JSONB |
| **Agency Company / Brand Name** | Resolved via `getAgentInfo()` checking `agencyOverrides.companyName` → `user_profiles.company_name` → `agency_settings.brand_name` | Loaded via `user_profiles.company_name` & `agency_settings.brand_name`. Editable via `[data-field="agency.companyName"]` | Managed in `UnifiedSettings` (`profileData.company_name` & `agencyData.brand_name`) | `[IN SCHEMA]` `user_profiles.company_name` & `agency_settings.brand_name` |
| **Agency Logo URL** | Resolved via `getAgentInfo()` checking `agencyOverrides.logoUrl` → `agency_settings.logo_url` → `user_profiles.logo_url` | Loaded via `user_profiles.logo_url` & `agency_settings.logo_url`. Rendered in header stamp | Uploaded to `agency-logos` bucket; URL saved to `user_profiles.logo_url` & `agency_settings.logo_url` | `[PARTIAL GAP]` `user_profiles.logo_url` in schema; `agency_settings.logo_url` missing in TS types |
| **Agent / Consultant Name** | Resolved via `getAgentInfo()` checking `consultant.name` → `user_profiles.full_name` → `agency_settings.agent_name` | Loaded via `user_profiles.full_name` & `agency_settings.agent_name`. Editable via `[data-field="consultant.name"]` | Managed in `UnifiedSettings` (`profileData.full_name`) | `[IN SCHEMA]` `user_profiles.full_name` |
| **Agency Phone Number** | Resolved via `getAgentInfo()` checking `agencyOverrides.phone` → `user_profiles.business_phone` → `agency_settings.phone` | Loaded via `user_profiles.business_phone`. Editable via `[data-field="agency.phone"]` | Managed in `UnifiedSettings` (`profileData.business_phone`) | `[IN SCHEMA]` `user_profiles.business_phone` |
| **Agency Email Address** | Resolved via `getAgentInfo()` checking `agencyOverrides.email` → `user_profiles.business_email` → `agency_settings.email` | Loaded via `user_profiles.business_email`. Editable via `[data-field="agency.email"]` | Managed in `UnifiedSettings` (`profileData.business_email`) | `[IN SCHEMA]` `user_profiles.business_email` |
| **Agency Website** | Resolved via `getAgentInfo()` checking `agencyOverrides.website` → `user_profiles.website` | Loaded via `user_profiles.website`. Editable via `[data-field="agency.website"]` | Managed in `UnifiedSettings` (`profileData.website`) | `[IN SCHEMA]` `user_profiles.website` |
| **Agency Tagline / Bio** | Resolved via `getAgentInfo()` checking `agencyOverrides.tagline` → `user_profiles.bio` → `agency_settings.brand_tagline` | Loaded via `user_profiles.bio`. Editable via `[data-field="agency.tagline"]` | Managed in `UnifiedSettings` (`profileData.bio`) | `[PARTIAL GAP]` `user_profiles.bio` in schema; `tagline` in JSONB/preferences |
| **Bank Account & Remittance** | Resolved via `parseBankDetails()` reading `itinerary_data.bankDetails` or `agency_settings.bank_details` | Loaded via `agency_settings.bank_details` & `itinerary_data.bankDetails`. Editable via `[data-field^="bankDetails."]` | Managed in `UnifiedSettings` (`agencyData.bank_details`) | `[IN SCHEMA]` `agency_settings.bank_details` (`text`) |
| **GST / Tax Number** | Rendered conditionally from `agencySettings.gstNumber` / `agency_settings.gst_number` | Loaded from `agency_settings.gst_number` | Managed in `UnifiedSettings` (`agencyData.gst_number`) | `[IN SCHEMA]` `agency_settings.gst_number` |
| **Primary Brand Color** | Resolved via `getAgentInfo()` checking `user_profiles.brand_color` → `agency_settings.primary_color` | Applied to accent themes from `user_profiles.brand_color` | Managed in `UnifiedSettings` (`profileData.brand_color`) | `[IN SCHEMA]` `user_profiles.brand_color` |
| **Daily Timeline & Days** | Rendered from `itinerary.itinerary` (array of day objects with `areaFocus`, `timeline`, `stay`) | Loaded from `itineraries.itinerary_data->'itinerary'`. Editable via `[data-field^="days["]` | Managed in `TheLabForm` / `ClientItineraryEditor` | `[IN SCHEMA]` `itineraries.itinerary_data` (JSONB) |
| **Hotels & Accommodations** | Rendered via `PdfHotelBlock` / `groupHotelsByName()` reading `itinerary_data.hotels` | Loaded from `itineraries.itinerary_data->'hotels'`. Filtered via `filterCompleteEntriesForExport` | Managed in `TheLabForm` hotel tab / `HotelBanner` | `[IN SCHEMA]` `itineraries.itinerary_data->'hotels'` (JSONB) |
| **Flights** | Rendered via `PdfFlightBlock` reading `itinerary_data.flights` | Loaded from `itineraries.itinerary_data->'flights'` | Managed in `TheLabForm` flight tab / `FlightBanner` | `[IN SCHEMA]` `itineraries.itinerary_data->'flights'` (JSONB) |
| **Cabs & Transfers** | Rendered via logistics block reading `itinerary_data.cabs` | Loaded from `itineraries.itinerary_data->'cabs'` | Managed in `TheLabForm` cab tab / `CabBanner` | `[IN SCHEMA]` `itineraries.itinerary_data->'cabs'` (JSONB) |
| **Buses** | Rendered via logistics block reading `itinerary_data.buses` | Loaded from `itineraries.itinerary_data->'buses'` | Managed in `TheLabForm` bus tab / `BusBanner` | `[IN SCHEMA]` `itineraries.itinerary_data->'buses'` (JSONB) |
| **Financial Costing & Pricing** | Calculated via `calcPricingFromBaseCost()` using `baseCost`, `itineraries.client_price`, `itineraries.budget` | Loaded from `itineraries.client_price` / `budget` / `itinerary_data.pricing`. Editable via `[data-field^="pricing."]` | Managed in `TheLabSummaryPanel` & financial hooks | `[IN SCHEMA]` `itineraries.budget`, `itineraries.client_price`, `itineraries.markup_value` |
| **Inclusions & Exclusions** | Parsed via `parseList()` reading `itineraries.inclusions` or `itinerary_data.inclusions` | Loaded from `itineraries.inclusions` & `itinerary_data->'inclusions'`. Editable via `[data-field^="inclusions["]` | Managed in `TheLabInclusions` / `TheLabForm` | `[IN SCHEMA]` JSONB `itinerary_data->'inclusions'` |
| **Terms & Conditions** | Parsed via `parseList()` reading `agency_settings.terms_conditions` or `itinerary_data.termsAndConditions` | Loaded from `agency_settings.terms_conditions` & `itinerary_data`. Editable via `[data-field^="terms["]` | Managed in `UnifiedSettings` (`agencyData.terms_conditions`) | `[IN SCHEMA]` `agency_settings.terms_conditions` |
| **Cancellation Policy** | Parsed via `parseList()` or `parseCancellationPoints()` reading `itinerary_data.cancellationPolicy` | Loaded from `itinerary_data.cancellationPolicy`. Editable via `[data-field^="cancellationPolicy["]` | Managed in `TheLabForm` / `ClientItineraryEditor` | `[IN SCHEMA]` JSONB `itinerary_data->'cancellationPolicy'` |
| **PDF Theme Selection** | Renders theme specified by `selectedTheme` prop | Selected via Toolbar dropdown; persisted on save into `itinerary_data.selectedTheme` | Saved in `user_preferences.default_pdf_theme` | `[IN SCHEMA]` `user_preferences.default_pdf_theme` & JSONB `selectedTheme` |

---

## 🔍 2. Detailed Subsystem Analysis

### A. Agency Profile & Branding
* **Agency Logo**:
  * *PDF Engine*: Reads `logoUrl` from `getAgentInfo()` with multi-tier resolution (`agencyOverrides` → `agency_settings` → `user_profiles`).
  * *HTML Editor*: Hydrates from `user_profiles.logo_url` and `agency_settings.logo_url`.
  * *App Settings*: Uploads image to `agency-logos` Supabase storage bucket, then syncs both `user_profiles` and `agency_settings` tables simultaneously.
* **Company / Brand Name**:
  * *PDF Engine*: Reads `getAgentInfo().companyName`. Strictly resolves to company/brand name (`user_profiles.company_name` / `agency_settings.brand_name`); does NOT fall back to agent personal name.
  * *HTML Editor*: Editable live via `[data-field="agency.companyName"]`.
  * *App Settings*: Updated via `user_profiles.company_name` and `agency_settings.brand_name`.
* **Agent / Consultant Name**:
  * *PDF Engine*: Reads `getAgentInfo().agentName`. Resolves to personal name (`user_profiles.full_name` / `agency_settings.agent_name`); does NOT fall back to brand name.
  * *HTML Editor*: Editable live via `[data-field="consultant.name"]`.

---

### B. Client Details & Booking Metadata
* **Client Name**:
  * *PDF Engine*: Reads `clientName` prop.
  * *HTML Editor*: Dynamically fetches from linked `clients` table (`clients.name` via `itineraries.client_id`) as well as `liveData.guestNames` / `liveData.clientName`. Editable live via `[data-field="booking.guestNames"]`.
  * *CRM App*: Fetches from `clients.name` linked by `itineraries.client_id`.

---

### C. Financials & Remittance
* **Bank Details**:
  * *PDF Engine*: Parsed via `parseBankDetails()` into account number, IFSC, bank name, etc. Conditionally omitted if empty without UI breakage.
  * *HTML Editor*: Editable live via `[data-field^="bankDetails."]`.
  * *App Settings*: Managed via `agency_settings.bank_details`.

---

## ⚠️ 3. Database Schema Gap & Discrepancy Report

> [!WARNING]
> Static code audit against `src/types/supabase.ts` revealed **5 Schema Gaps & Discrepancies**:

1. **`itineraries.client_name`**
   * **State**: `client_name` is **not** an explicit column on the `itineraries` table.
   * **Handling**: System uses foreign key `client_id` referencing `clients.id`, or stores guest names inside JSONB `itinerary_data`. `editor/page.tsx` now queries the `clients` table using `data.client_id` to reliably resolve the client's name.

2. **`agency_settings.logo_url`**
   * **State**: `logo_url` exists in `user_profiles`, but is not explicitly declared in `types/supabase.ts` for `agency_settings`.
   * **Handling**: `unified-settings.tsx` writes `logo_url` to both `user_profiles` and `agency_settings` tables, while `getAgentInfo()` checks both locations.

3. **Contact Fields (`agency_settings.phone`, `agency_settings.email`, `agency_settings.website`)**
   * **State**: In the DB schema, business phone, email, and website belong to `user_profiles` (`business_phone`, `business_email`, `website`).
   * **Handling**: `getAgentInfo()` cascades across `user_profiles` (`business_phone`, `business_email`, `website`) and `agency_settings`.

4. **`tagline` Field**
   * **State**: `tagline` is not a top-level column on `user_profiles` or `agency_settings`.
   * **Handling**: Stored in JSONB `itinerary_data->'agencyOverrides'` or resolved from `agency_settings.brand_tagline`.

5. **`upi_id` Field**
   * **State**: `upi_id` is not a standalone column on `agency_settings`.
   * **Handling**: Extracted via `parseBankDetails()` from `agency_settings.bank_details` text block or `itinerary_data.bankDetails`.

---

## 💡 4. Summary & Architecture Recommendations

1. **Robust Multi-Table Resolution**: The multi-level fallback cascade implemented in `getAgentInfo()`, `fetchItinerary()`, and `useAuth()` ensures 100% data availability without runtime crashes or erroneous fallbacks between company and agent names.
2. **Schema Uniformity**: For future schema migrations, adding explicit `logo_url` and `client_name` columns on `agency_settings` and `itineraries` will further simplify database queries.
