import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function run(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: 'utf-8' });
  return (result.stdout || '') + (result.stderr || '');
}

const evalRuns = JSON.parse(readFileSync('data/eval-runs.json', 'utf-8'));
console.log(`Checking ${evalRuns.length} eval runs...\n`);

const results = [];
let completed = 0, inProgress = 0, failed = 0;

for (const { skill, path, eval_id } of evalRuns) {
  const output = run('tessl', ['eval', 'view', eval_id]);

  if (output.includes('In Progress')) {
    inProgress++;
    continue;
  }

  // Parse text output for scores
  const baselineMatch = output.match(/Baseline \(without context\) avg:\s*(\d+)%/);
  const contextMatch = output.match(/With context avg:\s*(\d+)%/);
  const statusCompleted = output.includes('Completed');
  const statusFailed = output.includes('Failed') || output.includes('✘');

  if (statusCompleted || (baselineMatch && contextMatch)) {
    const baseline = baselineMatch ? parseInt(baselineMatch[1]) : null;
    const withContext = contextMatch ? parseInt(contextMatch[1]) : null;
    const lift = (baseline != null && withContext != null) ? withContext - baseline : null;

    results.push({
      skill,
      path,
      eval_id,
      status: 'completed',
      baseline_avg: baseline,
      with_context_avg: withContext,
      lift,
    });

    const liftStr = lift != null ? `(${lift >= 0 ? '+' : ''}${lift}%)` : '';
    console.log(`✅ ${skill}: baseline=${baseline ?? '?'}% → with-context=${withContext ?? '?'}% ${liftStr}`);
    completed++;
  } else if (statusFailed) {
    // Partial results may still be available
    const baseline = baselineMatch ? parseInt(baselineMatch[1]) : null;
    const withContext = contextMatch ? parseInt(contextMatch[1]) : null;
    const lift = (baseline != null && withContext != null) ? withContext - baseline : null;

    results.push({
      skill,
      path,
      eval_id,
      status: 'partial',
      baseline_avg: baseline,
      with_context_avg: withContext,
      lift,
    });

    const liftStr = lift != null ? `(${lift >= 0 ? '+' : ''}${lift}%)` : '';
    console.log(`⚠️  ${skill}: partial — baseline=${baseline ?? '?'}% → with-context=${withContext ?? '?'}% ${liftStr}`);
    failed++;
  } else {
    inProgress++;
  }
}

// Sort by lift descending
results.sort((a, b) => (b.lift || 0) - (a.lift || 0));

writeFileSync('data/eval-results.json', JSON.stringify(results, null, 2) + '\n');

console.log(`\n📊 Summary:`);
console.log(`  Completed: ${completed}`);
console.log(`  In Progress: ${inProgress}`);
console.log(`  Failed: ${failed}`);

if (results.length > 0) {
  const lifts = results.filter(r => r.lift != null).map(r => r.lift);
  if (lifts.length > 0) {
    const avgLift = lifts.reduce((a, b) => a + b, 0) / lifts.length;
    const avgBaseline = results.filter(r => r.baseline_avg != null).map(r => r.baseline_avg);
    const avgWithContext = results.filter(r => r.with_context_avg != null).map(r => r.with_context_avg);

    console.log(`\n🎯 Eval Scores (${lifts.length} skills with data):`);
    console.log(`  Avg Baseline: ${(avgBaseline.reduce((a, b) => a + b, 0) / avgBaseline.length).toFixed(1)}%`);
    console.log(`  Avg With Context: ${(avgWithContext.reduce((a, b) => a + b, 0) / avgWithContext.length).toFixed(1)}%`);
    console.log(`  Avg Lift: +${avgLift.toFixed(1)}%`);

    console.log(`\n🏆 Top 10 by Lift:`);
    results.filter(r => r.lift != null).slice(0, 10).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.skill}: ${r.baseline_avg}% → ${r.with_context_avg}% (+${r.lift}%)`);
    });
  }
}

console.log(`\nResults saved to data/eval-results.json`);
