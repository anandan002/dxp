import { uuid } from '../config';

const HEDIS_MEASURES = [
  { id: 'hedis-bcs', name: 'Breast Cancer Screening', description: 'Women 50-74 who had a mammogram in the past 2 years' },
  { id: 'hedis-ccs', name: 'Cervical Cancer Screening', description: 'Women 21-64 with cervical cytology or hrHPV testing' },
  { id: 'hedis-col', name: 'Colorectal Cancer Screening', description: 'Adults 45-75 with appropriate colorectal cancer screening' },
  { id: 'hedis-cbp', name: 'Controlling Blood Pressure', description: 'Adults 18-85 with HTN whose BP was adequately controlled' },
  { id: 'hedis-cdc-hba1c', name: 'Diabetes: HbA1c Control', description: 'Adults 18-75 with diabetes whose HbA1c was <8.0%' },
  { id: 'hedis-fua', name: 'Follow-Up After ED Visit', description: 'ED visits for alcohol/drug abuse with follow-up within 30 days' },
  { id: 'hedis-amm', name: 'Antidepressant Medication Management', description: 'Adults on antidepressants with acute phase and continuation treatment' },
];

/** Generate FHIR Measure resources (the definitions) + MeasureReport resources (individual results). */
export function generateQualityMeasures(patients: any[]): { measures: any[]; reports: any[] } {
  // 1. Create Measure definitions — these are the resources MeasureReports reference
  const measures = HEDIS_MEASURES.map((m) => ({
    resourceType: 'Measure',
    id: m.id,
    url: `https://ncqa.org/hedis/measures/${m.id}`,
    name: m.name,
    title: m.name,
    status: 'active',
    description: m.description,
    scoring: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/measure-scoring', code: 'proportion' }] },
    group: [{
      population: [
        { code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/measure-population', code: 'initial-population' }] } },
        { code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/measure-population', code: 'denominator' }] } },
        { code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/measure-population', code: 'numerator' }] } },
      ],
    }],
  }));

  // 2. Create MeasureReport resources — individual patient results
  const reports: any[] = [];
  const sample = patients.filter(() => Math.random() < 0.3);
  sample.forEach((p) => {
    const measure = HEDIS_MEASURES[Math.floor(Math.random() * HEDIS_MEASURES.length)];
    const inNumerator = Math.random() < 0.65;
    reports.push({
      resourceType: 'MeasureReport',
      id: uuid(),
      status: 'complete',
      type: 'individual',
      measure: `Measure/${measure.id}`,
      subject: { reference: `Patient/${p.id}` },
      date: new Date().toISOString(),
      period: { start: '2026-01-01', end: '2026-12-31' },
      group: [{
        code: { text: measure.name },
        population: [
          { code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/measure-population', code: 'initial-population' }] }, count: 1 },
          { code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/measure-population', code: 'denominator' }] }, count: 1 },
          { code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/measure-population', code: 'numerator' }] }, count: inNumerator ? 1 : 0 },
        ],
        measureScore: { value: inNumerator ? 1.0 : 0.0 },
      }],
    });
  });

  return { measures, reports };
}
