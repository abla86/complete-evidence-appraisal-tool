import type { SecurityScenario, AuthorizationPolicy } from './types';
import { AgentSecurityEngine } from './agentSecurityEngine';

export interface ScenarioResult {
  id: string;
  name: string;
  expected: 'ALLOW' | 'DENY' | 'CONFIRM';
  actual: 'ALLOW' | 'DENY' | 'CONFIRM';
  passed: boolean;
  reasonCodes: string[];
}

export function runSecurityScenarios(
  scenarios: SecurityScenario[],
  policy: AuthorizationPolicy
): ScenarioResult[] {
  const engine = new AgentSecurityEngine(policy);
  engine.provenance.add({
    id: 'user',
    sourceType: 'USER',
    sourceId: 'scenario-user',
    trust: 'TRUSTED',
    parentIds: [],
    content: 'Controlled evaluation fixture'
  });
  engine.provenance.add({
    id: 'web',
    sourceType: 'WEB',
    sourceId: 'scenario-web',
    trust: 'UNTRUSTED',
    parentIds: ['user'],
    content: 'Controlled untrusted web fixture'
  });
  engine.provenance.add({
    id: 'derived-from-web',
    sourceType: 'MODEL',
    sourceId: 'scenario-model',
    trust: 'DERIVED',
    parentIds: ['web'],
    content: 'Model-derived fixture'
  });

  return scenarios.map(scenario => {
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
