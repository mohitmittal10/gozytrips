# ⚡ Quick Start: Token Usage Tracking

## What You Now Have

Your codebase now automatically tracks every Gemini API call and calculates billing costs in real-time!

## 5-Minute Setup

### 1. **Verify Configuration**
No additional setup needed! The system works automatically with your existing `GEMINI_API_KEY`.

Optionally, for production security, add to `.env.local`:
```env
TOKEN_TRACKER_SECRET=your_secret_key
```

### 2. **Make API Calls**
Run your app normally. Every time you call the travel itinerary generator, token usage is automatically logged:
```bash
npm run dev
```

### 3. **View Your Costs**

**Option A: Visual Dashboard** (Recommended)
```
Open: http://localhost:3000/token-usage
```
Shows real-time metrics and visualizations.

**Option B: Command Line**
```bash
npm run token:stats
```
Shows detailed breakdown in terminal.

**Option C: Direct API**
```bash
curl "http://localhost:3000/api/token-stats?daysBack=7"
```

---

## Real-World Example

After running a few API calls:

```
📊 Token Usage Statistics (Last 30 days)

📈 Summary
  Total API Calls:      12
  Input Tokens:         5,243
  Output Tokens:        28,567
  Total Tokens:         33,810
  Estimated Cost:       $0.009876

🤖 Usage by Model
  gemini-2.5-flash-lite
    Calls:          12
    Input Tokens:   5,243
    Output Tokens:  28,567
    Total Tokens:   33,810
    Cost:           $0.009876

🔄 Usage by Flow
  generateTravelItineraryFlow
    Calls:          12
    Input Tokens:   5,243
    Output Tokens:  28,567
    Total Tokens:   33,810
    Cost:           $0.009876
```

---

## Command Reference

| Command | Purpose |
|---------|---------|
| `npm run token:stats` | View all-time statistics |
| `npm run token:stats:7d` | View last 7 days |
| `npm run token:stats:flow generateTravelItineraryFlow` | View stats for specific flow |
| `npm run token:clear` | Clear all logs (with confirmation) |

---

## Key Files Created

1. **`src/lib/token-tracker.ts`** - Core tracking logic
2. **`src/app/token-usage/page.tsx`** - Beautiful dashboard
3. **`src/app/api/token-stats/route.ts`** - API endpoints
4. **`scripts/token-usage-inspector.ts`** - CLI tool
5. **`docs/TOKEN_TRACKING.md`** - Full documentation

---

## Pricing Info

Currently configured with **Feb 2025 rates**:

- **gemini-2.5-flash-lite**: $0.075/M input, $0.3/M output tokens
- **gemini-1.5-pro**: $1.25/M input, $5/M output tokens

⚠️ **Update these prices in `src/lib/token-tracker.ts` as Google's pricing changes!**

---

## Common Questions

**Q: How often is usage data saved?**
A: Immediately after each API call. Data stored in `.token-usage.json`

**Q: Will this slow down my API calls?**
A: No! Logging happens asynchronously and is minimal overhead.

**Q: Can I export the data?**
A: Yes! The JSON file is plain text and can be opened/exported directly from `.token-usage.json`

**Q: What if I deploy to production?**
A: Add `TOKEN_TRACKER_SECRET` environment variable to `.env` for secure delete endpoint access.

**Q: Can I track other models besides Gemini?**
A: Currently configured for Gemini, but you can add other models to `TOKEN_PRICING` in `token-tracker.ts`

---

## Next Steps

1. ✅ Make some API calls to populate data
2. 📊 Check the dashboard at `/token-usage`
3. 🔍 Run `npm run token:stats` to see detailed breakdown
4. 📈 Monitor trends over time
5. 💰 Use cost data to choose between models/providers

---

## Need Help?

- **See full docs**: [TOKEN_TRACKING.md](docs/TOKEN_TRACKING.md)
- **See implementation details**: [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
- **Check CLI help**: `npx tsx scripts/token-usage-inspector.ts help`

---

That's it! You're all set to track your Gemini API usage and billing! 🎉
