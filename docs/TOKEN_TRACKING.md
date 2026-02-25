# Gemini API Token Usage Tracking

This document explains how the token tracking system works and how to use it to monitor your Gemini API billing.

## Overview

The token tracking system automatically logs all Gemini API calls and their token consumption. You can track:
- Total tokens used (input + output)
- Cost per API call
- Usage breakdown by model and flow
- Historical data for billing analysis

## Features

✅ **Automatic Tracking** - Captures token usage from every Genkit flow execution  
✅ **Pricing Tracking** - Calculates estimated costs based on current Google pricing  
✅ **Dashboard** - Visual interface to view usage statistics  
✅ **API Endpoints** - Programmatic access to token data  
✅ **Local Storage** - Token logs stored in `.token-usage.json`

## How It Works

1. Every time you call a Genkit flow that calls the Gemini API, the token usage is automatically captured
2. The usage data includes:
   - Number of input tokens used
   - Number of output tokens generated
   - Total tokens consumed
   - Estimated cost (based on current pricing)
3. Data is persisted to `.token-usage.json` in your project root
4. You can view statistics via the dashboard or API

## Usage

### 🎨 View Dashboard

Navigate to: `http://localhost:3000/token-usage`

The dashboard shows:
- Total API calls in the period
- Input/output/total token counts
- Estimated cost
- Breakdown by model and flow
- Recent API call history

### 📊 Query Token Stats via API

Get overall stats for the last 30 days:
```bash
curl http://localhost:3000/api/token-stats
```

Get stats for a specific flow:
```bash
curl "http://localhost:3000/api/token-stats?flowName=generateTravelItineraryFlow"
```

Get stats for a specific model:
```bash
curl "http://localhost:3000/api/token-stats?model=gemini-2.5-flash-lite"
```

Get stats for the last 7 days:
```bash
curl "http://localhost:3000/api/token-stats?daysBack=7"
```

### 🧹 Clear Token Logs

In development:
```bash
curl -X DELETE http://localhost:3000/api/token-stats
```

In production (requires authentication):
```bash
curl -X DELETE http://localhost:3000/api/token-stats \
  -H "x-api-key: YOUR_TOKEN_TRACKER_SECRET"
```

## Configuration

### Update Token Pricing

Edit `src/lib/token-tracker.ts` and update the `TOKEN_PRICING` object with current rates:

```typescript
const TOKEN_PRICING = {
  'gemini-2.5-flash-lite': {
    input: 0.075 / 1_000_000,  // $X per million input tokens
    output: 0.3 / 1_000_000,   // $X per million output tokens
  },
  'gemini-1.5-pro': {
    input: 1.25 / 1_000_000,
    output: 5 / 1_000_000,
  },
};
```

### Setup Production Authentication

Add to your `.env.local`:
```
TOKEN_TRACKER_SECRET=your_secret_key_here
```

## Adding Token Tracking to New Flows

When creating a new Genkit flow:

1. Import the logging function:
```typescript
import { logTokenUsage } from '@/lib/token-tracker';
```

2. Capture usage from the response:
```typescript
const flowName = ai.defineFlow(
  { name: 'myFlow', inputSchema: InputSchema, outputSchema: OutputSchema },
  async (input) => {
    const { output, usage } = await prompt(input);
    
    // Log token usage
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

## Data Structure

### Token Usage Record
```typescript
{
  id: string;              // Unique identifier
  timestamp: string;       // ISO 8601 timestamp
  flowName: string;        // Name of the Genkit flow
  model: string;          // Model used (e.g., 'gemini-2.5-flash-lite')
  inputTokens: number;    // Tokens consumed by input
  outputTokens: number;   // Tokens generated in output
  totalTokens: number;    // Total tokens (input + output)
  cost: number;           // Estimated cost in USD
}
```

### Token Stats Response
```typescript
{
  totalCalls: number;                    // Total API calls
  totalInputTokens: number;              // Sum of all input tokens
  totalOutputTokens: number;             // Sum of all output tokens
  totalTokens: number;                   // Sum of all tokens
  estimatedCost: number;                 // Total estimated cost in USD
  byModel: {
    [modelName]: {
      calls: number;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      cost: number;
    }
  },
  byFlow: {
    [flowName]: {
      calls: number;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      cost: number;
    }
  },
  records: TokenUsageRecord[];           // Last 100 records
}
```

## Troubleshooting

### Token data not appearing?

1. Ensure your flows are returning usage metadata from Genkit
2. Check that `.token-usage.json` file is being created
3. Verify the flow is actually being called

### Cost calculations seem off?

1. Check that `TOKEN_PRICING` in `src/lib/token-tracker.ts` matches current Google pricing
2. Use the dashboard to verify token counts
3. Reference Google's official pricing page for accuracy

### Dashboard not loading?

1. Ensure the API route `/api/token-stats` is accessible
2. Check browser console for errors
3. Run `npm run build` to ensure TypeScript compilation succeeds

## Current Pricing (as of Feb 2025)

Note: Update these values in `src/lib/token-tracker.ts` as Google's pricing changes.

| Model | Input | Output |
|-------|-------|--------|
| gemini-2.5-flash-lite | $0.075/M | $0.3/M |
| gemini-1.5-pro | $1.25/M | $5/M |
| gemini-1.5-flash | $0.075/M | $0.3/M |

## Next Steps

- Monitor your usage regularly using the dashboard
- Set up alerts if costs exceed budget (not yet implemented)
- Review and optimize expensive flows
- Check usage patterns to understand billing trends
