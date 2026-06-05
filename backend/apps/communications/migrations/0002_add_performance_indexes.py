# Generated migration for performance optimization

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('communications', '0001_initial'),
    ]

    operations = [
        # Add indexes for notifications
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'is_read', 'created_at'], name='notif_user_read_created_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'created_at'], name='notif_user_created_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['notification_type', 'created_at'], name='notif_type_created_idx'),
        ),
        
        # Add indexes for announcements
        migrations.AddIndex(
            model_name='announcement',
            index=models.Index(fields=['published', 'published_at'], name='announce_pub_date_idx'),
        ),
        migrations.AddIndex(
            model_name='announcement',
            index=models.Index(fields=['target_role', 'published'], name='announce_role_pub_idx'),
        ),
    ]
