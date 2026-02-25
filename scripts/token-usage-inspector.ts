#!/usr/bin/env node

/**
 * CLI tool to inspect and manage token usage logs
 * Usage: npx tsx scripts/token-usage-inspector.ts [command]
 */

import { getTokenStats, clearTokenLogs } from '../src/lib/token-tracker';

type Command = 'stats' | 'clear' | 'help';

const command = (process.argv[2] as Command) || 'stats';

const formatCost = (cost: number) => `$${cost.toFixed(6)}`;
const formatNumber = (num: number) => num.toLocaleString();

async function showHelp() {
  console.log(`
Token Usage Inspector - CLI tool for managing token tracking

Usage:
  npx tsx scripts/token-usage-inspector.ts [command] [options]

Commands:
  stats [--days N] [--flow NAME] [--model NAME]  Show token usage statistics (default)
  clear                                           Clear all token logs
  help                                            Show this help message

Options:
  --days N       Number of days to look back (default: 30, max: 365)
  --flow NAME    Filter by flow name
  --model NAME   Filter by model name

Examples:
  npx tsx scripts/token-usage-inspector.ts stats
  npx tsx scripts/token-usage-inspector.ts stats --days 7
  npx tsx scripts/token-usage-inspector.ts stats --flow generateTravelItineraryFlow
  npx tsx scripts/token-usage-inspector.ts clear
  `);
}

async function showStats() {
  // Parse command line arguments
  const args = process.argv.slice(3);
  let daysBack = 30;
  let flowName: string | undefined;
  let model: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--days' && args[i + 1]) {
      daysBack = Math.min(parseInt(args[i + 1]), 365);
    } else if (args[i] === '--flow' && args[i + 1]) {
      flowName = args[i + 1];
    } else if (args[i] === '--model' && args[i + 1]) {
      model = args[i + 1];
    }
  }

  try {
    const stats = await getTokenStats(flowName, model, daysBack);

    console.log(`\n📊 Token Usage Statistics (Last ${daysBack} days)\n`);
    console.log('═'.repeat(60));

    // Summary
    console.log('\n📈 Summary');
    console.log(`  Total API Calls:      ${formatNumber(stats.totalCalls)}`);
    console.log(`  Input Tokens:         ${formatNumber(stats.totalInputTokens)}`);
    console.log(`  Output Tokens:        ${formatNumber(stats.totalOutputTokens)}`);
    console.log(`  Total Tokens:         ${formatNumber(stats.totalTokens)}`);
    console.log(`  Estimated Cost:       ${formatCost(stats.estimatedCost)}`);

    // By Model
    if (Object.keys(stats.byModel).length > 0) {
      console.log('\n🤖 Usage by Model');
      console.log('─'.repeat(60));
      Object.entries(stats.byModel).forEach(([modelName, data]) => {
        console.log(`\n  ${modelName}`);
        console.log(`    Calls:          ${formatNumber(data.calls)}`);
        console.log(`    Input Tokens:   ${formatNumber(data.inputTokens)}`);
        console.log(`    Output Tokens:  ${formatNumber(data.outputTokens)}`);
        console.log(`    Total Tokens:   ${formatNumber(data.totalTokens)}`);
        console.log(`    Cost:           ${formatCost(data.cost)}`);
      });
    }

    // By Flow
    if (Object.keys(stats.byFlow).length > 0) {
      console.log('\n🔄 Usage by Flow');
      console.log('─'.repeat(60));
      Object.entries(stats.byFlow).forEach(([flowNameKey, data]) => {
        console.log(`\n  ${flowNameKey}`);
        console.log(`    Calls:          ${formatNumber(data.calls)}`);
        console.log(`    Input Tokens:   ${formatNumber(data.inputTokens)}`);
        console.log(`    Output Tokens:  ${formatNumber(data.outputTokens)}`);
        console.log(`    Total Tokens:   ${formatNumber(data.totalTokens)}`);
        console.log(`    Cost:           ${formatCost(data.cost)}`);
      });
    }

    // Recent records
    if (stats.records.length > 0) {
      console.log('\n📝 Recent API Calls (Last 10)');
      console.log('─'.repeat(60));
      stats.records.slice(-10).reverse().forEach((record, index) => {
        const date = new Date(record.timestamp).toLocaleString();
        console.log(`\n  ${index + 1}. ${date}`);
        console.log(`    Flow:    ${record.flowName}`);
        console.log(`    Model:   ${record.model}`);
        console.log(`    Input:   ${formatNumber(record.inputTokens)} tokens`);
        console.log(`    Output:  ${formatNumber(record.outputTokens)} tokens`);
        console.log(`    Total:   ${formatNumber(record.totalTokens)} tokens`);
        console.log(`    Cost:    ${formatCost(record.cost)}`);
      });
    }

    console.log('\n' + '═'.repeat(60) + '\n');
  } catch (error) {
    console.error('Error fetching token statistics:', error);
    process.exit(1);
  }
}

async function clearLogs() {
  try {
    const confirm = await new Promise<string>(resolve => {
      process.stdout.write('⚠️  Are you sure you want to clear all token logs? (yes/no): ');
      process.stdin.setEncoding('utf8');
      process.stdin.once('data', (answer) => {
        resolve(answer.toString().trim().toLowerCase());
      });
    });

    if (confirm === 'yes' || confirm === 'y') {
      await clearTokenLogs();
      console.log('✅ Token logs cleared successfully\n');
    } else {
      console.log('❌ Operation cancelled\n');
    }
  } catch (error) {
    console.error('Error clearing token logs:', error);
    process.exit(1);
  }
}

async function main() {
  if (command === 'help') {
    await showHelp();
  } else if (command === 'stats') {
    await showStats();
  } else if (command === 'clear') {
    await clearLogs();
  } else {
    console.log(`Unknown command: ${command}`);
    await showHelp();
    process.exit(1);
  }
}

main().catch(console.error);
