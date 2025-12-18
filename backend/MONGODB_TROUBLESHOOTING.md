# MongoDB Connection Troubleshooting Guide

## Common Issues and Solutions

### 1. Connection Timeout (ETIMEOUT)

**Error:**
```
querySrv ETIMEOUT _mongodb._tcp.cluster0.hjxrota.mongodb.net
```

**Solutions:**

#### A. Check Network Connectivity
```bash
# Test DNS resolution
nslookup cluster0.hjxrota.mongodb.net

# Test connectivity
ping cluster0.hjxrota.mongodb.net
```

#### B. Check MongoDB Atlas IP Whitelist
1. Go to MongoDB Atlas Dashboard
2. Navigate to **Network Access**
3. Ensure your IP address is whitelisted
4. Or add `0.0.0.0/0` for development (NOT recommended for production)

#### C. Check MongoDB Atlas Connection String
- Verify the connection string in `.env` file
- Ensure username and password are correct
- Check if the database name matches

#### D. Use Alternative Connection String Format
If SRV connection fails, try using standard connection string:
```env
MONGODB_URI=mongodb://DataBase:DataBase@cluster0-shard-00-00.hjxrota.mongodb.net:27017,cluster0-shard-00-01.hjxrota.mongodb.net:27017,cluster0-shard-00-02.hjxrota.mongodb.net:27017/agil?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

### 2. Authentication Failed

**Error:**
```
Authentication failed
```

**Solutions:**
- Verify username and password in connection string
- Check if database user has proper permissions
- Ensure password doesn't contain special characters that need URL encoding

### 3. Duplicate Index Warnings

**Warning:**
```
Duplicate schema index on {"email":1} found
```

**Solution:**
- Already fixed! Removed explicit index definitions where `unique: true` already creates the index
- Models affected: User, Project, Story

### 4. Connection Pool Exhausted

**Error:**
```
MongoServerError: connection pool closed
```

**Solutions:**
- Increase `maxPoolSize` in connection options
- Check for connection leaks (not closing connections)
- Restart the application

## Connection Options Explained

```javascript
{
  serverSelectionTimeoutMS: 30000,  // How long to wait for server selection
  socketTimeoutMS: 45000,          // How long to wait for socket operations
  connectTimeoutMS: 30000,         // How long to wait for initial connection
  maxPoolSize: 10,                 // Maximum number of connections
  minPoolSize: 5,                  // Minimum number of connections
  retryWrites: true,               // Retry write operations
  w: 'majority',                   // Write concern
}
```

## Testing Connection

### Using MongoDB Compass
1. Download MongoDB Compass
2. Use connection string from `.env`
3. Test connection

### Using MongoDB Shell (mongosh)
```bash
mongosh "mongodb+srv://DataBase:DataBase@cluster0.hjxrota.mongodb.net/agil?retryWrites=true&w=majority"
```

### Using Node.js Script
```javascript
import mongoose from 'mongoose'

const testConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log('✅ Connected successfully')
    await mongoose.disconnect()
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
  }
}

testConnection()
```

## Fallback: Local MongoDB

If Atlas connection continues to fail, use local MongoDB:

1. Install MongoDB locally:
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS
brew install mongodb-community

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

2. Update `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/agilesafe
```

3. Run seed script:
```bash
npm run seed
```

## Monitoring Connection

Check connection status in logs:
- `MongoDB Connected: <host>` - Success
- `Mongoose connected to MongoDB` - Success
- `MongoDB connection error:` - Failure
- `Mongoose disconnected from MongoDB` - Disconnected

## Production Recommendations

1. **Use Connection Pooling**: Already configured
2. **Monitor Connection Health**: Add health check endpoint
3. **Implement Retry Logic**: Already in connection options
4. **Use Environment-Specific URIs**: Different URIs for dev/staging/prod
5. **Enable Connection Logging**: Already implemented with Winston

## Quick Fixes Checklist

- [ ] MongoDB Atlas IP whitelist includes your IP
- [ ] Connection string is correct in `.env`
- [ ] Username and password are correct
- [ ] Network connectivity is working
- [ ] MongoDB Atlas cluster is running
- [ ] Database user has proper permissions
- [ ] No firewall blocking MongoDB ports (27017 or SRV)

