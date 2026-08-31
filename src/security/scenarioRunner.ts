import type { SecurityDecision, ToolRequest, AuthorizationPolicy } from './types';
import { AgentSecurityEngine } from './agentSecurityEngine';

export interface SecurityScenario {
  id: string;
  name: string;
  request: ToolRequest;
  expectedDecision: SecurityDecision['decision'];
}

export interface ScenarioResult {
  id: string;
  name: string;
  expected: SecurityDecision['decision'];
  actual: SecurityDecision['decision'];
  passed: boolean;
  reasonCodes: string[];
}

export function runSecurityScenarios(
  scenarios: SecurityScenario[],
  policy: AuthorizationPolicy
): ScenarioResult[] {
  return scenarios.map(scenario => {
    const engine = new AgentSecurityEngine(policy);
    const decision = engine.assess([scenario.request]).decisions[0];

    return {
      id: scenario.id,
      name: scenario.name,
      expected: scenario.expectedDecision,
      actual: decision.decision,
      passed: decision.decision === scenario.expectedDecision,
      reasonCodes: decision.reasonCodes
    };
  });
}

export function summarizeScenarioResults(results: ScenarioResult[]) {
  const passed = results.filter(result => result.passed).length;

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    passRate: results.length === 0 ? 1 : passed / results.length
  };
}
