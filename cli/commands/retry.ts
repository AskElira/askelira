/**
 * Retry Command - Restart stuck builds
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import * as api from '../lib/api';

export async function retryCommand(goalId?: string): Promise<void> {
  try {
    let selectedGoalId = goalId;

    // If no goalId provided, show list of stuck/building goals
    if (!selectedGoalId) {
      const goalsRes = await api.listGoals();
      if (!goalsRes.ok) {
        console.log(chalk.red('\n✗ Failed to load goals\n'));
        return;
      }

      // Filter for BUILDING or PLANNING goals that are stuck (old + 0%)
      const stuckGoals = goalsRes.data.goals.filter((g: any) => {
        const isStuck = g.status === 'building' || g.status === 'planning';
        const isOld = Date.now() - new Date(g.createdAt).getTime() > 30 * 60 * 1000; // >30min old
        const noProgress = g.floorCount === 0 || g.liveFloors === 0;
        return isStuck && isOld && noProgress;
      });

      if (stuckGoals.length === 0) {
        console.log(chalk.yellow('\n⚠️  No stuck builds found\n'));
        console.log(chalk.gray('Stuck = BUILDING/PLANNING for >30min with 0% progress\n'));
        return;
      }

      console.log(chalk.cyan('\n🔍 Stuck Builds Found:\n'));

      const choices = stuckGoals.map((g: any) => ({
        name: `${chalk.yellow('[STUCK]')} ${g.goalText.substring(0, 60)}... ${chalk.gray(`(${g.id})`)}`,
        value: g.id,
      }));

      choices.push({ name: chalk.gray('Cancel'), value: null });

      const { selected } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selected',
          message: 'Select build to retry:',
          choices,
        },
      ]);

      if (!selected) {
        return;
      }

      selectedGoalId = selected;
    }

    if (!selectedGoalId) {
      console.log(chalk.red('\n✗ No goal selected\n'));
      return;
    }

    // Load goal details
    const goalRes = await api.getGoal(selectedGoalId);
    if (!goalRes.ok) {
      console.log(chalk.red(`\n✗ Goal not found: ${selectedGoalId}\n`));
      return;
    }

    const goal = goalRes.data;

    console.log(chalk.cyan('\n🔧 Retry Build\n'));
    console.log(chalk.white(`Goal: ${goal.goal.goalText}`));
    console.log(chalk.gray(`ID: ${goal.goal.id}`));
    console.log(chalk.gray(`Status: ${goal.goal.status}`));
    console.log(chalk.gray(`Progress: ${goal.floors.filter((f: any) => f.status === 'live').length}/${goal.floors.length} floors\n`));

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Retry this build?',
        default: true,
      },
    ]);

    if (!confirm) {
      return;
    }

    // Restart each stuck floor
    const spinner = ora('Restarting build...').start();

    try {
      let restarted = 0;

      for (const floor of goal.floors || []) {
        // Restart floors that are stuck in researching, building, or auditing
        const stuckStatuses = ['researching', 'building', 'auditing', 'pending'];
        if (stuckStatuses.includes(floor.status)) {
          try {
            // Call the loop/start endpoint to restart the floor
            const baseUrl = process.env.ASKELIRA_API_URL || 'https://askelira-bundled-npm.vercel.app';
            const response = await fetch(`${baseUrl}/api/loop/start/${floor.id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              restarted++;
              spinner.text = `Restarted ${restarted} floor(s)...`;
            }
          } catch (err) {
            // Continue to next floor
          }
        }
      }

      if (restarted > 0) {
        spinner.succeed(chalk.green(`✓ Restarted ${restarted} floor(s)`));
        console.log(chalk.gray(`\n  Monitor progress: askelira watch ${goal.goal.id}\n`));
      } else {
        spinner.fail(chalk.yellow('No floors needed restart'));
        console.log(chalk.gray('\n  All floors are either completed or not started yet\n'));
      }
    } catch (error: any) {
      spinner.fail(chalk.red('Retry failed'));
      console.log(chalk.red(`  Error: ${error.message}\n`));
    }
  } catch (error: any) {
    console.log(chalk.red(`\n✗ Error: ${error.message}\n`));
    process.exitCode = 1;
  }
}
