#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Run migrations
python manage.py migrate

# Ensure the database-backed Django cache exists for DRF throttling and
# RateLimitMiddleware. Safe to run on every Render build.
python manage.py createcachetable

# Seed admin user (only creates if doesn't exist)
python manage.py seed_admin

# Seed academic data (only creates if doesn't exist)
python manage.py seed_academic_data
