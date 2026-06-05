# Generated migration for performance optimization

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('grading', '0002_grade_rejection_note_and_more'),
    ]

    operations = [
        # Add indexes for frequently queried fields
        migrations.AddIndex(
            model_name='grade',
            index=models.Index(fields=['status', 'quarter'], name='grade_status_quarter_idx'),
        ),
        migrations.AddIndex(
            model_name='grade',
            index=models.Index(fields=['class_subject', 'quarter', 'status'], name='grade_cs_qtr_status_idx'),
        ),
        migrations.AddIndex(
            model_name='grade',
            index=models.Index(fields=['created_at'], name='grade_created_at_idx'),
        ),
        migrations.AddIndex(
            model_name='grade',
            index=models.Index(fields=['updated_at'], name='grade_updated_at_idx'),
        ),
        migrations.AddIndex(
            model_name='gradepublishevent',
            index=models.Index(fields=['grade', 'event_type', 'created_at'], name='gpe_grade_type_created_idx'),
        ),
        migrations.AddIndex(
            model_name='conductrating',
            index=models.Index(fields=['class_enrollment', 'quarter'], name='conduct_enroll_qtr_idx'),
        ),
    ]
