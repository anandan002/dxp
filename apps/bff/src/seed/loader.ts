import { SEED_CONFIG } from './config';

const BATCH_SIZE = 50;

export async function loadBundle(resources: any[]): Promise<void> {
  const url = SEED_CONFIG.fhirBaseUrl;

  for (let i = 0; i < resources.length; i += BATCH_SIZE) {
    const batch = resources.slice(i, i + BATCH_SIZE);
    const bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: batch.map((resource) => ({
        resource,
        request: {
          method: resource.id ? 'PUT' : 'POST',
          url: resource.id ? `${resource.resourceType}/${resource.id}` : resource.resourceType,
        },
      })),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/fhir+json' },
      body: JSON.stringify(bundle),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      throw new Error(`FHIR load failed (${response.status}): ${error}`);
    }

    console.log(`  Loaded ${Math.min(i + BATCH_SIZE, resources.length)}/${resources.length} resources`);
  }
}
