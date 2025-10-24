# Checksum App

A Next.js application with Clerk authentication and a minimal sidebar that expands on hover.

## Features

- 🔐 Clerk authentication integration
- 📱 Responsive sidebar with hover expansion
- 🎨 Modern UI with dark mode support
- ⚡ Built with Next.js 16 and Tailwind CSS

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Clerk Authentication

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) and create a new application
2. Copy your publishable key and secret key
3. Create a `.env.local` file in the root directory with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/

# Database Connection
DB_HOST=your-database-host.com
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_PORT=3306
DB_SSL=false
```

### 3. Set up Database Connection

The app uses **direct database connection** (simple and reliable):

```env
DB_HOST=your-database-host.com
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_PORT=3306
DB_SSL=false
```

**Benefits:**
- ✅ No Google Cloud authentication required
- ✅ Works with any MySQL/MariaDB database
- ✅ Simple configuration
- ✅ Fast and reliable connection

### Troubleshooting Database Connection

If you get connection errors, test your database connection:

```bash
# Test database connection
curl http://localhost:3000/api/test-db
```

**Common Issues:**

1. **ETIMEDOUT Error**: Database host is unreachable
   - Check if `DB_HOST` is correct
   - Verify the database server is running
   - Check firewall settings

2. **Access Denied**: Authentication failed
   - Verify `DB_USER` and `DB_PASSWORD`
   - Check if user has access to the database

3. **Database Not Found**: Database doesn't exist
   - Verify `DB_NAME` exists
   - Create the database if needed

4. **SSL Connection Issues**: 
   - Default: `DB_SSL=false` (no SSL)
   - Set `DB_SSL=true` only if your database requires SSL

5. **Google Cloud SQL Specific Issues**:
   - **Authorized Networks**: Add your IP to authorized networks in Google Cloud Console
   - **Public IP**: Ensure the instance has a public IP address
   - **SSL Optional**: Try without SSL first (`DB_SSL=false`)
   - **Firewall**: Check if port 3306 is open in Google Cloud firewall rules
   - **Instance Status**: Verify the Cloud SQL instance is running

**For Google Cloud SQL, check:**
- Go to Google Cloud Console → SQL → Your Instance
- Check "Authorized networks" includes your IP
- Verify "Public IP" is enabled
- Try without SSL first, then enable SSL if needed

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app/` - Next.js app directory
- `src/components/` - Reusable React components
- `src/components/Sidebar.tsx` - Main sidebar component with hover expansion

## Sidebar Features

- **Minimal Design**: Collapsed by default (16px width)
- **Hover Expansion**: Expands to 256px on hover
- **Authentication**: Shows user button when signed in, sign-in button when not
- **Navigation**: Includes dashboard, documents, and settings links
- **Responsive**: Works on all screen sizes

## GitHub Insights API

The app includes a comprehensive API for querying GitHub insights data from Google Cloud SQL:

### API Endpoints

**GET `/api/github-insights`** - Query GitHub insights data

Query Parameters:
- `action` - Type of query: `list`, `repositories`, `authors`, `daily-stats`
- `repository` - Filter by repository name
- `dateFrom` - Filter commits from date (YYYY-MM-DD)
- `dateTo` - Filter commits to date (YYYY-MM-DD)
- `limit` - Limit number of results
- `days` - Number of days for daily stats (default: 30)

**POST `/api/github-insights`** - Insert GitHub insights data

Body:
```json
{
  "action": "insert",
  "data": [
    {
      "repository_name": "my-repo",
      "commit_hash": "abc123",
      "author_name": "John Doe",
      "author_email": "john@example.com",
      "commit_date": "2024-01-01T00:00:00Z",
      "message": "Initial commit",
      "lines_added": 100,
      "lines_deleted": 10,
      "files_changed": 5
    }
  ]
}
```

### Database Schema

The `github_insights` table should have the following structure:

```sql
CREATE TABLE github_insights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  repository_name VARCHAR(255) NOT NULL,
  commit_hash VARCHAR(40) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  commit_date DATETIME NOT NULL,
  message TEXT,
  lines_added INT DEFAULT 0,
  lines_deleted INT DEFAULT 0,
  files_changed INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_commit (repository_name, commit_hash)
);
```

### Usage Examples

```javascript
// Get recent commits
const response = await fetch('/api/github-insights?action=list&limit=50');

// Get repository statistics
const stats = await fetch('/api/github-insights?action=repositories');

// Get daily commit trends
const trends = await fetch('/api/github-insights?action=daily-stats&days=7');
```

## Technologies Used

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Clerk Authentication
- Heroicons
- MySQL2
- Axios (HTTP client)
- TanStack Query (React Query)
- React Query DevTools
