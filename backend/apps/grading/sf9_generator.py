"""
SF9 (Form 138) Report Card Generator for DepEd Compliance
Generates the official School Form 9 (Learner's Permanent Academic Record)
"""
from decimal import Decimal
from io import BytesIO
from typing import Dict, List, Optional

from django.db.models import Avg, Count, Q
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from apps.academics.models import ClassEnrollment, Quarter, AcademicYear
from apps.attendance.models import AttendanceRecord
from apps.grading.models import Grade, ConductRating
from apps.accounts.models import User


class SF9Generator:
    """Generate SF9 (Form 138) report card for a student."""
    
    def __init__(self, student: User, academic_year: AcademicYear):
        self.student = student
        self.academic_year = academic_year
        self.profile = student.profile
        self.enrollment = self._get_enrollment()
        
    def _get_enrollment(self) -> Optional[ClassEnrollment]:
        """Get active enrollment for student in this academic year."""
        try:
            return ClassEnrollment.objects.get(
                student=self.student,
                classroom__academic_year=self.academic_year,
                status='active'
            )
        except ClassEnrollment.DoesNotExist:
            return None
    
    def get_sf9_data(self) -> Dict:
        """
        Compile all SF9 data for a student.
        
        Returns dict with structure:
        {
            'student_info': {...},
            'grades': [...],
            'attendance': {...},
            'conduct': {...},
            'general_average': float,
            'remarks': str
        }
        """
        if not self.enrollment:
            return {
                'error': 'No active enrollment found for this student in the academic year'
            }
        
        quarters = Quarter.objects.filter(
            academic_year=self.academic_year
        ).order_by('number')
        
        # Get all subjects for this student
        class_subjects = self.enrollment.classroom.class_subjects.all()
        
        # Compile grades by subject and quarter
        grades_data = []
        for subject in class_subjects:
            subject_data = {
                'subject_id': str(subject.id),
                'subject_name': subject.subject.name,
                'subject_code': subject.subject.code,
                'quarters': {}
            }
            
            for quarter in quarters:
                try:
                    grade = Grade.objects.get(
                        class_enrollment=self.enrollment,
                        class_subject=subject,
                        quarter=quarter,
                        status='published'
                    )
                    subject_data['quarters'][f'Q{quarter.number}'] = {
                        'initial_grade': float(grade.initial_grade) if grade.initial_grade else None,
                        'transmuted_grade': grade.transmuted_grade,
                        'remarks': grade.remarks
                    }
                except Grade.DoesNotExist:
                    subject_data['quarters'][f'Q{quarter.number}'] = {
                        'initial_grade': None,
                        'transmuted_grade': None,
                        'remarks': ''
                    }
            
            # Calculate subject average
            transmuted_grades = [
                data['transmuted_grade'] 
                for data in subject_data['quarters'].values() 
                if data['transmuted_grade'] is not None
            ]
            
            if transmuted_grades:
                subject_data['final_grade'] = sum(transmuted_grades) / len(transmuted_grades)
                subject_data['remarks'] = 'PASSED' if subject_data['final_grade'] >= 75 else 'FAILED'
            else:
                subject_data['final_grade'] = None
                subject_data['remarks'] = 'NO GRADE'
            
            grades_data.append(subject_data)
        
        # Calculate general average
        final_grades = [s['final_grade'] for s in grades_data if s['final_grade'] is not None]
        general_average = sum(final_grades) / len(final_grades) if final_grades else None
        
        # Get attendance summary
        attendance_data = self._get_attendance_summary(quarters)
        
        # Get conduct ratings
        conduct_data = self._get_conduct_summary(quarters)
        
        return {
            'student_info': {
                'id': str(self.student.id),
                'lrn': self.profile.lrn or 'N/A',
                'name': self.student.display_name,
                'first_name': self.profile.first_name,
                'last_name': self.profile.last_name,
                'middle_name': self.profile.middle_name or '',
                'grade_level': self.profile.grade_level,
                'section': self.enrollment.classroom.section,
                'strand': self.profile.strand or 'N/A',
                'school_year': self.academic_year.name,
            },
            'grades': grades_data,
            'attendance': attendance_data,
            'conduct': conduct_data,
            'general_average': round(general_average, 2) if general_average else None,
            'remarks': self._get_final_remarks(general_average)
        }
    
    def _get_attendance_summary(self, quarters: List[Quarter]) -> Dict:
        """Get attendance summary for all quarters."""
        attendance_summary = {}
        
        for quarter in quarters:
            records = AttendanceRecord.objects.filter(
                class_enrollment=self.enrollment,
                date__gte=quarter.start_date,
                date__lte=quarter.end_date
            )
            
            present = records.filter(status='P').count()
            absent = records.filter(status='A').count()
            late = records.filter(status='L').count()
            excused = records.filter(status='E').count()
            total = present + absent + late + excused
            
            attendance_summary[f'Q{quarter.number}'] = {
                'present': present,
                'absent': absent,
                'late': late,
                'excused': excused,
                'total_days': total,
                'attendance_rate': round((present / total * 100), 2) if total > 0 else 0
            }
        
        return attendance_summary
    
    def _get_conduct_summary(self, quarters: List[Quarter]) -> Dict:
        """Get conduct/core values ratings for all quarters."""
        conduct_summary = {}
        
        for quarter in quarters:
            ratings = ConductRating.objects.filter(
                class_enrollment=self.enrollment,
                quarter=quarter
            )
            
            conduct_summary[f'Q{quarter.number}'] = []
            for rating in ratings:
                conduct_summary[f'Q{quarter.number}'].append({
                    'core_value': rating.get_core_value_display(),
                    'behavior': rating.behavior,
                    'rating': rating.rating,
                    'rating_display': rating.get_rating_display()
                })
        
        return conduct_summary
    
    def _get_final_remarks(self, general_average: Optional[float]) -> str:
        """Determine final remarks based on general average."""
        if general_average is None:
            return 'INCOMPLETE'
        elif general_average >= 75:
            return 'PASSED'
        else:
            return 'FAILED'
    
    def generate_pdf(self) -> BytesIO:
        """
        Generate SF9 PDF report card.
        
        Returns BytesIO buffer containing the PDF.
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        
        # Get SF9 data
        sf9_data = self.get_sf9_data()
        
        if 'error' in sf9_data:
            # Handle error case
            story = [Paragraph(f"Error: {sf9_data['error']}", getSampleStyleSheet()['Normal'])]
            doc.build(story)
            buffer.seek(0)
            return buffer
        
        # Build PDF content
        story = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#4A1D7E'),
            spaceAfter=12,
            alignment=TA_CENTER
        )
        
        story.append(Paragraph('SCHOOL FORM 9 (SF9)', title_style))
        story.append(Paragraph('LEARNER\'S PERMANENT ACADEMIC RECORD', title_style))
        story.append(Spacer(1, 0.2*inch))
        
        # School Information
        story.append(Paragraph('<b>KIWALAN NATIONAL HIGH SCHOOL</b>', styles['Normal']))
        story.append(Paragraph('Kiwalan, Iligan City', styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        
        # Student Information
        student_info = sf9_data['student_info']
        info_data = [
            ['LRN:', student_info['lrn'], 'Name:', f"{student_info['last_name']}, {student_info['first_name']} {student_info['middle_name']}"],
            ['Grade Level:', str(student_info['grade_level']), 'Section:', student_info['section']],
            ['School Year:', student_info['school_year'], 'Strand/Track:', student_info['strand']],
        ]
        
        info_table = Table(info_data, colWidths=[1*inch, 2*inch, 1*inch, 3*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('BACKGROUND', (2, 0), (2, -1), colors.lightgrey),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Grades Table
        story.append(Paragraph('<b>GRADES</b>', styles['Heading2']))
        
        # Build grades table
        grades_header = ['Subject', 'Q1', 'Q2', 'Q3', 'Q4', 'Final', 'Remarks']
        grades_rows = [grades_header]
        
        for subject in sf9_data['grades']:
            row = [
                subject['subject_name'],
                str(subject['quarters'].get('Q1', {}).get('transmuted_grade', '-')),
                str(subject['quarters'].get('Q2', {}).get('transmuted_grade', '-')),
                str(subject['quarters'].get('Q3', {}).get('transmuted_grade', '-')),
                str(subject['quarters'].get('Q4', {}).get('transmuted_grade', '-')),
                str(round(subject['final_grade'], 2)) if subject['final_grade'] else '-',
                subject['remarks']
            ]
            grades_rows.append(row)
        
        # Add general average row
        gen_avg = sf9_data['general_average']
        grades_rows.append([
            'GENERAL AVERAGE',
            '', '', '', '',
            str(gen_avg) if gen_avg else '-',
            sf9_data['remarks']
        ])
        
        grades_table = Table(grades_rows, colWidths=[2.5*inch, 0.5*inch, 0.5*inch, 0.5*inch, 0.5*inch, 0.7*inch, 0.8*inch])
        grades_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4A1D7E')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
            ('FONTNAME', (0, -1), (0, -1), 'Helvetica-Bold'),
        ]))
        story.append(grades_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Attendance Summary
        story.append(Paragraph('<b>ATTENDANCE</b>', styles['Heading2']))
        attendance_header = ['Quarter', 'Present', 'Absent', 'Late', 'Excused', 'Total Days']
        attendance_rows = [attendance_header]
        
        for quarter_key in ['Q1', 'Q2', 'Q3', 'Q4']:
            att_data = sf9_data['attendance'].get(quarter_key, {})
            if att_data:
                row = [
                    quarter_key,
                    str(att_data.get('present', 0)),
                    str(att_data.get('absent', 0)),
                    str(att_data.get('late', 0)),
                    str(att_data.get('excused', 0)),
                    str(att_data.get('total_days', 0))
                ]
                attendance_rows.append(row)
        
        attendance_table = Table(attendance_rows, colWidths=[1*inch, 1*inch, 1*inch, 1*inch, 1*inch, 1*inch])
        attendance_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4A1D7E')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ]))
        story.append(attendance_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Footer
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph('________________________', styles['Normal']))
        story.append(Paragraph('Class Adviser', styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        story.append(Paragraph('________________________', styles['Normal']))
        story.append(Paragraph('School Principal', styles['Normal']))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer


def generate_class_sf9_batch(classroom_id: str, academic_year_id: str) -> List[Dict]:
    """
    Generate SF9 data for all students in a class.
    
    Args:
        classroom_id: UUID of the classroom
        academic_year_id: UUID of the academic year
    
    Returns:
        List of SF9 data dicts for each student
    """
    from apps.academics.models import Classroom
    
    try:
        classroom = Classroom.objects.get(id=classroom_id)
        academic_year = AcademicYear.objects.get(id=academic_year_id)
    except (Classroom.DoesNotExist, AcademicYear.DoesNotExist):
        return []
    
    enrollments = ClassEnrollment.objects.filter(
        classroom=classroom,
        status='active'
    ).select_related('student', 'student__profile')
    
    sf9_data_list = []
    for enrollment in enrollments:
        generator = SF9Generator(enrollment.student, academic_year)
        sf9_data = generator.get_sf9_data()
        sf9_data_list.append(sf9_data)
    
    return sf9_data_list
