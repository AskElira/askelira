// ============================================================
// AskElira CLI — logout command
// ============================================================

import inquirer from 'inquirer';
import chalk from 'chalk';
import * as auth from '../lib/auth';

/**
 * Logout command.
 * Prompts for confirmation, then clears stored credentials.
 */
export async function logoutCommand(): Promise<void> {
  if (!auth.isAuthenticated()) {
    console.log(chalk.gray('  Not currently logged in.'));
    return;
  }

  const email = auth.getEmail();

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Log out from ${chalk.cyan(email)}?`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.gray('  Logout cancelled.'));
    return;
  }

  auth.logout();
  console.log(chalk.green('  Logged out successfully.'));
}
