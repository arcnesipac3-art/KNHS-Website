from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.enrollment.models import EnrollmentApplication
import random


class Command(BaseCommand):
    help = 'Seed sample enrollment applications for testing'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Seeding enrollment applications...'))
        
        # Sample data
        first_names = ['Juan', 'Maria', 'Pedro', 'Ana', 'Jose', 'Rosa', 'Carlos', 'Elena', 'Miguel', 'Sofia']
        last_names = ['Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Rodriguez', 'Martinez', 'Gonzales', 'Torres', 'Mendoza', 'Castillo']
        middle_names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
        strands = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL']
        statuses = ['pending', 'under_review', 'approved', 'rejected']
        
        # Create 10 sample applications
        for i in range(10):
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            middle_name = random.choice(middle_names)
            grade_level = str(random.choice([7, 8, 9, 10, 11, 12]))
            strand = random.choice(strands) if grade_level in ['11', '12'] else None
            
            applicant_data = {
                'personal': {
                    'first_name': first_name,
                    'middle_name': f'{middle_name}.',
                    'last_name': last_name,
                    'suffix': '',
                    'birth_date': f'200{random.randint(7, 9)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}',
                    'sex': random.choice(['M', 'F']),
                    'lrn': f'{random.randint(100000000000, 999999999999)}' if random.random() > 0.3 else '',
                },
                'contact': {
                    'email': f'{first_name.lower()}.{last_name.lower().replace(" ", "")}@example.com',
                    'phone': f'09{random.randint(100000000, 999999999)}',
                    'address': f'{random.randint(1, 999)} {random.choice(["Rizal", "Bonifacio", "Luna", "Mabini"])} Street',
                    'barangay': random.choice(['Kiwalan', 'Pala-o', 'Tibanga', 'Hinaplanon']),
                    'municipality': 'Iligan City',
                    'province': 'Lanao del Norte',
                    'zip_code': '9200',
                },
                'academic': {
                    'previous_school': random.choice([
                        'Kiwalan Elementary School',
                        'Pala-o Elementary School',
                        'Iligan City National High School',
                        'St. Michael College'
                    ]),
                },
                'guardian': {
                    'name': f'{random.choice(first_names)} {random.choice(last_names)}',
                    'relationship': random.choice(['Mother', 'Father', 'Guardian']),
                    'phone': f'09{random.randint(100000000, 999999999)}',
                    'email': f'guardian{i}@example.com' if random.random() > 0.5 else '',
                },
                'documents': {
                    'birth_certificate_url': 'https://drive.google.com/file/d/sample_birth_cert' if random.random() > 0.3 else '',
                    'report_card_url': 'https://drive.google.com/file/d/sample_report_card' if random.random() > 0.4 else '',
                    'good_moral_url': 'https://drive.google.com/file/d/sample_good_moral' if random.random() > 0.5 else '',
                }
            }
            
            status = random.choice(statuses)
            reviewer_notes = ''
            
            if status == 'approved':
                reviewer_notes = 'All documents verified. Application approved. Please wait for further instructions.'
            elif status == 'rejected':
                reviewer_notes = 'Please submit a clearer copy of your birth certificate. The current document is not readable.'
            elif status == 'under_review':
                reviewer_notes = 'Reviewing submitted documents. Will update within 2-3 business days.'
            
            application = EnrollmentApplication.objects.create(
                applicant_data=applicant_data,
                grade_level=grade_level,
                strand=strand,
                status=status,
                reviewer_notes=reviewer_notes,
                notes=random.choice(['', '', '', 'I would like to request morning schedule if possible.', 'Transferring from another school.']),
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Created application: {application.tracking_number} - {application.applicant_name} (Grade {grade_level})'
                )
            )
        
        self.stdout.write(self.style.SUCCESS('\n✅ Successfully seeded 10 enrollment applications!'))
        self.stdout.write(self.style.WARNING('\nSample tracking numbers for testing:'))
        
        # Display first 3 tracking numbers for easy testing
        recent_applications = EnrollmentApplication.objects.all()[:3]
        for app in recent_applications:
            self.stdout.write(f'  • {app.tracking_number} - {app.applicant_name} ({app.get_status_display()})')
