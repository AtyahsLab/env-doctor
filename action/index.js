const core = require('@actions/core');
const github = require('@actions/github');
const path = require('path');
const fs = require('fs');
const { parseEnvFile, parseSchemaFile } = require('../src/parser');
const { validateAgainstSchema, detectIssues } = require('../src/validator');

async function run() {
  try {
    const schemaPath = core.getInput('schema') || '.env.schema';
    const envFilesInput = core.getInput('env-files') || '.env';
    const failOnWarn = core.getInput('fail-on-warn') === 'true';

    const envFiles = envFilesInput.split(',').map(f => f.trim()).filter(Boolean);
    const workspace = process.env.GITHUB_WORKSPACE || '.';

    let totalErrors = 0;
    let totalWarnings = 0;
    const allResults = [];

    // Parse schema
    const fullSchemaPath = path.join(workspace, schemaPath);
    const schema = parseSchemaFile(fullSchemaPath);

    if (!schema) {
      core.setFailed(`Schema file not found: ${schemaPath}`);
      return;
    }

    for (const envFile of envFiles) {
      const fullEnvPath = path.join(workspace, envFile);
      const env = parseEnvFile(fullEnvPath);

      if (!env) {
        allResults.push({ file: envFile, error: 'File not found', issues: [], extras: [] });
        totalErrors++;
        continue;
      }

      // Schema validation
      const issues = validateAgainstSchema(env.vars, schema);

      // Extra keys not in schema
      const extraKeys = env.order.filter(k => !(k in schema));

      // Heuristic checks
      const heuristics = [];
      for (const [key, entry] of Object.entries(env.vars)) {
        for (const issue of detectIssues(key, entry.value)) {
          heuristics.push({ key, ...issue });
        }
      }

      const fileErrors = issues.filter(i => i.level === 'error').length +
        heuristics.filter(i => i.level === 'error').length;
      const fileWarnings = issues.filter(i => i.level === 'warn').length +
        heuristics.filter(i => i.level === 'warn').length +
        extraKeys.length;

      totalErrors += fileErrors;
      totalWarnings += fileWarnings;

      allResults.push({
        file: envFile,
        issues,
        heuristics,
        extras: extraKeys,
        errors: fileErrors,
        warnings: fileWarnings,
      });
    }

    // Generate summary for GitHub Actions
    const summaryLines = ['## 🩺 env-doctor Report\n'];

    for (const result of allResults) {
      summaryLines.push(`### \`${result.file}\``);

      if (result.error) {
        summaryLines.push(`❌ ${result.error}\n`);
        continue;
      }

      if (result.errors === 0 && result.warnings === 0) {
        summaryLines.push('✅ All checks passed!\n');
        continue;
      }

      if (result.issues.length) {
        summaryLines.push('| Variable | Level | Issue |');
        summaryLines.push('|----------|-------|-------|');
        for (const issue of result.issues) {
          const icon = issue.level === 'error' ? '❌' : '⚠️';
          summaryLines.push(`| \`${issue.key}\` | ${icon} ${issue.level} | ${issue.message} |`);
        }
        summaryLines.push('');
      }

      if (result.heuristics && result.heuristics.length) {
        summaryLines.push('**Heuristic warnings:**');
        for (const h of result.heuristics) {
          const icon = h.level === 'error' ? '❌' : '⚠️';
          summaryLines.push(`- ${icon} \`${h.key}\`: ${h.message}`);
        }
        summaryLines.push('');
      }

      if (result.extras.length) {
        summaryLines.push(`**⚠️ ${result.extras.length} variable(s) not in schema:** ${result.extras.map(k => `\`${k}\``).join(', ')}\n`);
      }
    }

    // Totals
    summaryLines.push('---');
    if (totalErrors === 0 && totalWarnings === 0) {
      summaryLines.push('✅ **All checks passed!**');
    } else {
      const parts = [];
      if (totalErrors) parts.push(`❌ ${totalErrors} error(s)`);
      if (totalWarnings) parts.push(`⚠️ ${totalWarnings} warning(s)`);
      summaryLines.push(`**Result:** ${parts.join(', ')}`);
    }

    const summaryText = summaryLines.join('\n');

    // Write to GitHub Actions job summary
    core.summary.addRaw(summaryText).write();

    // Post PR comment if this is a pull request
    const token = process.env.GITHUB_TOKEN;
    if (token && github.context.payload.pull_request) {
      try {
        const octokit = github.getOctokit(token);
        const { owner, repo } = github.context.repo;
        const prNumber = github.context.payload.pull_request.number;

        // Find existing comment to update
        const { data: comments } = await octokit.rest.issues.listComments({
          owner, repo, issue_number: prNumber,
        });
        const botComment = comments.find(c =>
          c.user.type === 'Bot' && c.body.includes('🩺 env-doctor Report')
        );

        const body = summaryText;

        if (botComment) {
          await octokit.rest.issues.updateComment({
            owner, repo, comment_id: botComment.id, body,
          });
        } else {
          await octokit.rest.issues.createComment({
            owner, repo, issue_number: prNumber, body,
          });
        }
      } catch (err) {
        core.warning(`Failed to post PR comment: ${err.message}`);
      }
    }

    // Set outputs
    core.setOutput('errors', totalErrors);
    core.setOutput('warnings', totalWarnings);

    // Fail if needed
    if (totalErrors > 0) {
      core.setFailed(`env-doctor found ${totalErrors} error(s)`);
    } else if (failOnWarn && totalWarnings > 0) {
      core.setFailed(`env-doctor found ${totalWarnings} warning(s) (fail-on-warn enabled)`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
