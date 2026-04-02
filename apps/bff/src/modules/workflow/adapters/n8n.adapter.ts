import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { WorkflowPort, WorkflowExecution, TriggerWorkflowDto, WorkflowDefinition } from '../ports/workflow.port';

@Injectable()
export class N8nAdapter extends WorkflowPort {
  private readonly logger = new Logger(N8nAdapter.name);
  private readonly client: AxiosInstance;

  constructor(private config: ConfigService) {
    super();
    const baseURL = this.config.get<string>('N8N_URL', 'http://localhost:5032');
    this.client = axios.create({
      baseURL: `${baseURL}/api/v1`,
      headers: { 'X-N8N-API-KEY': this.config.get<string>('N8N_API_KEY', ''), 'Content-Type': 'application/json' },
    });
  }

  async triggerWorkflow(dto: TriggerWorkflowDto): Promise<WorkflowExecution> {
    this.logger.log(`n8n: triggering workflow ${dto.workflowId}`);
    // n8n webhook trigger: POST to the workflow's webhook URL
    const webhookUrl = `${this.config.get<string>('N8N_URL')}/webhook/${dto.workflowId}`;
    const { data } = await axios.post(webhookUrl, dto.data || {});
    return { id: String(Date.now()), workflowId: dto.workflowId, workflowName: '', status: 'running', startedAt: new Date().toISOString(), data };
  }

  async getExecution(executionId: string): Promise<WorkflowExecution> {
    const { data } = await this.client.get(`/executions/${executionId}`);
    return { id: String(data.id), workflowId: String(data.workflowId), workflowName: data.workflowData?.name || '', status: data.finished ? (data.stoppedAt ? 'success' : 'error') : 'running', startedAt: data.startedAt, finishedAt: data.stoppedAt, data: data.data };
  }

  async listExecutions(workflowId?: string, status?: string): Promise<WorkflowExecution[]> {
    let url = '/executions?limit=20';
    if (workflowId) url += `&workflowId=${workflowId}`;
    if (status) url += `&status=${status}`;
    const { data } = await this.client.get(url);
    return (data.data || []).map((e: Record<string, unknown>) => ({
      id: String(e.id), workflowId: String(e.workflowId), workflowName: '', status: e.finished ? 'success' : 'running', startedAt: String(e.startedAt), finishedAt: e.stoppedAt as string,
    }));
  }

  async listWorkflows(active?: boolean): Promise<WorkflowDefinition[]> {
    let url = '/workflows?limit=50';
    if (active !== undefined) url += `&active=${active}`;
    const { data } = await this.client.get(url);
    return (data.data || []).map((w: Record<string, unknown>) => ({
      id: String(w.id), name: String(w.name), active: w.active as boolean, triggerType: 'webhook' as const, createdAt: String(w.createdAt), updatedAt: String(w.updatedAt),
    }));
  }

  async activateWorkflow(workflowId: string): Promise<void> {
    await this.client.patch(`/workflows/${workflowId}`, { active: true });
  }

  async deactivateWorkflow(workflowId: string): Promise<void> {
    await this.client.patch(`/workflows/${workflowId}`, { active: false });
  }
}

