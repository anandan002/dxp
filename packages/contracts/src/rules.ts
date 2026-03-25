export interface RuleDefinition {
  id: string;
  name: string;
  description: string;
  conditions: Record<string, unknown>;
  event: { type: string; params: Record<string, unknown> };
  priority?: number;
  enabled: boolean;
}

export interface EvaluateRulesDto {
  ruleSet: string;
  facts: Record<string, unknown>;
}

export interface RuleEvaluationResult {
  triggered: boolean;
  events: { type: string; params: Record<string, unknown> }[];
  failureResults: { name: string; reason: string }[];
}
