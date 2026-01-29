FROM php:8.3-fpm

# Add custom php.ini file
COPY ./docker/php.ini /usr/local/etc/php/conf.d/custom.ini

# Install system dependencies and PHP extensions in a single layer
RUN apt-get update && apt-get install -y \
    nano \
    nginx \
    git \
    unzip \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    supervisor \
    gnupg2 \
    ca-certificates \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring zip exif pcntl gd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Install PHP dependencies (without dev dependencies for production)
RUN composer install --no-dev --no-scripts --no-autoloader --optimize-autoloader

# Copy package files for npm
COPY package*.json ./

# Install npm dependencies
RUN npm ci --omit=dev

# Copy the rest of the application
COPY . .

# Create .env file if it doesn't exist
RUN if [ ! -f .env ]; then \
    if [ -f .env.example ]; then \
    cp .env.example .env; \
    else \
    touch .env; \
    fi; \
    fi

# Generate Composer autoload files
RUN composer dump-autoload --optimize --no-dev

# Build frontend assets
RUN npm run build

# Create necessary directories and set permissions
RUN mkdir -p storage/framework/{views,sessions,cache} \
    && mkdir -p storage/logs \
    && mkdir -p bootstrap/cache \
    && mkdir -p /var/log/supervisor \
    && chown -R www-data:www-data /var/www \
    && chmod -R 775 storage bootstrap/cache

# Laravel optimization commands
RUN php artisan config:clear \
    && php artisan route:clear \
    && php artisan view:clear \
    && php artisan event:clear

# Cache configurations for production (only if not using .env changes at runtime)
# Uncomment these if you're not changing env vars after deployment
# RUN php artisan config:cache \
#     && php artisan route:cache \
#     && php artisan view:cache \
#     && php artisan event:cache

# Configure Nginx and Supervisor
RUN rm -f /etc/nginx/sites-enabled/default
COPY ./docker/nginx.conf /etc/nginx/nginx.conf
COPY ./docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Ensure proper permissions one final time
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost/up || exit 1

# Start all services via supervisor
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
