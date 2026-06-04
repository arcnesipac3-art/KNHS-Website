from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.academics.models import ClassSubject, ClassEnrollment, Quarter
from apps.learning.models import Assignment, Submission, LearningMaterial
from apps.grading.models import Grade
from apps.attendance.models import AttendanceRecord
from apps.communications.models import Announcement, Notification

User = get_user_model()


class Command(BaseCommand):
    help = "Seed Sprint 3 data: assignments, grades, attendance, announcements"

    def handle(self, *args, **options):
        self.stdout.write("Seeding Sprint 3 data...\n")

        # Get first quarter and class subject
        try:
            quarter = Quarter.objects.filter(academic_year__is_current=True).first()
            if not quarter:
                self.stdout.write(self.style.ERROR("No current quarter found. Run seed_academic_data first."))
                return

            class_subject = ClassSubject.objects.select_related("classroom", "subject", "teacher").first()
            if not class_subject:
                self.stdout.write(self.style.ERROR("No class subjects found. Run seed_academic_data first."))
                return

            # Get enrollments
            enrollments = ClassEnrollment.objects.filter(
                classroom=class_subject.classroom, status="active"
            ).select_related("student")

            if not enrollments.exists():
                self.stdout.write(self.style.WARNING("No enrollments found. Creating sample student..."))
                # Would need to create sample student here
                return

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {e}"))
            return

        # Create sample assignments
        self.stdout.write("\n=== Creating Assignments ===")
        assignments_data = [
            {
                "title": "Chapter 1 Quiz",
                "description": "Multiple choice quiz covering lessons 1.1 to 1.3. Answer all 20 questions.",
                "days_until_due": 7,
                "max_score": 20.0,
                "status": "published",
            },
            {
                "title": "Problem Set 1",
                "description": "Solve all problems on page 25-28. Show your complete solution.",
                "days_until_due": 10,
                "max_score": 50.0,
                "status": "published",
            },
            {
                "title": "Group Project: Research Paper",
                "description": "Submit a 5-page research paper on your chosen topic. Groups of 4-5 students.",
                "days_until_due": 21,
                "max_score": 100.0,
                "status": "published",
            },
        ]

        created_assignments = []
        for data in assignments_data:
            assignment, created = Assignment.objects.get_or_create(
                class_subject=class_subject,
                title=data["title"],
                defaults={
                    "description": data["description"],
                    "due_date": timezone.now() + timedelta(days=data["days_until_due"]),
                    "max_score": data["max_score"],
                    "status": data["status"],
                    "created_by": class_subject.teacher,
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✓ Created: {assignment.title}"))
                created_assignments.append(assignment)
            else:
                created_assignments.append(assignment)

        # Create sample submissions
        self.stdout.write("\n=== Creating Submissions ===")
        submission_count = 0
        for assignment in created_assignments[:2]:  # First 2 assignments only
            for enrollment in enrollments[:3]:  # First 3 students
                submission, created = Submission.objects.get_or_create(
                    assignment=assignment,
                    student=enrollment.student,
                    defaults={
                        "file_urls": ["https://storage.example.com/submission.pdf"],
                        "text_response": "This is my submission for this assignment.",
                        "status": "submitted",
                    },
                )
                if created:
                    submission.submitted_at = timezone.now() - timedelta(days=2)
                    submission.save()
                    submission_count += 1

        self.stdout.write(self.style.SUCCESS(f"✓ Created {submission_count} submissions"))

        # Create sample grades
        self.stdout.write("\n=== Creating Grades ===")
        grade_count = 0
        for enrollment in enrollments[:5]:  # First 5 students
            grade, created = Grade.objects.get_or_create(
                class_enrollment=enrollment,
                class_subject=class_subject,
                quarter=quarter,
                defaults={
                    "ww_score": 85.0,
                    "pt_score": 90.0,
                    "qa_score": 88.0,
                    "status": "computed",
                },
            )
            if created:
                grade_count += 1

        self.stdout.write(self.style.SUCCESS(f"✓ Created {grade_count} grades"))

        # Create sample attendance
        self.stdout.write("\n=== Creating Attendance Records ===")
        attendance_count = 0
        today = date.today()
        for days_ago in range(5):  # Last 5 days
            record_date = today - timedelta(days=days_ago)
            for enrollment in enrollments[:5]:  # First 5 students
                record, created = AttendanceRecord.objects.get_or_create(
                    class_enrollment=enrollment,
                    date=record_date,
                    defaults={
                        "status": "P" if days_ago < 4 else "A",  # One absent day
                        "recorded_by": class_subject.teacher,
                    },
                )
                if created:
                    attendance_count += 1

        self.stdout.write(self.style.SUCCESS(f"✓ Created {attendance_count} attendance records"))

        # Create sample learning materials
        self.stdout.write("\n=== Creating Learning Materials ===")
        materials_data = [
            {
                "title": "Chapter 1 Self-Learning Module",
                "description": "Complete module for independent study",
                "material_type": "module",
                "file_url": "https://storage.example.com/module1.pdf",
            },
            {
                "title": "Daily Lesson Log - Week 1",
                "description": "Teacher's lesson plan for the week",
                "material_type": "dll",
                "file_url": "https://storage.example.com/dll_week1.pdf",
            },
            {
                "title": "Practice Worksheet",
                "description": "Additional practice problems",
                "material_type": "worksheet",
                "file_url": "https://storage.example.com/worksheet1.pdf",
            },
        ]

        material_count = 0
        for data in materials_data:
            material, created = LearningMaterial.objects.get_or_create(
                class_subject=class_subject,
                title=data["title"],
                defaults={
                    "description": data["description"],
                    "material_type": data["material_type"],
                    "file_url": data["file_url"],
                    "file_size": 1024000,  # 1MB
                    "uploaded_by": class_subject.teacher,
                },
            )
            if created:
                material_count += 1

        self.stdout.write(self.style.SUCCESS(f"✓ Created {material_count} learning materials"))

        # Create sample announcements
        self.stdout.write("\n=== Creating Announcements ===")
        admin_user = User.objects.filter(role="admin").first()
        if not admin_user:
            admin_user = class_subject.teacher

        announcements_data = [
            {
                "title": "Midterm Exam Schedule",
                "body": "Midterm examinations will be held from October 25-29, 2024. Please review all lessons covered.",
                "priority": "important",
                "audience_type": "school",
            },
            {
                "title": "Quiz Reminder",
                "body": "Don't forget our quiz on Chapter 1-3 tomorrow. Please review your notes.",
                "priority": "normal",
                "audience_type": "classroom",
                "audience_ref_id": class_subject.classroom.id,
            },
        ]

        announcement_count = 0
        for data in announcements_data:
            announcement, created = Announcement.objects.get_or_create(
                title=data["title"],
                defaults={
                    "author": admin_user if data["audience_type"] == "school" else class_subject.teacher,
                    "body": data["body"],
                    "priority": data["priority"],
                    "audience_type": data["audience_type"],
                    "audience_ref_id": data.get("audience_ref_id"),
                    "published_at": timezone.now(),
                },
            )
            if created:
                announcement_count += 1

        self.stdout.write(self.style.SUCCESS(f"✓ Created {announcement_count} announcements"))

        # Create sample notifications
        self.stdout.write("\n=== Creating Notifications ===")
        notification_count = 0
        for enrollment in enrollments[:3]:  # First 3 students
            notification, created = Notification.objects.get_or_create(
                user=enrollment.student,
                title="New Assignment Posted",
                defaults={
                    "notification_type": "assignment",
                    "body": f"{class_subject.teacher.display_name} posted a new assignment in {class_subject.subject.name}",
                    "link": f"/assignments/{created_assignments[0].id}",
                },
            )
            if created:
                notification_count += 1

        self.stdout.write(self.style.SUCCESS(f"✓ Created {notification_count} notifications"))

        self.stdout.write(self.style.SUCCESS("\n✓ Sprint 3 data seeding completed!"))
        self.stdout.write("\nSummary:")
        self.stdout.write(f"  • Assignments: {len(created_assignments)}")
        self.stdout.write(f"  • Submissions: {submission_count}")
        self.stdout.write(f"  • Grades: {grade_count}")
        self.stdout.write(f"  • Attendance: {attendance_count} records")
        self.stdout.write(f"  • Materials: {material_count}")
        self.stdout.write(f"  • Announcements: {announcement_count}")
        self.stdout.write(f"  • Notifications: {notification_count}")
