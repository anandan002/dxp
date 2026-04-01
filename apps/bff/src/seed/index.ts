import { generatePatients } from './generators/patients';
import { generateCoverage } from './generators/coverage';
import { generateClaimsEOB } from './generators/claims-eob';
import { generatePriorAuths } from './generators/prior-auth';
import { generateProviders } from './generators/providers';
import { generateQualityMeasures } from './generators/quality';
import { generateCarePlans } from './generators/care-plans';
import { generateConsents } from './generators/consents';
import { loadBundle } from './loader';

async function seed() {
  console.log('=== Seeding HAPI FHIR with synthetic payer data ===\n');

  // Create the payer organization first (referenced by Coverage, EOB, etc.)
  console.log('0. Creating payer organization...');
  await loadBundle([{
    resourceType: 'Organization',
    id: 'payer-001',
    active: true,
    name: 'Meridian Health Plan',
    type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/organization-type', code: 'pay', display: 'Payer' }] }],
    telecom: [{ system: 'phone', value: '1-800-555-0199' }],
    address: [{ line: ['100 Health Plaza'], city: 'Boston', state: 'MA', postalCode: '02110' }],
  }]);
  console.log('   Payer organization created\n');

  console.log('1. Generating patients...');
  const patients = generatePatients();
  await loadBundle(patients);
  console.log(`   ${patients.length} patients loaded\n`);

  console.log('2. Generating coverage...');
  const coverages = generateCoverage(patients);
  await loadBundle(coverages);
  console.log(`   ${coverages.length} coverage records loaded\n`);

  // Load providers BEFORE claims/PAs (they reference Practitioner resources)
  console.log('3. Generating provider directory...');
  const providers = generateProviders();
  await loadBundle(providers);
  console.log(`   ${providers.length} provider resources loaded\n`);

  // Extract Practitioner IDs so claims/PAs can reference real providers
  const practitionerIds = providers
    .filter((r: any) => r.resourceType === 'Practitioner')
    .map((r: any) => r.id);

  console.log('4. Generating claims & EOBs...');
  const eobs = generateClaimsEOB(patients, coverages, practitionerIds);
  await loadBundle(eobs);
  console.log(`   ${eobs.length} claims loaded\n`);

  console.log('5. Generating prior authorizations...');
  const auths = generatePriorAuths(patients, coverages, practitionerIds);
  await loadBundle(auths);
  console.log(`   ${auths.length} prior auths loaded\n`);

  console.log('6. Generating quality measures...');
  const { measures: measureDefs, reports: measureReports } = generateQualityMeasures(patients);
  await loadBundle(measureDefs);
  console.log(`   ${measureDefs.length} HEDIS measure definitions loaded`);
  await loadBundle(measureReports);
  console.log(`   ${measureReports.length} measure reports loaded\n`);

  console.log('7. Generating care plans, encounters, care teams, conditions...');
  const { carePlans, encounters, careTeams, conditions } = generateCarePlans(patients, practitionerIds);
  await loadBundle(conditions);
  console.log(`   ${conditions.length} conditions loaded`);
  await loadBundle(careTeams);
  console.log(`   ${careTeams.length} care teams loaded`);
  await loadBundle(carePlans);
  console.log(`   ${carePlans.length} care plans loaded`);
  await loadBundle(encounters);
  console.log(`   ${encounters.length} encounters loaded\n`);

  console.log('8. Generating consents...');
  const consents = generateConsents(patients);
  await loadBundle(consents);
  console.log(`   ${consents.length} consents loaded\n`);

  const total = patients.length + coverages.length + eobs.length + auths.length + providers.length +
    measureDefs.length + measureReports.length + conditions.length + careTeams.length +
    carePlans.length + encounters.length + consents.length;
  console.log(`=== Seed complete: ${total} total resources ===`);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
