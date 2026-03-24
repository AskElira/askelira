// ============================================================
// AskElira CLI — whoami command
// ============================================================

import chalk from 'chalk';
import * as auth from '../lib/auth';

/**
 * Whoami command.
 * Displays the currently logged-in user, or indicates not logged in.
 */
export function whoamiCommand(): void {
  if (!auth.isAuthenticated()) {
    console.log('');
    console.log(chalk.yellow('  Not logged in.'));
    console.log(chalk.gray('  Run `askelira login` to authenticate.'));
    console.log('');
    return;
  }

  const email = auth.getEmail();
  const customerId = auth.getCustomerId();
  const baseUrl = auth.getBaseUrl();
  const configPath = auth.getConfigPath();

  console.log('');
  console.log(chalk.bold('  AskElira Account'));
  console.log('');
  console.log(`  ${chalk.gray('Email:')}       ${chalk.cyan(email)}`);
  console.log(`  ${chalk.gray('Customer:')}    ${chalk.cyan(customerId)}`);
  console.log(`  ${chalk.gray('Server:')}      ${chalk.gray(baseUrl)}`);
  console.log(`  ${chalk.gray('Config:')}      ${chalk.gray(configPath)}`);
  console.log('');
}
