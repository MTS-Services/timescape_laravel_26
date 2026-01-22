# When I Work Authentication Integration

## Overview
This Laravel 12 application now uses **When I Work API** for authentication instead of local database authentication. Users login through the When I Work service, and the API token is stored in the session for subsequent API calls.

## What Changed

### 1. Custom User Model
- **File:** `app/Models/WhenIWorkUser.php`
- Implements `Illuminate\Contracts\Auth\Authenticatable`
- Does NOT use a database table
- Properties populated from When I Work API response (id, email, firstName, lastName, token)

### 2. Custom User Provider
- **File:** `app/Auth/WhenIWorkUserProvider.php`
- Implements `Illuminate\Contracts\Auth\UserProvider`
- `retrieveByCredentials()`: Makes HTTP POST to When I Work login endpoint
- On success: Creates `WhenIWorkUser` instance and stores token in session
- `validateCredentials()`: Returns true if user object exists (password already validated by API)

### 3. Configuration Updates
- **`config/auth.php`**: Changed users provider driver from 'eloquent' to 'wheniwork'
- **`config/services.php`**: Added When I Work API configuration
- **`app/Providers/AppServiceProvider.php`**: Registered custom 'wheniwork' auth driver

### 4. Helper Class
- **File:** `app/Helpers/WhenIWorkHelper.php`
- `getToken()`: Retrieve stored When I Work token from session
- `getPersonData()`: Get person data from session
- `makeApiRequest()`: Helper to make authenticated requests to When I Work API

## Environment Setup

Add these variables to your `.env` file:

```env
WHEN_I_WORK_API_KEY=244b76e0fb0c35e61038d8421155f03f11999303
WHEN_I_WORK_LOGIN_URL=https://api.login.wheniwork.com/login
WHEN_I_WORK_BASE_URL=https://api.wheniwork.com/2/
```

## Session Storage

The following data is stored in the session after successful login:
- `wheniwork_user`: The WhenIWorkUser instance
- `wheniwork_token`: The JWT token for API calls
- `wheniwork_person`: Full person object from API response

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

### 4. Access Token in Your Application

```php
use App\Helpers\WhenIWorkHelper;

// Get the current user's token
$token = WhenIWorkHelper::getToken();

// Get person data
$person = WhenIWorkHelper::getPersonData();

// Make authenticated API request
$response = WhenIWorkHelper::makeApiRequest('users', 'GET');
```

### 5. Access User in Controllers

```php
// In any authenticated route
$user = auth()->user(); // Returns WhenIWorkUser instance
$userId = $user->id;
$email = $user->email;
$name = $user->getName(); // firstName + lastName
$token = $user->getToken();
```

## API Response Structure

### Login Response
```json
{
    "person": {
        "id": "24732827",
        "firstName": "Macktech",
        "lastName": "Solutions",
        "email": "macktechsolutions69@gmail.com",
        "token": "eyJhbGciOiJSUzI1NiIs..."
    },
    "token": "eyJhbGciOiJSUzI1NiIs..."
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

1. **No Database Required**: The WhenIWorkUser model doesn't use a database table
2. **Session-Based**: Token stored in session, not database
3. **Token Refresh**: Implement token refresh logic if tokens expire
4. **Frontend Unchanged**: React Login.tsx component works as-is
5. **Fortify Integration**: Uses existing Fortify routes and responses

## Troubleshooting

### Login Fails
- Check `.env` has correct API key
- Verify When I Work API is accessible
- Check logs: `storage/logs/laravel.log`

### Token Not Available
- Ensure session driver is configured properly in `.env`
- Run `php artisan session:table` and `php artisan migrate` if using database sessions

### User Data Missing
- Check session storage configuration
- Verify the login was successful before accessing token

## API Documentation
Full When I Work API documentation: https://apidocs.wheniwork.com/external/index.html
