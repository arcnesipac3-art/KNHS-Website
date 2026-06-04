from datetime import date
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.academics.models import AcademicYear, Quarter, Subject, Classroom, ClassSubject

User = get_user_model()


class Command(BaseCommand):
    help = "Seed initial academic structure data (academic years, quarters, subjects, classrooms)"

    def handle(self, *args, **options):
        self.stdout.write("Seeding academic structure data...\n")

        # Create Academic Year
        academic_year, created = AcademicYear.objects.get_or_create(
            label="SY 2024-2025",
            defaults={
                "start_date": date(2024, 8, 1),
                "end_date": date(2025, 5, 31),
                "is_current": True,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"✓ Created academic year: {academic_year.label}"))
        else:
            self.stdout.write(f"  Academic year already exists: {academic_year.label}")

        # Create Quarters
        quarters_data = [
            {"number": 1, "name": "First Quarter", "start_date": date(2024, 8, 1), "end_date": date(2024, 10, 31)},
            {"number": 2, "name": "Second Quarter", "start_date": date(2024, 11, 1), "end_date": date(2025, 1, 31)},
            {"number": 3, "name": "Third Quarter", "start_date": date(2025, 2, 1), "end_date": date(2025, 4, 15)},
            {"number": 4, "name": "Fourth Quarter", "start_date": date(2025, 4, 16), "end_date": date(2025, 5, 31)},
        ]

        for quarter_data in quarters_data:
            quarter, created = Quarter.objects.get_or_create(
                academic_year=academic_year,
                number=quarter_data["number"],
                defaults=quarter_data,
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✓ Created quarter: {quarter.name}"))

        # Create Sample Subjects
        subjects_data = [
            # Grade 7
            {"name": "English 7", "code": "ENG7", "grade_level": 7, "strand": ""},
            {"name": "Mathematics 7", "code": "MATH7", "grade_level": 7, "strand": ""},
            {"name": "Science 7", "code": "SCI7", "grade_level": 7, "strand": ""},
            {"name": "Filipino 7", "code": "FIL7", "grade_level": 7, "strand": ""},
            {"name": "Araling Panlipunan 7", "code": "AP7", "grade_level": 7, "strand": ""},
            # Grade 8
            {"name": "English 8", "code": "ENG8", "grade_level": 8, "strand": ""},
            {"name": "Mathematics 8", "code": "MATH8", "grade_level": 8, "strand": ""},
            {"name": "Science 8", "code": "SCI8", "grade_level": 8, "strand": ""},
            # Grade 11 STEM
            {"name": "General Mathematics", "code": "GEN_MATH", "grade_level": 11, "strand": "STEM"},
            {"name": "Basic Calculus", "code": "BASIC_CALC", "grade_level": 11, "strand": "STEM"},
            {"name": "General Physics 1", "code": "GEN_PHYS1", "grade_level": 11, "strand": "STEM"},
            {"name": "General Chemistry 1", "code": "GEN_CHEM1", "grade_level": 11, "strand": "STEM"},
            # Grade 11 Core (all strands)
            {"name": "Oral Communication", "code": "ORAL_COM", "grade_level": 11, "strand": ""},
            {"name": "21st Century Literature", "code": "21ST_LIT", "grade_level": 11, "strand": ""},
        ]

        for subject_data in subjects_data:
            subject, created = Subject.objects.get_or_create(
                code=subject_data["code"],
                defaults=subject_data,
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✓ Created subject: {subject.name}"))

        # Create Sample Classrooms
        classrooms_data = [
            {"name": "Einstein", "grade_level": 7, "section": "A", "strand": "", "capacity": 40},
            {"name": "Newton", "grade_level": 7, "section": "B", "strand": "", "capacity": 40},
            {"name": "Darwin", "grade_level": 8, "section": "A", "strand": "", "capacity": 40},
            {"name": "Hawking", "grade_level": 8, "section": "B", "strand": "", "capacity": 40},
            {"name": "Section A", "grade_level": 11, "section": "A", "strand": "STEM", "capacity": 35},
            {"name": "Section B", "grade_level": 11, "section": "B", "strand": "STEM", "capacity": 35},
        ]

        # Get a teacher for adviser (if exists)
        teacher = User.objects.filter(role="teacher").first()

        for classroom_data in classrooms_data:
            classroom, created = Classroom.objects.get_or_create(
                academic_year=academic_year,
                grade_level=classroom_data["grade_level"],
                section=classroom_data["section"],
                strand=classroom_data["strand"],
                defaults={
                    **classroom_data,
                    "adviser": teacher,
                },
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"✓ Created classroom: {classroom.full_name} (Code: {classroom.join_code})")
                )

                # Assign subjects to classroom
                if classroom.grade_level == 7:
                    subject_codes = ["ENG7", "MATH7", "SCI7", "FIL7", "AP7"]
                elif classroom.grade_level == 8:
                    subject_codes = ["ENG8", "MATH8", "SCI8"]
                elif classroom.grade_level == 11 and classroom.strand == "STEM":
                    subject_codes = ["GEN_MATH", "BASIC_CALC", "GEN_PHYS1", "GEN_CHEM1", "ORAL_COM", "21ST_LIT"]
                else:
                    subject_codes = []

                for code in subject_codes:
                    try:
                        subject = Subject.objects.get(code=code)
                        class_subject, cs_created = ClassSubject.objects.get_or_create(
                            classroom=classroom,
                            subject=subject,
                            defaults={"teacher": teacher},
                        )
                        if cs_created:
                            self.stdout.write(f"  → Assigned {subject.name} to {classroom.name}")
                    except Subject.DoesNotExist:
                        pass

        self.stdout.write(self.style.SUCCESS("\n✓ Academic structure seeding completed!"))
        self.stdout.write("\nYou can now:")
        self.stdout.write("  • Create/manage classrooms via admin or API")
        self.stdout.write("  • Students can join classes using join codes")
        self.stdout.write("  • Teachers can view their assigned classes")
