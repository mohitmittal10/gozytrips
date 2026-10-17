/**
 * @fileOverview Token tracking utility for Gemini API calls.
 * Logs and stores token usage for billing calculations.
 *
 * LOCAL / DEV NOTE: persists to `.token-usage.json` on disk.
 * This will not work reliably on read-only serverless (App Hosting / Vercel).
 * Prefer a DB or observability backend for production metrics.
 * The CLI `scripts/token-usage-inspector.ts` is local-only.
 */

import fs from 'fs/promises';
import path from 'path';

export interface TokenUsageRecord {
  id: string;
  timestamp: string;
  flowName: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number; // Estimated cost in USD
}

export interface TokenStats {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  byModel: Record<string, any>;
  byFlow: Record<string, any>;
  records: TokenUsageRecord[];
}

/**
 * Gemini token pricing estimates (USD per token).
 * Update periodically against Google AI pricing; override via TOKEN_PRICE_* env if needed.
 */
const TOKEN_PRICING = {
  'gemini-3.5-flash-lite': {
    input: Number(process.env.TOKEN_PRICE_FLASH_LITE_INPUT ?? 0.3 / 1_000_000),
    output: Number(process.env.TOKEN_PRICE_FLASH_LITE_OUTPUT ?? 2.5 / 1_000_000),
  },
  'gemini-3.8-flash': {
    input: Number(process.env.TOKEN_PRICE_FLASH_INPUT ?? 0.75 / 1_000_000),
    output: Number(process.env.TOKEN_PRICE_FLASH_OUTPUT ?? 3.75 / 1_000_000),
  },
  'gemini-2.5-flash-lite': {
    input: Number(process.env.TOKEN_PRICE_FLASH_LITE_INPUT ?? 0.1 / 1_000_000),
    output: Number(process.env.TOKEN_PRICE_FLASH_LITE_OUTPUT ?? 0.4 / 1_000_000),
  },
  'gemini-1.5-pro': {
    input: Number(process.env.TOKEN_PRICE_PRO_INPUT ?? 1.25 / 1_000_000),
    output: Number(process.env.TOKEN_PRICE_PRO_OUTPUT ?? 5 / 1_000_000),
  },
  'gemini-1.5-flash': {
    input: Number(process.env.TOKEN_PRICE_FLASH_INPUT ?? 0.075 / 1_000_000),
    output: Number(process.env.TOKEN_PRICE_FLASH_OUTPUT ?? 0.3 / 1_000_000),
  },
};

const TOKEN_LOG_FILE = path.join(process.cwd(), '.token-usage.json');

async function ensureLogFile() {
  try {
    await fs.access(TOKEN_LOG_FILE);
  } catch {
    await fs.writeFile(TOKEN_LOG_FILE, JSON.stringify([], null, 2));
  }
}

async function readTokenLogs(): Promise<TokenUsageRecord[]> {
  try {
    await ensureLogFile();
    const data = await fs.readFile(TOKEN_LOG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading token logs:', error);
    return [];
  }
}

async function writeTokenLogs(records: TokenUsageRecord[]) {
  try {
    await fs.writeFile(TOKEN_LOG_FILE, JSON.stringify(records, null, 2));
  } catch (error) {
    console.error('Error writing token logs:', error);
  }
}

export async function logTokenUsage(
  flowName: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): Promise<TokenUsageRecord> {
  const totalTokens = inputTokens + outputTokens;
  const pricing = TOKEN_PRICING[model as keyof typeof TOKEN_PRICING] || TOKEN_PRICING['gemini-3.5-flash-lite'];
  const cost = inputTokens * pricing.input + outputTokens * pricing.output;

  const record: TokenUsageRecord = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    flowName,
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    cost,
  };

  try {
    const logs = await readTokenLogs();
    logs.push(record);
    await writeTokenLogs(logs);
  } catch (error) {
    // Gracefully handle read-only file systems (e.g., Vercel serverless)
    console.warn('Token usage logging skipped (file system may be read-only):', error instanceof Error ? error.message : error);
  }

  return record;
}

export async function getTokenStats(
  flowName?: string,
  model?: string,
  daysBack: number = 30
): Promise<TokenStats> {
  const logs = await readTokenLogs();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  let filteredLogs = logs.filter(log => new Date(log.timestamp) >= cutoffDate);

  if (flowName) {
    filteredLogs = filteredLogs.filter(log => log.flowName === flowName);
  }

  if (model) {
    filteredLogs = filteredLogs.filter(log => log.model === model);
  }

  const stats: TokenStats = {
    totalCalls: filteredLogs.length,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
    byModel: {},
    byFlow: {},
    records: filteredLogs.slice(-100), // Last 100 records
  };

  filteredLogs.forEach(log => {
    stats.totalInputTokens += log.inputTokens;
    stats.totalOutputTokens += log.outputTokens;
    stats.totalTokens += log.totalTokens;
    stats.estimatedCost += log.cost;

    // Group by model
    if (!stats.byModel[log.model]) {
      stats.byModel[log.model] = {
        calls: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        cost: 0,
      };
    }
    stats.byModel[log.model].calls++;
    stats.byModel[log.model].inputTokens += log.inputTokens;
    stats.byModel[log.model].outputTokens += log.outputTokens;
    stats.byModel[log.model].totalTokens += log.totalTokens;
    stats.byModel[log.model].cost += log.cost;

    // Group by flow
    if (!stats.byFlow[log.flowName]) {
      stats.byFlow[log.flowName] = {
        calls: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        cost: 0,
      };
    }
    stats.byFlow[log.flowName].calls++;
    stats.byFlow[log.flowName].inputTokens += log.inputTokens;
    stats.byFlow[log.flowName].outputTokens += log.outputTokens;
    stats.byFlow[log.flowName].totalTokens += log.totalTokens;
    stats.byFlow[log.flowName].cost += log.cost;
  });

  return stats;
}

export async function clearTokenLogs() {
  await writeTokenLogs([]);
}

