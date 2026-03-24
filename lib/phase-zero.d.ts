/**
 * Phase 0: Business Plan
 *
 * Interactive OpenClaw conversation to validate and refine the goal
 * BEFORE proceeding to Elira's floor planning (Floor Zero).
 *
 * Purpose:
 * - Identify legal/ethical issues early
 * - Refine goal for feasibility
 * - Set realistic success criteria
 * - Get user buy-in before expensive building process
 */
interface PhaseZeroResult {
    approved: boolean;
    refinedGoal: string;
    legalRisks: string[];
    technicalFeasibility: 'high' | 'medium' | 'low';
    estimatedCost: string;
    suggestedDataSources: string[];
    successCriteria: string;
    conversationSummary: string;
}
export declare function runPhaseZero(initialGoal: string, apiKey: string): Promise<PhaseZeroResult>;
/**
 * Quick validation check for obvious red flags
 * Returns warnings to display to user before starting Phase 0
 */
export declare function quickValidation(goal: string): string[];
export {};
