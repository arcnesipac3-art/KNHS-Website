"""
Management command to fix users with missing or incomplete profiles.
This is needed for users created before the profile duplication bug was fixed.
"""
from django.core.management.base import BaseCommand
from apps.accounts.models import User, UserProfile


class Command(BaseCommand):
    help = 'Fix users with missing or incomplete profiles'

    def handle(self, *args, **options):
        self.stdout.write('Starting profile fix...\n')
        
        fixed_count = 0
        created_count = 0
        already_ok_count = 0
        
        # Get all users
        users = User.objects.all()
        total_users = users.count()
        
        self.stdout.write(f'Found {total_users} users to check\n')
        
        for user in users:
            try:
                # Try to access the profile
                profile = user.profile
                
                # Check if profile has basic data (first_name or last_name)
                if not profile.first_name and not profile.last_name:
                    self.stdout.write(
                        self.style.WARNING(
                            f'User {user.email} has empty profile - needs manual update'
                        )
                    )
                    fixed_count += 1
                else:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ User {user.email} profile OK: {profile.full_name}'
                        )
                    )
                    already_ok_count += 1
                    
            except UserProfile.DoesNotExist:
                # Profile doesn't exist, create it
                UserProfile.objects.create(user=user)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Created profile for {user.email}'
                    )
                )
                created_count += 1
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS(f'\n✓ Profile fix complete!'))
        self.stdout.write(f'  Total users: {total_users}')
        self.stdout.write(f'  Already OK: {already_ok_count}')
        self.stdout.write(f'  Created profiles: {created_count}')
        self.stdout.write(f'  Empty profiles (need manual update): {fixed_count}')
        
        if fixed_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    f'\n⚠ {fixed_count} users have empty profiles.'
                )
            )
            self.stdout.write(
                'These users were created before the fix and need their profile data added.'
            )
            self.stdout.write('Options:')
            self.stdout.write('  1. Delete and recreate them via the portal')
            self.stdout.write('  2. Update via Django Admin at /admin')
            self.stdout.write('  3. Users can update their own profiles after login\n')
