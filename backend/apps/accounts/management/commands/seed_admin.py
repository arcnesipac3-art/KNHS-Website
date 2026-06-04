from django.core.management.base import BaseCommand

from apps.accounts.models import User, UserProfile


class Command(BaseCommand):
    help = "Create default KNHS admin account for development"

    def add_arguments(self, parser):
        parser.add_argument("--email", default="admin@kiwalan-nhs.edu.ph")
        parser.add_argument("--password", default="Admin@KNHS2026")
        parser.add_argument("--first-name", default="KNHS")
        parser.add_argument("--last-name", default="Administrator")

    def handle(self, *args, **options):
        email = options["email"].lower()
        password = options["password"]

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "is_verified": True,
                "is_approved": True,
            },
        )

        if not created:
            user.role = User.Role.ADMIN
            user.is_staff = True
            user.is_superuser = True
            user.is_verified = True
            user.is_approved = True

        user.set_password(password)
        user.save()

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.first_name = options["first_name"]
        profile.last_name = options["last_name"]
        profile.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} admin user: {email}"))
