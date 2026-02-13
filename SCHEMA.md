# Database Schema (Supabase/PostgreSQL)

## Tables

### `profiles`
- `id`: uuid (references auth.users, primary key)
- `full_name`: text
- `email`: text
- `college_id`: text (optional)
- `department`: text
- `avatar_url`: text
- `created_at`: timestamptz

### `items`
- `id`: uuid (primary key)
- `seller_id`: uuid (references profiles.id)
- `title`: text
- `description`: text
- `price`: numeric
- `category`: text (e.g., 'textbooks', 'tools', 'stationery', 'others')
- `condition`: text (e.g., 'new', 'like-new', 'used', 'worn')
- `images`: text[] (array of Supabase storage URLs)
- `is_sold`: boolean (default: false)
- `created_at`: timestamptz

### `categories` (Optional/Hardcoded in app)
- `id`: uuid
- `name`: text
- `slug`: text

### `wanted_requests`
- `id`: uuid (primary key)
- `requester_id`: uuid (references profiles.id)
- `title`: text
- `description`: text
- `category`: text
- `created_at`: timestamptz

## Storage Buckets
- `item-images`: Public bucket for listing photos.

## Policies (RLS)
- **Profiles:** Users can read all profiles; only owners can update their own.
- **Items:** Everyone can read items; only authenticated sellers can create/update/delete their own.
- **Wanted Requests:** Everyone can read; only authenticated users can create their own.
