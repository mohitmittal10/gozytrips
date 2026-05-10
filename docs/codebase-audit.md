# Exhaustive Codebase Audit Results

## 📁 Phase 1: Routes & Layouts (`src/app`)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚫ NAMING & CONSISTENCY VIOLATIONS
📁 FILE: `src/app/layout.tsx`
📌 LINE(S): 10, 11
🔍 ISSUE: Brand inconsistency. Metadata title is "Wander Labs" but the project/repo name was formerly "Wander Labs".
⚠️  IMPACT: Confusion for users and developers; inconsistent SEO.
✅ FIX: Standardize branding across metadata and UI components.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
///////// done///////
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟣 PERFORMANCE REDUNDANCIES
📁 FILE: `src/app/layout.tsx`
📌 LINE(S): 22-25
🔍 ISSUE: External font loading via standard `<link>` tags.
⚠️  IMPACT: Slower page load due to blocking requests; missing out on Next.js font optimizations.
✅ FIX: Use `next/font/google` to load fonts efficiently.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟡 REDUNDANT STATE & PROPS
📁 FILE: `src/app/page.tsx`
📌 LINE(S): 11-92
🔍 ISSUE: Large static data array `parallaxProducts` defined inside the page component file.
⚠️  IMPACT: Bloats the page file; makes it harder to manage marketing content; reduces reusability.
✅ FIX: Move static marketing data to `src/constants/marketing.ts`.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟠 DUPLICATE CODE (DRY VIOLATIONS)
📁 FILE: `src/app/page.tsx`, `src/app/ai-architect/page.tsx`, `src/app/auth/login/page.tsx`
📌 LINE(S): Multiple
🔍 ISSUE: Manual inclusion of `<Header />` and `<Footer />` (or lack thereof) across different pages instead of using a consistent layout.
⚠️  IMPACT: Maintenance overhead; inconsistent UI across routes.
✅ FIX: Use Next.js nested layouts to define global and section-specific headers/footers.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔵 HOOKS MISUSE & ANTI-PATTERNS
📁 FILE: `src/app/auth/login/page.tsx`
📌 LINE(S): 46-48
🔍 ISSUE: Unnecessary `setTimeout` before `router.push`.
⚠️  IMPACT: Artificial delay in user experience; fragile logic (if toast duration changes).
✅ FIX: Remove `setTimeout` and rely on the toast library's own lifecycle or immediate redirect.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟠 DUPLICATE CODE (DRY VIOLATIONS)
📁 FILE: `src/app/auth/login/page.tsx`, `src/app/auth/signup/page.tsx`
📌 LINE(S): 61-65 (Login), 85-89 (Signup)
🔍 ISSUE: Identical background styling (gradients and blur circles) and card structure.
⚠️  IMPACT: DRY violation; harder to change the look of the auth system.
✅ FIX: Extract an `AuthLayout` component or wrapper to handle the background and centered card structure.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚪ ARCHITECTURAL & BEST PRACTICE VIOLATIONS
📁 FILE: `src/app/globals.css`
📌 LINE(S): 108-113
🔍 ISSUE: Mixing `@apply` with raw CSS properties in the same block.
⚠️  IMPACT: Makes the CSS harder to read and maintain; inconsistent with Tailwind best practices.
✅ FIX: Move raw properties to a separate block or use Tailwind utility classes/config for gradients.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟣 PERFORMANCE REDUNDANCIES
📁 FILE: `src/app/api/backup/cron/route.ts`
📌 LINE(S): 43-73
🔍 ISSUE: Sequential processing of backups in a `for` loop.
⚠️  IMPACT: API route will likely time out if many users have backups enabled; inefficient use of resources.
✅ FIX: Use `Promise.all` for parallel processing (with concurrency limit) or a dedicated background task/worker queue.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚪ ARCHITECTURAL & BEST PRACTICE VIOLATIONS
📁 FILE: `src/app/api/backup/cron/route.ts`
📌 LINE(S): 46-58
🔍 ISSUE: Business logic for backup scheduling is embedded directly in the API route handler.
⚠️  IMPACT: Logic cannot be reused elsewhere; route handler becomes bloated and hard to test.
✅ FIX: Move scheduling logic (`shouldBackup`) to `BackupService`.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━c
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚪ ARCHITECTURAL & BEST PRACTICE VIOLATIONS
📁 FILE: `src/app/api/token-stats/route.ts`
📌 LINE(S): 4
🔍 ISSUE: Missing authentication check for `GET` requests.
⚠️  IMPACT: Sensitive AI token usage statistics might be publicly accessible.
✅ FIX: Add a session check using Supabase `auth.getUser()` or a secret key check.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 COMPONENT-LEVEL ISSUES
📁 FILE: `src/app/clients/page.tsx`
📌 LINE(S): 32-277
🔍 ISSUE: Monolithic component (277 lines) violating Single Responsibility Principle (SRP).
⚠️  IMPACT: Hard to test; hard to maintain; poor reusability.
✅ FIX: Extract `ClientCard`, `ClientSearch`, `ClientFilter`, and `AuthRequired` components.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟣 PERFORMANCE REDUNDANCIES
📁 FILE: `src/app/clients/page.tsx`
📌 LINE(S): 74
🔍 ISSUE: `uniqueTags` calculation happens on every render.
⚠️  IMPACT: Unnecessary computation, especially as client list grows.
✅ FIX: Wrap `uniqueTags` calculation in `useMemo`.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 COMPONENT-LEVEL ISSUES
📁 FILE: `src/app/crm/page.tsx`
📌 LINE(S): 1-1913
🔍 ISSUE: Extreme monolithic component (1913 lines). This is a "God Component" that handles data fetching, metrics, filtering, sorting, and renders 10+ sub-views and dialogs.
⚠️  IMPACT: Massive performance bottleneck; extremely difficult to debug or extend; violates almost every SRP and architectural best practice.
✅ FIX:
1. Move data fetching and metrics to a custom hook `useCrmData`.
2. Move state management to a Context or Store.
3. Extract each Sheet, Dialog, and View into its own file.
4. Use a component-based routing or sub-routing for tabs.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟣 PERFORMANCE REDUNDANCIES
📁 FILE: `src/app/crm/page.tsx`
📌 LINE(S): 498-513
🔍 ISSUE: N+1 query problem. Fetching line items in chunks inside a loop.
⚠️  IMPACT: Significant network overhead; slow dashboard loading; high database load.
✅ FIX: Use a single Postgres query with a join or an RPC function to fetch aggregated financial data.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 DEAD CODE
📁 FILE: `src/app/crm/page.tsx`
📌 LINE(S): 275-290
🔍 ISSUE: Redefinition of `getAvatarColor` which is already imported from `@/lib/utils` (line 31).
⚠️  IMPACT: Redundancy; potential for inconsistent logic if one is updated but not the other.
✅ FIX: Remove the local `getAvatarColor` and use the imported one.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚪ ARCHITECTURAL & BEST PRACTICE VIOLATIONS
📁 FILE: `src/app/crm/page.tsx`
📌 LINE(S): 296-446
🔍 ISSUE: Massive amount of business logic (complex metrics calculation) inside the UI component.
⚠️  IMPACT: Logic is not testable in isolation; component is bloated.
✅ FIX: Move metrics calculation logic to `src/app/crm/utils/metrics-utils.ts` or a dedicated service.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Phase 2: Component Audit (src/components)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 COMPONENT-LEVEL ISSUES
📁 FILE: `src/components/itinerary-timeline.tsx`
📌 LINE(S): 1-1016
🔍 ISSUE: Monolithic component handling too many responsibilities: DND logic, inline editing, and multiple banner types (Flight, Hotel, Cab, Bus).
⚠️  IMPACT: High complexity; difficult to modify or reuse specific banners elsewhere.
✅ FIX:
1. Extract `FlightBanner`, `HotelBanner`, `CabBanner`, and `BusBanner` into separate files in `src/components/banners`.
2. Extract `InlineEdit` into `src/components/ui`.
3. Move DND logic and handlers into a custom hook `useItineraryDnd`.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 DEAD CODE & REDUNDANCY
📁 FILE: `src/components/itinerary-timeline.tsx`
📌 LINE(S): 193-208
🔍 ISSUE: `ACTIVITY_FALLBACK_PHOTOS` and `getActivityFallbackUrl` are duplicated across multiple files (e.g., in trip cards or search results).
⚠️  IMPACT: Inconsistent fallback images; harder to update global assets.
✅ FIX: Move these to `src/lib/constants.ts` or a shared utility.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 COMPONENT-LEVEL ISSUES
📁 FILE: `src/components/pdf-template.tsx`
📌 LINE(S): 1-900
🔍 ISSUE: Massive monolithic file containing 5 different PDF themes, shared helpers, and styles.
⚠️  IMPACT: Extremely hard to maintain; bundle bloat; violation of SRP.
✅ FIX:
1. Create a `src/components/pdf/themes` directory.
2. Move each theme (`ClassicTheme`, `EditorialTheme`, etc.) to its own file.
3. Move shared PDF helpers (`formatCurrency`, `getAgentInfo`, etc.) to `src/components/pdf/utils.ts`.
4. Move `THEME_PATTERNS` and shared glass styles to `src/components/pdf/styles.ts`.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 REDUNDANCY & DUPLICATION
📁 FILE: `src/components/pdf-template.tsx`
📌 LINE(S): 54, 78, 5
🔍 ISSUE: Redundant currency formatting logic (`formatCurrency`, `formatMoneyWithDecimals`) that exists elsewhere in the codebase.
⚠️  IMPACT: Inconsistent currency display; maintenance burden.
✅ FIX: Unified currency formatting in `src/lib/utils/currency.ts`.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 COMPONENT-LEVEL ISSUES
📁 FILE: `src/components/vendor-enquiry.tsx`
📌 LINE(S): 1-843
🔍 ISSUE: Monolithic component handling form state, AI generation logic, persistence (Supabase), and history UI.
⚠️  IMPACT: High complexity; difficult to test; non-reusable parts.
✅ FIX:
1. Move AI generation logic to a custom hook `useVendorEnquiryAi`.
2. Extract the History Sheet into a separate component `src/components/vendor/EnquiryHistory.tsx`.
3. Move `FormField` to `src/components/ui`.
4. Create a specialized service for vendor enquiries persistence.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 COMPONENT-LEVEL ISSUES
📁 FILE: `src/components/financial-tracker.tsx`
📌 LINE(S): 1-961
🔍 ISSUE: Extreme "God Component" for finances. Handles everything from data extraction and transformation to reporting and UI for 5 different tabs.
⚠️  IMPACT: Maintenance nightmare; impossible to unit test; heavy re-renders.
✅ FIX:
1. Extract finance data logic into a custom hook `useFinancials`.
2. Extract each tab (`PaymentsTab`, `ExpensesTab`, `ReportsTab`, etc.) into its own component.
3. Centralize `extractTripCost` in a utility service.
4. Replace local SVG icons with standardized `lucide-react` icons.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 REDUNDANCY & DUPLICATION
📁 FILE: `src/components/financial-tracker.tsx`
📌 LINE(S): 470, 216
🔍 ISSUE: Local `cs` helper duplicates `getCurrencySymbol`. `extractTripCost` duplicates itinerary calculation logic found in `src/lib/itinerary-calculator.ts`.
⚠️  IMPACT: Logic drift; calculation inconsistencies across the app.
✅ FIX: Use shared utilities from `src/lib`.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 REDUNDANCY & DUPLICATION
📁 FILE: `src/types/financial.ts`, `src/lib/itinerary-calculator.ts`, `src/components/pdf-template.tsx`
📌 LINE(S): Various (`getCurrencySymbol`, `formatCurrency`)
🔍 ISSUE: Currency handling logic is re-implemented at least 5 times using different methods (Intl.NumberFormat vs manual maps).
⚠️  IMPACT: Inconsistent currency symbols and formatting across the app.
✅ FIX:
1. Centralize all currency logic in `src/lib/utils/currency.ts`.
2. Export `CURRENCY_SYMBOLS` and `formatMoney` from there.
3. Delete all local implementations.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 REDUNDANCY & DUPLICATION
📁 FILE: `src/lib/unsplash.ts`, `src/components/itinerary-timeline.tsx`, `src/lib/placeholder-images.ts`
📌 LINE(S): Various (`FALLBACK_IMAGES`, `ACTIVITY_FALLBACK_PHOTOS`)
🔍 ISSUE: Fallback image arrays are duplicated and inconsistent.
⚠️  IMPACT: Different parts of the app show different "no-image" states; hard to update brand assets.
✅ FIX: Centralize in `src/lib/constants/images.ts`.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏗️ ARCHITECTURAL DEBT
📁 SCOPE: Global
🔍 ISSUE: Lack of a unified Service Layer. Business logic for backups, CRM metrics, and pricing is scattered across API routes, components, and hooks.
⚠️  IMPACT: High coupling; difficult to maintain server-only logic; testing is nearly impossible.
✅ FIX:
1. Establish a `src/services` directory.
2. Extract logic into `BackupService`, `CrmService`, `FinancialService`, and `ItineraryService`.
3. UI components should only interact with these services or custom hooks that wrap them.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
