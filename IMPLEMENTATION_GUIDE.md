# Token Usage Tracking Implementation Summary

## What Was Added

A complete token tracking system has been implemented to help you monitor and calculate Gemini API billing. Here's what was created:

### 1. **Token Tracker Library** (`src/lib/token-tracker.ts`)
- Core module for logging and retrieving token usage
- Automatically calculates costs based on current Google pricing
- Stores logs in `.token-usage.json` (local file persistence)
- Provides functions:
  - `logTokenUsage()` - Records API call usage
  - `getTokenStats()` - Retrieves statistics with filters
  - `clearTokenLogs()` - Wipes all logs

### 2. **Updated Travel Itinerary Flow** (`src/ai/flows/generate-travel-itinerary.ts`)
- Modified to capture and log token usage from API responses
- Extracts `inputTokens` and `outputTokens` from Genkit responses
- Automatically calls `logTokenUsage()` after each API call

### 3. **Token Stats API Endpoint** (`src/app/api/token-stats/route.ts`)
- `GET /api/token-stats` - Retrieve statistics
  - Query parameters: `daysBack`, `flowName`, `model`
  - Returns: Total costs, tokens, breakdown by model/flow, recent records
- `DELETE /api/token-stats` - Clear logs (dev mode or with secret key)

### 4. **Visual Dashboard** (`src/app/token-usage/page.tsx`)
- Beautiful dashboard at `/token-usage` route
- Shows real-time metrics:
  - Total API calls
  - Token consumption (input/output/total)
  - Estimated cost in USD
  - Breakdown by model and flow
  - Recent API call history with cost per call
- Filter options: Last 7/30/90 days

### 5. **CLI Inspector Tool** (`scripts/token-usage-inspector.ts`)
- Command-line interface for managing token data
- Commands:
  - `npm run token:stats` - View all statistics
  - `npm run token:stats:7d` - Last 7 days only
  - `npm run token:stats:flow` - Filter by flow name
  - `npm run token:clear` - Clear all logs

### 6. **Documentation** (`docs/TOKEN_TRACKING.md`)
- Complete guide on using the system
- Pricing information
- API endpoint examples
- Troubleshooting guide
- How to add tracking to new flows

---

## How to Use

### 🎨 View Dashboard
```
http://localhost:3000/token-usage
```

### 📊 Check Stats via CLI
```bash
npm run token:stats           # All time
npm run token:stats:7d        # Last 7 days
npm run token:stats:flow generateTravelItineraryFlow
```

### 🔍 Query via API
```bash
curl http://localhost:3000/api/token-stats?daysBack=30
```

### 📝 Check Log Files
Token data is stored in `.token-usage.json` at project root (add to `.gitignore` if needed)

---

## Token Pricing (Current - Feb 2025)

| Model | Input | Output |
|-------|-------|--------|
| gemini-2.5-flash-lite | $0.075/M tokens | $0.3/M tokens |
| gemini-1.5-pro | $1.25/M tokens | $5/M tokens |

Update pricing in `src/lib/token-tracker.ts` as Google's rates change.

---

## Key Metrics You Can Track

✅ **Per API Call:**
- Input tokens used
- Output tokens generated
- Total tokens
- Estimated cost

✅ **Aggregated Stats:**
- Total calls made
- Total tokens consumed
- Estimated total cost
- Breakdown by model
- Breakdown by flow
- Time-based filtering (7/30/90 days)

---

## Integration with New Flows

When you create new Genkit flows in the future, add token tracking with:

```typescript
import { logTokenUsage } from '@/lib/token-tracker';

const myFlow = ai.defineFlow(
  { name: 'myFlow', inputSchema: S, outputSchema: O },
  async (input) => {
    const { output, usage } = await prompt(input);
    
    if (usage) {
      await logTokenUsage(
        'myFlow',
        'gemini-2.5-flash-lite',
        usage.inputTokens || 0,
        usage.outputTokens || 0
      );
    }
    
    return output;
  }
);
```

---

## Important Notes

1. **Local File Storage**: Token logs are stored in `.token-usage.json` - this is a local file that won't sync across machines
2. **Add to .gitignore**: Consider adding `.token-usage.json` to your `.gitignore` to avoid checking it into version control
3. **Pricing Updates**: Check Google's pricing page regularly and update `TOKEN_PRICING` in `token-tracker.ts`
4. **Production Deployment**: 
   - Add `TOKEN_TRACKER_SECRET` env variable for DELETE endpoint security
   - Consider using a database for persistent tracking across deployments instead of local files

---

## Next Steps

1. ✅ Start making API calls through your flows
2. Visit `/token-usage` to see the dashboard populate
3. Use `npm run token:stats` to check CLI output
4. Decide on optimal models based on token usage patterns
5. Set up alerts if you plan to add cost limits (future enhancement)

---

## File Structure Added

```
.env.example                           # Updated with TOKEN_TRACKER_SECRET
src/
├── lib/
│   └── token-tracker.ts              # Core tracking logic
├── ai/
│   └── flows/
│       └── generate-travel-itinerary.ts  # Updated with logging
├── app/
│   ├── api/
│   │   └── token-stats/
│   │       └── route.ts              # API endpoints
│   └── token-usage/
│       └── page.tsx                  # Dashboard UI
scripts/
└── token-usage-inspector.ts          # CLI tool
docs/
└── TOKEN_TRACKING.md                 # Complete documentation
package.json                           # Updated with new scripts
```
