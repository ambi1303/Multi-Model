# Database URL Cleanup Guide

## Problem
Your current DATABASE_URL contains SSL parameters that are incompatible with the AsyncPG driver used for async database connections.

## Common Problematic Parameters
Remove these parameters from your DATABASE_URL:
- `sslmode=require` (or any sslmode value)
- `channel_binding=prefer` (or any channel_binding value)
- `sslcert=...`
- `sslkey=...`
- `sslrootcert=...`
- `sslcrl=...`
- `gssencmode=...`
- `target_session_attrs=...`

## How to Fix Your .env File

### ❌ WRONG (with SSL parameters):
```env
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require&channel_binding=prefer
```

### ✅ CORRECT (clean URL):
```env
DATABASE_URL=postgresql://user:pass@host:port/db
```

## Examples

### For Local Development:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/mental_health_db
```

### For Neon/Cloud Providers:
```env
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
```

### For Production with SSL (let the app handle SSL):
```env
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
# SSL will be handled automatically by the application
```

## Steps to Fix

1. **Open your `.env` file**
2. **Find your DATABASE_URL line**
3. **Remove everything after the `?` in the URL**
4. **Save the file**
5. **Restart your application**

## Test the Fix

After cleaning your DATABASE_URL, test the connection:

```bash
cd services/core
python test_db_connection.py
```

You should see:
```
✅ Sync connection successful!
✅ Async database connection successful!
🎉 All database connections successful!
```

## Note
The application will automatically handle SSL configuration when needed. You don't need to specify SSL parameters in the DATABASE_URL. 