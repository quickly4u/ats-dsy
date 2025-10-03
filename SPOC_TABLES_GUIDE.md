# SPOC Tables Guide

## Overview

The ATS Pro system uses a **modernized SPOC (Single Point of Contact) structure** with three tables:

1. **`external_spocs`** - External client-side points of contact
2. **`internal_spocs`** - Internal team members serving as SPOCs
3. **`internal_spoc_clients`** - Mapping table for internal SPOCs to their assigned clients

## Table Structure

### External SPOCs (`external_spocs`)

External SPOCs represent contacts at client companies.

**Key Columns:**
- `id` - UUID primary key
- `company_id` - Reference to your company (multi-tenant isolation)
- `client_id` - Reference to the client this SPOC represents
- `first_name`, `last_name`, `email`, `phone`
- `designation` - Job title
- `department` - Department at client company
- `is_primary` - Boolean indicating if this is the primary contact
- `is_active` - Active status
- `linkedin_url`, `notes`, `avatar`

**Usage:**
```typescript
// Create an external SPOC
const { data, error } = await supabase
  .from('external_spocs')
  .insert({
    company_id: currentCompanyId,
    client_id: clientId,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@client.com',
    designation: 'HR Manager',
    is_primary: true,
    is_active: true
  });
```

### Internal SPOCs (`internal_spocs`)

Internal SPOCs are team members who serve as points of contact.

**Key Columns:**
- `id` - UUID primary key
- `company_id` - Reference to your company
- `user_id` - Reference to the user serving as SPOC
- `level` - 'primary' or 'secondary'
- `is_active` - Active status
- `assigned_at` - When this SPOC was assigned
- `assigned_by` - User who assigned this SPOC

**Usage:**
```typescript
// Create an internal SPOC
const { data, error } = await supabase
  .from('internal_spocs')
  .insert({
    company_id: currentCompanyId,
    user_id: teamMemberId,
    level: 'primary',
    is_active: true
  });
```

### Internal SPOC-Client Mapping (`internal_spoc_clients`)

Many-to-many relationship between internal SPOCs and clients.

**Key Columns:**
- `internal_spoc_id` - Reference to internal SPOC
- `client_id` - Reference to client

**Usage:**
```typescript
// Assign internal SPOC to clients
const { data, error } = await supabase
  .from('internal_spoc_clients')
  .insert([
    { internal_spoc_id: spocId, client_id: client1Id },
    { internal_spoc_id: spocId, client_id: client2Id }
  ]);
```

## Deprecated Tables

⚠️ **DEPRECATED**: The following tables are deprecated and should not be used:
- `spocs` - Replaced by `external_spocs` and `internal_spocs`
- `client_spocs` - Replaced by `external_spocs` and `internal_spoc_clients`

These tables will be removed in a future version. Use the new structure instead.

## Migration from Old Structure

If you have data in the old `spocs` and `client_spocs` tables:

1. Review the data structure
2. Run the migration function:
   ```sql
   SELECT migrate_old_spoc_data();
   ```
3. Verify data in new tables
4. Drop old tables:
   ```sql
   DROP TABLE IF EXISTS public.client_spocs CASCADE;
   DROP TABLE IF EXISTS public.spocs CASCADE;
   ```

## Hooks Available

The following custom hooks are available for SPOC management:

### `useSpocs()`

Located in `src/hooks/useSpocs.ts`

**Returns:**
- `externalSpocs` - List of external SPOCs
- `internalSpocs` - List of internal SPOCs
- `isLoading` - Loading state
- `error` - Error message if any
- `createExternalSPOC()` - Create an external SPOC
- `updateExternalSPOC()` - Update an external SPOC
- `deleteExternalSPOC()` - Delete an external SPOC
- `createInternalSPOC()` - Create an internal SPOC
- `updateInternalSPOC()` - Update an internal SPOC
- `assignInternalSPOCToClients()` - Assign internal SPOC to clients

**Example:**
```typescript
const {
  externalSpocs,
  internalSpocs,
  createExternalSPOC
} = useSpocs();

// Create external SPOC
await createExternalSPOC({
  clientId: '...',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@client.com',
  designation: 'Recruiter',
  isPrimary: false,
  isActive: true
});
```

## Row Level Security (RLS)

All SPOC tables have RLS policies that enforce:
- Users can only access SPOCs within their company
- Full CRUD operations allowed for company members
- Automatic company_id filtering

No need to manually filter by company_id in queries - RLS handles it automatically.

## Best Practices

1. **External SPOCs**: One primary SPOC per client is recommended
2. **Internal SPOCs**: Assign both primary and secondary for redundancy
3. **Active Status**: Use `is_active` to soft-delete rather than hard deleting
4. **Client Assignment**: Internal SPOCs can handle multiple clients
5. **Data Integrity**: Always use the provided hooks rather than direct Supabase queries

## UI Components

### SPOC Management Page

Located at: `src/components/clients/SPOCManagement.tsx`

Features:
- View all external and internal SPOCs
- Create/edit SPOCs
- Assign internal SPOCs to clients
- Filter and search SPOCs
- Manage SPOC status

Access via: `/spocs` route
