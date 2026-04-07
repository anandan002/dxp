# SDK React (@dxp/sdk-react)

React hooks for consuming the DXP BFF. Built on TanStack Query for caching, refetching, and optimistic updates.

## Setup

Wrap your app with `DxpProvider`:

```tsx
import { DxpProvider } from '@dxp/sdk-react';

<DxpProvider config={{
  bffUrl: '/dxp/api/v1',
  getAccessToken: async () => localStorage.getItem('token'),
}}>
  <App />
</DxpProvider>
```

For direct local BFF access without nginx routing, use `http://localhost:5021/api/v1`.

## Hooks

### useAuth
Get the current user's profile.

```tsx
const { user, isLoading, isAuthenticated } = useAuth();
```

### useCms / useCmsItem / useCmsCreate
Content management operations.

```tsx
const { data } = useCms('articles', { page: 1 });
const { data: article } = useCmsItem('articles', '123');
const create = useCmsCreate('articles');
create.mutate({ title: 'New Article', body: {} });
```

### useDocuments / useDocumentUpload
Document listing and upload.

```tsx
const { data } = useDocuments('claims');
const upload = useDocumentUpload();
upload.mutate({ name: 'photo.jpg', category: 'claims', mimeType: 'image/jpeg', data: base64 });
```

### useSearch / useSuggest
Full-text search and autocomplete.

```tsx
const { data } = useSearch('policies', searchTerm);
const { data: suggestions } = useSuggest('policies', partial);
```

### useSendNotification
Send notifications via the BFF.

```tsx
const send = useSendNotification();
send.mutate({ to: 'user@example.com', subject: 'Update', template: 'claim-status', data: {} });
```

### usePresignedUpload / usePresignedDownload
Get presigned URLs for direct S3 upload/download.

```tsx
const presign = usePresignedUpload();
const { data } = await presign.mutateAsync({ key: 'docs/file.pdf', contentType: 'application/pdf' });
// Upload directly to data.url
```

## Direct API Access

For cases not covered by hooks:

```tsx
import { apiFetch } from '@dxp/sdk-react';

const result = await apiFetch('/integrations/salesforce/call', {
  method: 'POST',
  body: JSON.stringify({ method: 'GET', path: '/accounts' }),
});
```

