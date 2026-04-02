import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ESignaturePort, SignatureRequest, SignatureEnvelope } from '../ports/esignature.port';

@Injectable()
export class DocuSignAdapter extends ESignaturePort {
  private readonly logger = new Logger(DocuSignAdapter.name);
  private readonly client: AxiosInstance;
  private readonly accountId: string;

  constructor(private config: ConfigService) {
    super();
    const baseUrl = this.config.get<string>('DOCUSIGN_BASE_URL', 'https://demo.docusign.net/restapi');
    this.accountId = this.config.get<string>('DOCUSIGN_ACCOUNT_ID', '');
    this.client = axios.create({
      baseURL: `${baseUrl}/v2.1/accounts/${this.accountId}`,
      headers: { Authorization: `Bearer ${this.config.get<string>('DOCUSIGN_ACCESS_TOKEN', '')}` },
    });
  }

  async createEnvelope(request: SignatureRequest): Promise<SignatureEnvelope> {
    this.logger.log(`DocuSign: creating envelope for ${request.signers.length} signers`);
    // POST /envelopes with envelope definition
    const { data } = await this.client.post('/envelopes', {
      emailSubject: request.subject, emailBlurb: request.message, status: 'sent',
      recipients: { signers: request.signers.map((s, i) => ({ email: s.email, name: s.name, recipientId: String(i + 1), routingOrder: String(i + 1) })) },
    });
    return { id: data.envelopeId, status: 'sent', documentUrl: request.documentUrl, signers: request.signers.map((s) => ({ ...s, status: 'sent' })), createdAt: new Date().toISOString() };
  }

  async getEnvelope(envelopeId: string): Promise<SignatureEnvelope> {
    const { data } = await this.client.get(`/envelopes/${envelopeId}`);
    return { id: data.envelopeId, status: data.status, documentUrl: '', signers: [], createdAt: data.createdDateTime, completedAt: data.completedDateTime };
  }

  async listEnvelopes(status?: string): Promise<SignatureEnvelope[]> {
    const params = status ? `?from_date=${new Date(Date.now() - 30 * 86400000).toISOString()}&status=${status}` : `?from_date=${new Date(Date.now() - 30 * 86400000).toISOString()}`;
    const { data } = await this.client.get(`/envelopes${params}`);
    return (data.envelopes || []).map((e: Record<string, string>) => ({ id: e.envelopeId, status: e.status, documentUrl: '', signers: [], createdAt: e.createdDateTime, completedAt: e.completedDateTime }));
  }

  async voidEnvelope(envelopeId: string, reason: string): Promise<void> {
    await this.client.put(`/envelopes/${envelopeId}`, { status: 'voided', voidedReason: reason });
  }

  async getSigningUrl(envelopeId: string, signerEmail: string): Promise<string> {
    const { data } = await this.client.post(`/envelopes/${envelopeId}/views/recipient`, { email: signerEmail, returnUrl: this.config.get<string>('DOCUSIGN_RETURN_URL', 'http://localhost:5020') });
    return data.url;
  }
}

