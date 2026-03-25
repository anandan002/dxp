export interface WorkflowExecution {
  workflowId: string;
  runId: string;
  type: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'timed_out';
  startedAt: string;
  closedAt?: string;
  result?: unknown;
  error?: string;
}

export interface StartWorkflowDto {
  workflowType: string;
  workflowId?: string;
  input: unknown;
  taskQueue?: string;
}

export interface SignalWorkflowDto {
  workflowId: string;
  signalName: string;
  input?: unknown;
}

export interface WorkflowQuery {
  status?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}
