#!/usr/bin/env node
import { Command } from 'commander';
import { loadConfig } from '../config/loader.js';
import { orchestrate } from '../engine/orchestrator.js';
import type { InteractionMode, ModelConfig } from '../types/index.js';
import chalk from 'chalk';
import ora from 'ora';

const program = new Command();

program.name('mrx').description('Multi-role model orchestration CLI').version('0.1.0');

// One-shot command
program
  .command('ask <prompt>')
  .description('One-shot: send a prompt and print the response')
  .option('-m, --mode <mode>', 'Interaction mode', 'think_then_answer')
  .option('-c, --config <path>', 'Path to config file')
  .option('--show-reasoning', 'Print the reasoning trace')
  .action(async (prompt: string, opts) => {
    const config = loadConfig(opts.config);
    const mode = (opts.mode ?? config.default_mode) as InteractionMode;

    const spinner = ora({ text: chalk.dim('Thinking...'), color: 'cyan' }).start();

    try {
      const result = await orchestrate(prompt, [], config, mode);
      spinner.stop();

      if (opts.showReasoning && result.reasoning) {
        console.log(chalk.dim('─── Reasoning ───'));
        console.log(chalk.dim(result.reasoning));
        console.log(chalk.dim('─────────────────'));
      }

      console.log(result.finalResponse);
    } catch (error) {
      spinner.fail(chalk.red('Failed'));
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });

// Interactive TUI
program
  .command('chat')
  .description('Start an interactive TUI session')
  .option('-m, --mode <mode>', 'Interaction mode')
  .option('-c, --config <path>', 'Path to config file')
  .option('-s, --session <id>', 'Resume a session by ID')
  .action(async (opts) => {
    if (!process.stdin.isTTY) {
      console.error('mrx chat requires an interactive terminal (TTY).');
      process.exit(1);
    }

    const { render } = await import('ink');
    const { default: App } = await import('../tui/App.js');
    const React = await import('react');

    const config = loadConfig(opts.config);
    render(
      React.default.createElement(App, {
        config,
        sessionId: opts.session,
        initialMode: opts.mode,
      }),
    );
  });

// Session management
program
  .command('sessions')
  .description('List saved sessions')
  .option('-c, --config <path>', 'Path to config file')
  .action(async (opts) => {
    const config = loadConfig(opts.config);
    if (!config.session_memory) {
      console.log(chalk.yellow('Session memory is disabled in config.'));
      return;
    }
    const { SessionStore } = await import('../session/store.js');
    const store = new SessionStore(config.session_db_path);
    const sessions = store.listSessions();
    store.close();

    if (sessions.length === 0) {
      console.log(chalk.dim('No sessions yet.'));
      return;
    }

    for (const s of sessions) {
      console.log(
        `${chalk.cyan(s.id.slice(0, 8))} ${chalk.bold(s.name)} ` +
          `${chalk.dim(`[${s.mode}]`)} ${chalk.dim(`${s.messageCount} messages`)}`,
      );
    }
  });

// Config check
program
  .command('check')
  .description('Validate config and test provider connectivity')
  .option('-c, --config <path>', 'Path to config file')
  .action(async (opts) => {
    const config = loadConfig(opts.config);
    console.log(chalk.green('✓ Config valid'));
    console.log(
      chalk.dim(
        `  Reasoner:    ${config.models.reasoner.provider}/${config.models.reasoner.model}`,
      ),
    );
    console.log(
      chalk.dim(
        `  Executor:    ${config.models.executor.provider}/${config.models.executor.model}`,
      ),
    );
    if (config.models.tool_caller) {
      console.log(
        chalk.dim(
          `  Tool caller: ${config.models.tool_caller.provider}/${config.models.tool_caller.model}`,
        ),
      );
    }

    console.log('');
    console.log(chalk.dim('Testing provider connectivity...'));

    const { generate } = await import('../providers/adapter.js');

    const modelsToCheck: Array<[string, ModelConfig]> = [
      ['reasoner', config.models.reasoner],
      ['executor', config.models.executor],
      ...(config.models.tool_caller
        ? [['tool_caller', config.models.tool_caller] as [string, ModelConfig]]
        : []),
    ];

    let allOk = true;
    for (const [role, modelConfig] of modelsToCheck) {
      const label = `${role} (${modelConfig.provider}/${modelConfig.model})`;
      const spinner = ora({ text: chalk.dim(`Pinging ${label}...`), color: 'cyan' }).start();
      const start = Date.now();
      try {
        await generate({
          modelConfig: { ...modelConfig, maxTokens: 5 },
          messages: [{ role: 'user', content: 'Reply with: ok' }],
          system: 'Reply with exactly: ok',
        });
        spinner.succeed(chalk.green(`${label}: OK`) + chalk.dim(` (${Date.now() - start}ms)`));
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        spinner.fail(chalk.red(`${label}: FAILED`) + chalk.dim(` — ${msg}`));
        allOk = false;
      }
    }

    if (!allOk) process.exit(1);
  });

program.parse();
