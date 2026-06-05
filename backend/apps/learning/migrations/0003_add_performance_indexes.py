# Generated migration for performance optimization

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('learning', '0002_submission_graded_at_alter_assignment_class_subject'),
    ]

    operations = [
        # Add indexes for assignments
        migrations.AddIndex(
            model_name='assignment',
            index=models.Index(fields=['class_subject', 'due_date'], name='assign_cs_due_idx'),
        ),
        migrations.AddIndex(
            model_name='assignment',
            index=models.Index(fields=['assignment_type', 'created_at'], name='assign_type_created_idx'),
        ),
        
        # Add indexes for submissions
        migrations.AddIndex(
            model_name='submission',
            index=models.Index(fields=['assignment', 'student', 'status'], name='sub_assign_student_status_idx'),
        ),
        migrations.AddIndex(
            model_name='submission',
            index=models.Index(fields=['submitted_at'], name='sub_submitted_at_idx'),
        ),
        migrations.AddIndex(
            model_name='submission',
            index=models.Index(fields=['graded_at'], name='sub_graded_at_idx'),
        ),
        
        # Add indexes for materials
        migrations.AddIndex(
            model_name='learningmaterial',
            index=models.Index(fields=['class_subject', 'created_at'], name='material_cs_created_idx'),
        ),
    ]
