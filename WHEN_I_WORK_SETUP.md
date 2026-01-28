# When I Work Authentication Integration - Database-Backed

## Overview
This Laravel 12 application uses **When I Work API** for authentication with **full database synchronization**. Users login through the When I Work service, and all user data (including roles, permissions, and profile information) is fetched from the API and stored in the local database for fast access.

## What Changed

### 1. Database Migration
- **File:** `database/migrations/2026_01_22_062600_add_wheniwork_fields_to_users_table.php`
- Added 30+ fields to users table including:
  - When I Work IDs (wheniwork_id, account_id, login_id)
  - User profile (first_name, middle_name, last_name, phone_number, employee_code)
  - Role and permissions (role, employment_type, is_payroll, is_trusted, etc.)
  - Work details (hours_preferred, hours_max, hourly_rate)
  - JSON fields (alert_settings, positions, locations, avatar_urls)
  - Timestamps (start_date, hired_on, terminated_at, last_login)

### 2. User Role Enum
- **File:** `app/Enums/UserRole.php`
- Enum values:
  - `1` = Admin (full access)
  - `2` = Manager (can manage users)
  - `3` = Employee (default)
  - `5` = Supervisor (can access payroll)
- Helper methods: `isAdmin()`, `canManageUsers()`, `canAccessPayroll()`, etc.

### 3. Enhanced User Model
- **File:** `app/Models/User.php`
- Now includes all When I Work fields
- Role-based permission methods
- `syncFromWhenIWorkData()`: Static method to update/create user from API data
- Automatic name accessor (first_name + last_name)
- Soft deletes support

### 4. Custom User Provider (Refactored)
- **File:** `app/Auth/WhenIWorkUserProvider.php`
- Implements `Illuminate\Contracts\Auth\UserProvider`
- Two-step authentication:
  1. Login via `/login` endpoint (gets token and person ID)
  2. Fetch full user data via `/users` endpoint (gets role, permissions, etc.)
- Stores full user record in database
- Falls back to basic login data if `/users` endpoint fails

### 5. Configuration Updates
- **`config/auth.php`**: Uses 'wheniwork' driver with User model
- **`config/services.php`**: Added When I Work API configuration
- **`app/Providers/AppServiceProvider.php`**: Registered custom 'wheniwork' auth driver
- **`app/Http/Middleware/HandleInertiaRequests.php`**: Shares user with role info to frontend

### 6. Helper Class (Updated)
- **File:** `app/Helpers/WhenIWorkHelper.php`
- `getToken()`: Retrieves token from authenticated user's database record
- `getPersonData()`: Returns user data from database
- `getUser()`: Returns authenticated User model
- `makeApiRequest()`: Helper to make authenticated requests to When I Work API

## Environment Setup

Add these variables to your `.env` file:

```env
WHEN_I_WORK_API_KEY=244b76e0fb0c35e61038d8421155f03f11999303
WHEN_I_WORK_LOGIN_URL=https://api.login.wheniwork.com/login
WHEN_I_WORK_BASE_URL=https://api.wheniwork.com/2/
```

## Database Storage

After successful login, the following happens:
1. User data fetched from When I Work API (`/login` + `/users` endpoints)
2. User record created/updated in local `users` table with all fields
3. Token stored in `wheniwork_token` column
4. Session stores: `wheniwork_token` and `wheniwork_person_id`
5. All subsequent requests use database record (fast access)

### Users Table Fields
```
id, wheniwork_id, account_id, login_id, wheniwork_token,
email, first_name, middle_name, last_name, phone_number, employee_code,
role, employment_type, is_payroll, is_trusted, is_private, is_hidden, 
activated, is_active, hours_preferred, hours_max, hourly_rate,
notes, uuid, timezone_name, start_date, hired_on, terminated_at, last_login,
alert_settings (JSON), positions (JSON), locations (JSON), avatar_urls (JSON)
```

## Testing Instructions

### 1. Update Your Local Environment
```bash
# Copy environment variables from .env.example
cp .env.example .env

# Or add them manually to your existing .env
```

### 2. Clear Configuration Cache
```bash
php artisan config:clear
php artisan cache:clear
```

### 3. Test Login
- Navigate to `/login`
- Use credentials:
  - **Email:** macktechsolutions69@gmail.com
  - **Password:** Macktechsolutions69@gmail.com
- Should redirect to `/dashboard` on success

### 4. Access User Data in Your Application

```php
use App\Helpers\WhenIWorkHelper;
use App\Enums\UserRole;

// Get the current user (standard Laravel)
$user = auth()->user(); // Returns User model instance

// Access user properties
$userId = $user->id;
$email = $user->email;
$name = $user->name; // Auto-generated: first_name + last_name
$role = $user->role; // UserRole enum
$roleLabel = $user->role_label; // "Admin", "Manager", etc.

// Check permissions
if ($user->isAdmin()) {
    // Admin-only code
}

if ($user->canManageUsers()) {
    // Manager or Admin code
}

if ($user->canAccessPayroll()) {
    // Admin, Manager, or Supervisor code
}

// Get When I Work token for API calls
$token = WhenIWorkHelper::getToken();
// Or directly: $user->wheniwork_token

// Make authenticated API request
$response = WhenIWorkHelper::makeApiRequest('shifts', 'GET');
```

### 5. Working with Roles

```php
use App\Enums\UserRole;

// Check specific role
if ($user->role === UserRole::ADMIN) {
    // Admin-specific code
}

// Get role value (integer)
$roleValue = $user->role->value; // 1, 2, 3, or 5

// Get role label
$roleLabel = $user->role->label(); // "Admin", "Manager", "Employee", "Supervisor"

// Query users by role
$admins = User::where('role', UserRole::ADMIN)->get();
$managers = User::where('role', UserRole::MANAGER)->get();
```

## API Response Structure

### Login Response (`POST /login`)
```json
{
    "person": {
        "id": "24732827",
        "firstName": "Macktech",
        "lastName": "Solutions",
        "email": "macktechsolutions69@gmail.com",
        "phone": "",
        "token": "eyJhbGciOiJSUzI1NiIs..."
    },
    "token": "eyJhbGciOiJSUzI1NiIs..."
}
```

### Full User Data (`GET /users`)
```json
{
    "users": [
        {
            "id": 52581450,
            "login_id": 24732827,
            "account_id": 4275020,
            "email": "macktechsolutions69@gmail.com",
            "first_name": "Role",
            "last_name": "Admin/Owner",
            "role": 1,
            "employment_type": "hourly",
            "is_payroll": true,
            "is_active": true,
            "employee_code": "",
            "positions": [],
            "locations": [5880967],
            "avatar": {"url": "...", "size": "%s"},
            // ... many more fields
        }
    ],
    "locations": [...]
}
```

## Making When I Work API Calls

After authentication, use the stored token to make API calls:

```php
use App\Helpers\WhenIWorkHelper;

// Example: Get users list
$response = WhenIWorkHelper::makeApiRequest('users', 'GET');

if ($response->successful()) {
    $users = $response->json();
}

// Example: Get specific user
$response = WhenIWorkHelper::makeApiRequest('users/52581450', 'GET');

// Example: Create/Update data
$response = WhenIWorkHelper::makeApiRequest('shifts', 'POST', [
    'user_id' => 52581450,
    'start_time' => '2026-01-23 09:00:00',
    'end_time' => '2026-01-23 17:00:00',
]);
```

## Important Notes

1. **Database-Backed**: All user data stored in local database for fast access
2. **Automatic Sync**: User data updated from When I Work API on each login
3. **Role-Based Access**: Use enum values (1, 2, 3, 5) for role-based permissions
4. **Token Storage**: Token stored in database (`wheniwork_token` column)
5. **Frontend Unchanged**: React Login.tsx component works as-is
6. **Fortify Integration**: Uses existing Fortify routes and responses
7. **Soft Deletes**: Users can be soft-deleted (not physically removed)

## Troubleshooting

### Login Fails
- Check `.env` has correct API key
- Verify When I Work API is accessible
- Check logs: `storage/logs/laravel.log`

### Token Not Available
- Check if user is authenticated: `auth()->check()`
- Verify `wheniwork_token` column exists in database
- Check logs for API errors during login

### User Data Missing
- Check if user exists in database: `User::where('email', $email)->first()`
- Verify migration ran successfully: `php artisan migrate:status`
- Check When I Work API `/users` endpoint is accessible
- Review logs: `storage/logs/laravel.log`

## Role Mapping

When I Work uses these role IDs:
- **1** = Admin (Owner) - Full system access
- **2** = Manager - Can manage employees and schedules  
- **3** = Employee (Default) - Basic access
- **5** = Supervisor - Can manage schedules and access payroll

These are automatically mapped to the `UserRole` enum in your application.

## User Sync Process

1. User submits login credentials via React frontend
2. `WhenIWorkUserProvider::retrieveByCredentials()` called
3. POST to `https://api.login.wheniwork.com/login` with credentials
4. If successful, receives token and person ID
5. GET to `https://api.wheniwork.com/2/users` with token to fetch full user data
6. `User::syncFromWhenIWorkData()` creates/updates database record
7. User authenticated and redirected to dashboard

## API Documentation
Full When I Work API documentation: https://apidocs.wheniwork.com/external/index.html

## Frontend Integration

The authenticated user is automatically shared with your React frontend via Inertia:

```typescript
// In any React component
import { usePage } from '@inertiajs/react';

function MyComponent() {
    const { auth } = usePage().props;
    
    // Access user data
    console.log(auth.user.name);
    console.log(auth.user.role); // 1, 2, 3, or 5
    console.log(auth.user.role_label); // "Admin", "Manager", etc.
    console.log(auth.user.is_admin); // boolean
    console.log(auth.user.can_manage_users); // boolean
    
    return (
        <div>
            <h1>Welcome, {auth.user.name}</h1>
            <p>Role: {auth.user.role_label}</p>
        </div>
    );
}
```
