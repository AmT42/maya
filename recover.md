# Maya Document Scanner - Environment Recovery Guide

This guide will help you recreate all the necessary environment variables and configuration files for your Maya document scanning application.

## Overview
Your app is a React Native mobile frontend with FastAPI backend that uses:
- PostgreSQL database for structured data
- ChromaDB vector database for document embeddings
- Google Vision API for OCR
- OpenAI API for LLM analysis
- Google Calendar API for event creation
- JWT authentication

## Required Files to Create

### 1. `.env` File (Root Directory)
Create a `.env` file in the root directory with these variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5433/maya_db
POSTGRES_PASSWORD=your_postgres_password

# Security
SECRET_KEY=your_secret_key_here

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Google Services Credentials (file paths)
GOOGLE_CREDENTIALS_PATH=/path/to/google-vision-credentials.json
GOOGLE_CREDENTIALS_SA_PATH=/path/to/google-service-account.json
GOOGLE_CREDENTIALS_CALENDAR_PATH=/path/to/google-calendar-credentials.json

# ChromaDB Admin Credentials
ADMIN=your_admin_password

# ChromaDB Authentication (from .chroma_env)
CHROMA_SERVER_AUTH_PROVIDER=chromadb.auth.basic.BasicAuthServerProvider
CHROMA_SERVER_AUTH_CREDENTIALS_FILE=/chroma/server.htpasswd
CHROMA_SERVER_AUTH_CREDENTIALS_PROVIDER=chromadb.auth.providers.HtpasswdFileServerAuthCredentialsProvider
```

### 2. `server.htpasswd` File (Root Directory)
Create a htpasswd file for ChromaDB authentication:

```bash
# Install htpasswd utility (if not available)
# On macOS: brew install httpd
# On Ubuntu: sudo apt-get install apache2-utils

# Create the htpasswd file
htpasswd -c server.htpasswd admin
# Enter the same password you used for ADMIN variable
```

## Detailed Setup Instructions

### DATABASE_URL
**Format**: `postgresql://username:password@host:port/database_name`

**Your configuration**:
- Username: `postgres`
- Password: Whatever you set for `POSTGRES_PASSWORD`
- Host: `localhost` (when running locally)
- Port: `5433` (as defined in docker-compose.yml)
- Database: `maya_db`

**Example**: `postgresql://postgres:mypassword123@localhost:5433/maya_db`

### SECRET_KEY
**Purpose**: Used for JWT token signing and security
**How to generate**:
```python
import secrets
print(secrets.token_urlsafe(32))
```
**Example**: `xvz123abc456def789ghi012jkl345mno678pqr901stu234`

### POSTGRES_PASSWORD
**Purpose**: Password for PostgreSQL database
**Recommendation**: Use a strong password (12+ characters, mix of letters, numbers, symbols)
**Example**: `MySecureDBPass2024!`

### OPENAI_API_KEY
**Purpose**: Access to OpenAI GPT models for document analysis
**How to get**:
1. Go to https://platform.openai.com/
2. Sign up/login to your account
3. Navigate to API Keys section
4. Create a new API key
**Format**: `sk-...` (starts with sk-)

### ADMIN (ChromaDB)
**Purpose**: Admin password for ChromaDB authentication
**Recommendation**: Use a strong password
**Note**: Must match the password in `server.htpasswd`

## Google Services Setup

### 1. Google Vision API (OCR)
**File**: `GOOGLE_CREDENTIALS_PATH`
**Steps**:
1. Go to Google Cloud Console (https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Vision API
4. Go to IAM & Admin > Service Accounts
5. Create a new service account
6. Download the JSON key file
7. Place it in your project (e.g., `app/core/google-vision-credentials.json`)
8. Set the full path in `GOOGLE_CREDENTIALS_PATH`

### 2. Google Service Account (General)
**File**: `GOOGLE_CREDENTIALS_SA_PATH`
**Steps**:
1. In Google Cloud Console
2. Create another service account (or use the same one)
3. Grant necessary permissions (Calendar API access if needed)
4. Download JSON key
5. Set path in `GOOGLE_CREDENTIALS_SA_PATH`

### 3. Google Calendar API
**File**: `GOOGLE_CREDENTIALS_CALENDAR_PATH`
**Steps**:
1. In Google Cloud Console
2. Enable Calendar API
3. Go to APIs & Services > Credentials
4. Create OAuth 2.0 Client ID (for desktop application)
5. Download the JSON file
6. Set path in `GOOGLE_CREDENTIALS_CALENDAR_PATH`

## Directory Structure for Credentials
Recommended structure:
```
maya/
├── app/
│   └── core/
│       ├── google-vision-credentials.json
│       ├── google-service-account.json
│       └── google-calendar-credentials.json
├── .env
├── server.htpasswd
└── docker-compose.yml
```

## Security Notes

1. **Never commit credentials to git** - All credential files are in `.gitignore`
2. **Use environment variables** - Never hardcode secrets in code
3. **Rotate keys regularly** - Especially API keys and passwords
4. **Limit permissions** - Give Google service accounts only necessary permissions

## Testing Your Setup

1. **Database Connection**:
```bash
# Test PostgreSQL connection
docker-compose up db
psql postgresql://postgres:your_password@localhost:5433/maya_db
```

2. **ChromaDB Authentication**:
```bash
# Test ChromaDB with credentials
curl -u admin:your_admin_password http://localhost:8001/api/v1/heartbeat
```

3. **Google APIs**:
```python
# Test Google Vision API
from google.cloud import vision
import os
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'path/to/your/credentials.json'
client = vision.ImageAnnotatorClient()
```

4. **OpenAI API**:
```python
import openai
openai.api_key = "your_openai_api_key"
# Test with a simple completion
```

## Common Issues & Solutions

1. **Database connection refused**: Check if PostgreSQL container is running
2. **ChromaDB authentication failed**: Verify htpasswd file and ADMIN password match
3. **Google API errors**: Check service account permissions and API enablement
4. **JWT errors**: Verify SECRET_KEY is set and consistent

## ✅ COMPLETED SETUP

### Your Local PostgreSQL Database is Ready!

**Database Details:**
- **Host**: localhost
- **Port**: 5432 (default PostgreSQL port)
- **Database**: maya_db
- **Username**: maya_user
- **Password**: MayaSecure2024
- **Full URL**: `postgresql://maya_user:MayaSecure2024@localhost:5432/maya_db`

### ✅ Files Created:
- `.env` file with all database configuration
- `server.htpasswd` file for ChromaDB authentication
- PostgreSQL service is running and will start automatically on boot

### 🔄 Next Steps:

1. **Get OpenAI API Key**: 
   - Go to https://platform.openai.com/
   - Create an API key
   - Replace `your_openai_api_key_here` in `.env`

2. **Set up Google Credentials** (follow the detailed guide above):
   - Google Vision API credentials
   - Google Service Account credentials  
   - Google Calendar API credentials

3. **Test your setup**:
   ```bash
   # Test database connection
   /opt/homebrew/opt/postgresql@15/bin/psql "postgresql://maya_user:MayaSecure2024@localhost:5432/maya_db" -c "SELECT version();"
   
   # Start your application
   docker-compose up --build
   ```

Your PostgreSQL database is fully configured and ready to use! 