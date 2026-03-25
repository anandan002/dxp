# BFF Adapter Pattern

The adapter pattern is the core of the DXP framework. Every platform capability (CMS, storage, notifications, etc.) is accessed through a **port** (abstract contract) with swappable **adapters** (concrete implementations).

## How It Works

```
Controller ---uses---> Port (abstract class)
                         |
          Factory selects based on env var
                         |
                  +------+------+
                  |             |
           StrapiAdapter  PayloadAdapter
```

### Port (the contract)

```typescript
// apps/bff/src/modules/cms/ports/cms.port.ts
export abstract class CmsPort {
  abstract getContent(type: string, id: string): Promise<CmsContent>;
  abstract listContent(type: string, query: CmsContentQuery): Promise<CmsContentList>;
  abstract createContent(type: string, data: CreateContentDto): Promise<CmsContent>;
  abstract publishContent(type: string, id: string): Promise<void>;
  abstract deleteContent(type: string, id: string): Promise<void>;
}
```

### Adapter (one implementation)

```typescript
// apps/bff/src/modules/cms/adapters/strapi.adapter.ts
@Injectable()
export class StrapiAdapter extends CmsPort {
  constructor(private config: ConfigService) { super(); }

  async getContent(type: string, id: string): Promise<CmsContent> {
    const { data } = await this.client.get(`/${type}/${id}`);
    return this.mapContent(data.data);  // Transform Strapi response to common model
  }
  // ... other methods
}
```

### Module (adapter selection via env var)

```typescript
// apps/bff/src/modules/cms/cms.module.ts
@Module({
  providers: [{
    provide: CmsPort,
    useFactory: (config: ConfigService) => {
      switch (config.get('CMS_ADAPTER', 'strapi')) {
        case 'strapi': return new StrapiAdapter(config);
        case 'payload': return new PayloadAdapter(config);
        default: throw new Error('Unknown CMS adapter');
      }
    },
    inject: [ConfigService],
  }],
})
export class CmsModule {}
```

### Swapping providers

```bash
# .env
CMS_ADAPTER=strapi    # Uses Strapi
CMS_ADAPTER=payload   # Uses Payload — zero code changes
```

## Writing a New Adapter

1. Create `apps/bff/src/modules/<module>/adapters/<name>.adapter.ts`
2. Extend the module's port abstract class
3. Implement all abstract methods
4. Add a case to the module's factory `switch`
5. Add the env var value to `.env.example`

That's it. The controller, validation, and Swagger docs don't change.

## Current Adapter Inventory

| Module | Port | Adapters |
|--------|------|----------|
| CMS | `CmsPort` | `StrapiAdapter`, `PayloadAdapter` |
| Storage | `StoragePort` | `MinioAdapter` (S3-compatible), `AzureBlobAdapter` |
| Notifications | `NotificationPort` | `SmtpAdapter`, `SendGridAdapter` |
| Search | `SearchPort` | `PostgresFtsAdapter` |
| Documents | `DocumentPort` | `S3DocumentAdapter` |
| Identity | `IdentityPort` | `KeycloakAdminAdapter` |
| Integration | `IntegrationPort` | `RestAdapter` |
