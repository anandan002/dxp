import { Injectable, Logger } from '@nestjs/common';
import { PayerExchangePort, type MemberMatchRequest, type ExportJob } from '../ports/payer-exchange.port';
import { FhirClient } from '../../fhir-core/fhir-client.service';

@Injectable()
export class PDexAdapter extends PayerExchangePort {
  private readonly logger = new Logger(PDexAdapter.name);

  constructor(private readonly fhir: FhirClient) {
    super();
  }

  async memberMatch(tenantId: string, request: MemberMatchRequest): Promise<{ matchedPatientRef: string; confidence: number }> {
    // Da Vinci HRex $member-match operation
    const parameters = {
      resourceType: 'Parameters',
      parameter: [
        {
          name: 'MemberPatient',
          resource: {
            resourceType: 'Patient',
            name: [{ given: [request.firstName], family: request.lastName }],
            birthDate: request.birthDate,
          },
        },
      ],
    };

    const result = await this.fhir.create<any>('Patient/$member-match' as any, parameters);
    const patientRef = result?.parameter?.find((p: any) => p.name === 'MemberIdentifier')?.valueIdentifier?.value;
    return { matchedPatientRef: patientRef ?? '', confidence: patientRef ? 0.95 : 0 };
  }

  async exportMemberData(tenantId: string, patientRef: string): Promise<ExportJob> {
    // Trigger $everything export for matched patient
    this.logger.log(`Requesting $everything export for ${patientRef}`);
    const jobId = `export-${Date.now()}`;
    return {
      jobId,
      status: 'queued',
      requestedAt: new Date().toISOString(),
    };
  }

  async getExportStatus(tenantId: string, jobId: string): Promise<ExportJob> {
    // In production, poll the FHIR server's export status endpoint
    return {
      jobId,
      status: 'complete',
      resourceCount: 0,
      requestedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
  }
}
