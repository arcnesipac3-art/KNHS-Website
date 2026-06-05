# Generated migration for Grade Approval Workflow enhancement

import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0002_alter_classsubject_teacher'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('grading', '0003_add_performance_indexes'),
    ]

    operations = [
        # Add 'reviewed' action to GradePublishEvent choices
        migrations.AlterField(
            model_name='gradepublishevent',
            name='action',
            field=models.CharField(
                choices=[
                    ('computed', 'Computed'),
                    ('submitted', 'Submitted for Approval'),
                    ('approved', 'Approved'),
                    ('published', 'Published'),
                    ('unlocked', 'Unlocked'),
                    ('edited', 'Edited'),
                    ('reviewed', 'Reviewed')
                ],
                max_length=20
            ),
        ),
        # Add indexes to GradePublishEvent
        migrations.AddIndex(
            model_name='gradepublishevent',
            index=models.Index(fields=['grade', '-created_at'], name='grading_gra_grade_i_idx'),
        ),
        migrations.AddIndex(
            model_name='gradepublishevent',
            index=models.Index(fields=['action', '-created_at'], name='grading_gra_action__idx'),
        ),
        # Create GradeReviewComment model
        migrations.CreateModel(
            name='GradeReviewComment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('comment', models.TextField(help_text='Review comment or feedback')),
                ('is_internal', models.BooleanField(default=False, help_text='Internal notes visible only to principals/admins')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('author', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='grade_review_comments', to=settings.AUTH_USER_MODEL)),
                ('class_subject', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='grade_review_comments', to='academics.classsubject')),
                ('quarter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='grade_review_comments', to='academics.quarter')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        # Add index to GradeReviewComment
        migrations.AddIndex(
            model_name='gradereviewcomment',
            index=models.Index(fields=['class_subject', 'quarter', '-created_at'], name='grading_gra_class_s_idx'),
        ),
    ]
