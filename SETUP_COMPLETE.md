# 🎯 Token Usage Tracking System - Complete Setup

## Summary

I've built a **complete token tracking system** for your Gemini API calls that automatically logs token usage and calculates billing costs. Here's what was created:

---

## 📦 What Was Created

### Core Files
| File | Purpose |
|------|---------|
| `src/lib/token-tracker.ts` | Token logging & statistics library |
| `src/ai/flows/generate-travel-itinerary.ts` | **Updated** with automatic token logging |
| `src/app/api/token-stats/route.ts` | REST API for querying statistics |
| `src/app/token-usage/page.tsx` | Beautiful dashboard UI |
| `scripts/token-usage-inspector.ts` | CLI tool for terminal access |

### Documentation
| File | Purpose |
|------|---------|
| `QUICKSTART.md` | 5-minute setup guide (START HERE!) |
| `IMPLEMENTATION_GUIDE.md` | Technical implementation details |
| `docs/TOKEN_TRACKING.md` | Complete usage guide & troubleshooting |

### Configuration
| File | Purpose |
|------|---------|
| `package.json` | **Updated** with new npm scripts |
| `.env.example` | **Updated** with TOKEN_TRACKER_SECRET |
| `.gitignore` | **Updated** to ignore token logs |

---

## 🚀 Quick Usage

### 1️⃣ View Dashboard
```
http://localhost:3000/token-usage
```
Real-time metrics, charts, and recent API calls.

### 2️⃣ Check Stats in Terminal
```bash
npm run token:stats
```

### 3️⃣ Query via API
```bash
curl "http://localhost:3000/api/token-stats?daysBack=30"
```

---

## 📊 What You Can Track

For **each API call**, you now see:
- ✅ Input tokens used
- ✅ Output tokens generated  
- ✅ Total token count
- ✅ Estimated cost (calculated automatically)
- ✅ Timestamp & flow name
- ✅ Model used

**Aggregated over time:**
- ✅ Total API calls made
- ✅ Total token consumption
- ✅ Total estimated cost
- ✅ Breakdown by model
- ✅ Breakdown by flow
- ✅ Trends over 7/30/90 days

---

## 💡 Example Output

```
📊 Token Usage Statistics (Last 30 days)

📈 Summary
  Total API Calls:          12
  Input Tokens:             5,243
  Output Tokens:            28,567
  Total Tokens:             33,810
  Estimated Cost:           $0.009876

🎯 Breakdown by Flow
  generateTravelItineraryFlow
    Calls:        12
    Cost:         $0.009876
    Avg Cost/Call: $0.000823

🤖 Breakdown by Model
  gemini-2.5-flash-lite
    Calls:        12
    Cost:         $0.009876
```

---

## 🏗️ Architecture

```
User Makes API Call
        ↓
Genkit Flow Executes
        ↓
Gemini API Returns Response + Usage Metadata
        ↓
logTokenUsage() Called Automatically
        ↓
Data Saved to .token-usage.json
        ↓
Dashboard/API/CLI Can Query the Data
```

---

## 📱 Available Commands

```bash
# View all statistics
npm run token:stats

# View last 7 days only
npm run token:stats:7d

# Filter by specific flow
npm run token:stats:flow generateTravelItineraryFlow

# Clear all logs (with confirmation)
npm run token:clear
```

---

## 🔧 Key Features

✨ **Automatic** - No configuration needed, just run your app
📊 **Real-time** - Data logged immediately after each API call
💾 **Persistent** - Stored in `.token-usage.json`
🔐 **Secure** - Production DELETE endpoint requires authentication
📈 **Detailed** - Track by flow, model, time period
💰 **Cost Tracking** - Automatic billing calculations based on Google's pricing
🎨 **User-Friendly** - Dashboard + CLI + API access

---

## 💻 Technical Details

### How It Works
1. When you call a Genkit flow, the response includes `usage` metadata from Google
2. We extract `inputTokens` and `outputTokens`
3. We calculate cost using current Google pricing
4. We store a record in `.token-usage.json`
5. Dashboard/API retrieve and display this data

### Current Pricing (Feb 2025)
- **gemini-2.5-flash-lite**: $0.075/M input, $0.3/M output
- **gemini-1.5-pro**: $1.25/M input, $5/M output  
- **gemini-1.5-flash**: $0.075/M input, $0.3/M output

⚠️ Update in `src/lib/token-tracker.ts` when prices change

---

## 🔮 Next Steps

1. **Start using it**
   - Run your app: `npm run dev`
   - Make some API calls
   - Visit `/token-usage` to see data populate

2. **Monitor your usage**
   - Use dashboard for visual overview
   - Use CLI for quick checks: `npm run token:stats`
   - Set a routine to review weekly costs

3. **Optimize based on findings**
   - Check which flows use most tokens
   - Consider switching models based on cost/performance
   - Adjust parameters to reduce token usage

4. **Future enhancements** (not implemented yet)
   - Cost alerts/budgets
   - Database backend for cloud deployment
   - Export to CSV
   - Multi-user tracking

---

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** ← Start here for quick setup
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** ← Technical architecture
- **[docs/TOKEN_TRACKING.md](docs/TOKEN_TRACKING.md)** ← Complete reference

---

## 🎓 How to Add Tracking to New Flows

When you create additional Genkit flows:

```typescript
import { logTokenUsage } from '@/lib/token-tracker';

const myFlow = ai.defineFlow(
  { name: 'myFlow', inputSchema: S, outputSchema: O },
  async (input) => {
    const { output, usage } = await prompt(input);
    
    // Capture and log usage
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

## 🆘 Troubleshooting

**Q: I don't see data in the dashboard**
A: Make API calls first to generate logs. Check `.token-usage.json` exists.

**Q: Costs seem incorrect**
A: Verify pricing in `src/lib/token-tracker.ts` matches Google's current rates.

**Q: Can I reset the logs?**
A: Run `npm run token:clear` or manually delete `.token-usage.json`

**Q: For production deployment**
A: Add `TOKEN_TRACKER_SECRET=your_key` to environment variables for secure DELETE endpoint.

---

## ✅ Checklist

- ✅ Token tracking library created
- ✅ Travel itinerary flow updated with logging
- ✅ API endpoints created
- ✅ Dashboard UI built
- ✅ CLI tool created
- ✅ npm scripts added
- ✅ Documentation written
- ✅ Token log file added to .gitignore
- ✅ Environment configuration template created

---

## 🎉 You're All Set!

Everything is ready to go. Start your app and watch your token usage appear in real-time!

```bash
npm run dev
# Then visit: http://localhost:3000/token-usage
```

Happy tracking! 📊💰
