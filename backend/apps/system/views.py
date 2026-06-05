from datetime import datetime, timedelta
from django.db.models import Count, Avg, Q, F, Case, When, IntegerField
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.academics.models import Classroom, Quarter, AcademicYear
from apps.academics.permissions import IsAdminOrPrincipal
from apps.attendance.models import AttendanceRecord
from apps.grading.models import Grade
from apps.learning.models import Assignment, Submission


class AnalyticsViewSet(viewsets.ViewSet):
    """
    Analytics and reporting endpoints.
    Principal/Admin only.
    """
    permission_classes = [IsAuthenticated, IsAdminOrPrincipal]

    @action(detail=False, methods=['get'])
    def attendance_overview(self, request):
        """
        Get attendance overview statistics.
        Query params: ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&classroom=uuid
        """
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        classroom_id = request.query_params.get('classroom')

        # Default to last 30 days
        if not date_to:
            date_to = timezone.now().date()
        else:
            date_to = datetime.strptime(date_to, '%Y-%m-%d').date()

        if not date_from:
            date_from = date_to - timedelta(days=30)
        else:
            date_from = datetime.strptime(date_from, '%Y-%m-%d').date()

        # Base query
        records = AttendanceRecord.objects.filter(
            date__gte=date_from,
            date__lte=date_to
        )

        if classroom_id:
            records = records.filter(class_enrollment__classroom_id=classroom_id)

        # Overall stats
        total_records = records.count()
        present_count = records.filter(status='present').count()
        absent_count = records.filter(status='absent').count()
        late_count = records.filter(status='late').count()
        excused_count = records.filter(status='excused').count()

        attendance_rate = round((present_count / total_records * 100), 2) if total_records > 0 else 0

        # Daily trends (last 30 days)
        daily_data = []
        current_date = date_from
        while current_date <= date_to:
            day_records = records.filter(date=current_date)
            day_total = day_records.count()
            day_present = day_records.filter(status='present').count()
            day_rate = round((day_present / day_total * 100), 2) if day_total > 0 else 0

            daily_data.append({
                'date': str(current_date),
                'total': day_total,
                'present': day_present,
                'absent': day_records.filter(status='absent').count(),
                'late': day_records.filter(status='late').count(),
                'rate': day_rate
            })
            current_date += timedelta(days=1)

        # Students with chronic absences (>10% absence rate)
        from apps.accounts.models import User
        students = User.objects.filter(role='student', is_active=True)
        chronic_absences = []

        for student in students:
            student_records = records.filter(class_enrollment__student=student)
            student_total = student_records.count()
            student_absent = student_records.filter(status='absent').count()

            if student_total > 0:
                absence_rate = (student_absent / student_total) * 100
                if absence_rate > 10:
                    chronic_absences.append({
                        'student_id': str(student.id),
                        'student_name': student.display_name,
                        'total_days': student_total,
                        'absent_days': student_absent,
                        'absence_rate': round(absence_rate, 2)
                    })

        chronic_absences.sort(key=lambda x: x['absence_rate'], reverse=True)

        return Response({
            'date_range': {'from': str(date_from), 'to': str(date_to)},
            'overall': {
                'total_records': total_records,
                'present': present_count,
                'absent': absent_count,
                'late': late_count,
                'excused': excused_count,
                'attendance_rate': attendance_rate
            },
            'daily_trends': daily_data,
            'chronic_absences': chronic_absences[:10]  # Top 10
        })

    @action(detail=False, methods=['get'])
    def grade_analytics(self, request):
        """
        Get grade distribution and performance analytics.
        Query params: ?quarter=uuid&grade_level=int&subject=uuid
        """
        quarter_id = request.query_params.get('quarter')
        grade_level = request.query_params.get('grade_level')
        subject_id = request.query_params.get('subject')

        # Base query - only published/locked grades
        grades = Grade.objects.filter(status__in=['published', 'locked'])

        if quarter_id:
            grades = grades.filter(quarter_id=quarter_id)
        if grade_level:
            grades = grades.filter(class_subject__classroom__grade_level=grade_level)
        if subject_id:
            grades = grades.filter(class_subject__subject_id=subject_id)

        total_grades = grades.count()

        if total_grades == 0:
            return Response({
                'message': 'No grades found for the specified filters',
                'total_grades': 0
            })

        # Grade distribution (passing vs failing)
        passing = grades.filter(transmuted_grade__gte=75).count()
        failing = grades.filter(transmuted_grade__lt=75).count()
        passing_rate = round((passing / total_grades * 100), 2)

        # Grade ranges
        grade_ranges = {
            '90-100 (Outstanding)': grades.filter(transmuted_grade__gte=90).count(),
            '85-89 (Very Satisfactory)': grades.filter(transmuted_grade__gte=85, transmuted_grade__lt=90).count(),
            '80-84 (Satisfactory)': grades.filter(transmuted_grade__gte=80, transmuted_grade__lt=85).count(),
            '75-79 (Fairly Satisfactory)': grades.filter(transmuted_grade__gte=75, transmuted_grade__lt=80).count(),
            'Below 75 (Did Not Meet)': grades.filter(transmuted_grade__lt=75).count(),
        }

        # Average grade
        avg_grade = grades.aggregate(avg=Avg('transmuted_grade'))['avg']
        avg_grade = round(avg_grade, 2) if avg_grade else 0

        # Students at risk (failing 2+ subjects)
        from apps.accounts.models import User
        at_risk_students = []
        students = User.objects.filter(role='student', is_active=True)

        for student in students:
            student_grades = grades.filter(class_enrollment__student=student)
            failing_count = student_grades.filter(transmuted_grade__lt=75).count()

            if failing_count >= 2:
                at_risk_students.append({
                    'student_id': str(student.id),
                    'student_name': student.display_name,
                    'failing_subjects': failing_count,
                    'total_subjects': student_grades.count()
                })

        at_risk_students.sort(key=lambda x: x['failing_subjects'], reverse=True)

        # Subject performance (if not filtered by subject)
        subject_performance = []
        if not subject_id:
            from apps.academics.models import Subject
            subjects = Subject.objects.all()

            for subject in subjects:
                subject_grades = grades.filter(class_subject__subject=subject)
                if subject_grades.exists():
                    subject_avg = subject_grades.aggregate(avg=Avg('transmuted_grade'))['avg']
                    subject_passing = subject_grades.filter(transmuted_grade__gte=75).count()
                    subject_total = subject_grades.count()
                    subject_passing_rate = round((subject_passing / subject_total * 100), 2) if subject_total > 0 else 0

                    subject_performance.append({
                        'subject_id': str(subject.id),
                        'subject_name': subject.name,
                        'average_grade': round(subject_avg, 2) if subject_avg else 0,
                        'passing_rate': subject_passing_rate,
                        'total_students': subject_total
                    })

            subject_performance.sort(key=lambda x: x['average_grade'], reverse=True)

        return Response({
            'total_grades': total_grades,
            'passing_rate': passing_rate,
            'average_grade': avg_grade,
            'distribution': {
                'passing': passing,
                'failing': failing
            },
            'grade_ranges': grade_ranges,
            'subject_performance': subject_performance[:10],  # Top 10
            'at_risk_students': at_risk_students[:10]  # Top 10
        })

    @action(detail=False, methods=['get'])
    def assignment_analytics(self, request):
        """
        Get assignment submission and performance analytics.
        Query params: ?class_subject=uuid&date_from=YYYY-MM-DD
        """
        class_subject_id = request.query_params.get('class_subject')
        date_from = request.query_params.get('date_from')

        # Base query - published assignments only
        assignments = Assignment.objects.filter(status='published')

        if class_subject_id:
            assignments = assignments.filter(class_subject_id=class_subject_id)

        if date_from:
            date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
            assignments = assignments.filter(created_at__date__gte=date_from)

        total_assignments = assignments.count()

        if total_assignments == 0:
            return Response({
                'message': 'No assignments found',
                'total_assignments': 0
            })

        # Overall stats
        total_submissions = Submission.objects.filter(assignment__in=assignments).count()
        on_time_submissions = Submission.objects.filter(
            assignment__in=assignments,
            status='submitted'
        ).count()
        late_submissions = Submission.objects.filter(
            assignment__in=assignments,
            status='late'
        ).count()
        graded_submissions = Submission.objects.filter(
            assignment__in=assignments,
            status='graded'
        ).count()

        # Average submission rate
        expected_submissions = 0
        for assignment in assignments:
            expected_submissions += assignment.class_subject.classroom.students.filter(is_active=True).count()

        submission_rate = round((total_submissions / expected_submissions * 100), 2) if expected_submissions > 0 else 0

        # Average score
        graded_subs = Submission.objects.filter(
            assignment__in=assignments,
            status='graded'
        )
        avg_score = graded_subs.aggregate(avg=Avg('score'))['avg']
        avg_score = round(avg_score, 2) if avg_score else 0

        # Assignment performance
        assignment_stats = []
        for assignment in assignments[:20]:  # Limit to recent 20
            assignment_subs = Submission.objects.filter(assignment=assignment)
            expected = assignment.class_subject.classroom.students.filter(is_active=True).count()
            submitted = assignment_subs.count()
            graded = assignment_subs.filter(status='graded').count()
            avg_assignment_score = assignment_subs.filter(status='graded').aggregate(avg=Avg('score'))['avg']

            assignment_stats.append({
                'assignment_id': str(assignment.id),
                'title': assignment.title,
                'due_date': str(assignment.due_date),
                'expected_submissions': expected,
                'actual_submissions': submitted,
                'submission_rate': round((submitted / expected * 100), 2) if expected > 0 else 0,
                'graded_count': graded,
                'average_score': round(avg_assignment_score, 2) if avg_assignment_score else 0
            })

        assignment_stats.sort(key=lambda x: x['submission_rate'], reverse=False)  # Show lowest rates first

        return Response({
            'total_assignments': total_assignments,
            'total_submissions': total_submissions,
            'submission_rate': submission_rate,
            'status_breakdown': {
                'on_time': on_time_submissions,
                'late': late_submissions,
                'graded': graded_submissions,
                'pending': total_submissions - graded_submissions
            },
            'average_score': avg_score,
            'assignment_performance': assignment_stats[:10]  # Top 10 lowest submission rates
        })

    @action(detail=False, methods=['get'])
    def dashboard_overview(self, request):
        """
        Get quick overview stats for admin dashboard.
        """
        # Get current quarter
        current_quarter = Quarter.objects.filter(is_active=True).first()

        # Attendance stats (last 7 days)
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        attendance_records = AttendanceRecord.objects.filter(
            date__gte=week_ago,
            date__lte=today
        )
        total_att = attendance_records.count()
        present_att = attendance_records.filter(status='present').count()
        attendance_rate = round((present_att / total_att * 100), 2) if total_att > 0 else 0

        # Grade stats (current quarter)
        grades = Grade.objects.filter(status__in=['published', 'locked'])
        if current_quarter:
            grades = grades.filter(quarter=current_quarter)

        total_grades = grades.count()
        passing_grades = grades.filter(transmuted_grade__gte=75).count()
        grade_passing_rate = round((passing_grades / total_grades * 100), 2) if total_grades > 0 else 0

        # Assignment stats (last 30 days)
        month_ago = today - timedelta(days=30)
        recent_assignments = Assignment.objects.filter(
            status='published',
            created_at__date__gte=month_ago
        )
        total_recent_assignments = recent_assignments.count()

        pending_grades_count = Submission.objects.filter(
            assignment__in=recent_assignments,
            status__in=['submitted', 'late']
        ).count()

        # Active users
        from apps.accounts.models import User
        active_students = User.objects.filter(role='student', is_active=True).count()
        active_teachers = User.objects.filter(role='teacher', is_active=True).count()

        # Pending approvals
        pending_approvals = Grade.objects.filter(status='pending_approval').count()

        return Response({
            'attendance': {
                'rate': attendance_rate,
                'period': 'Last 7 days',
                'total_records': total_att
            },
            'grades': {
                'passing_rate': grade_passing_rate,
                'total_grades': total_grades,
                'pending_approvals': pending_approvals
            },
            'assignments': {
                'total_recent': total_recent_assignments,
                'pending_grading': pending_grades_count
            },
            'users': {
                'active_students': active_students,
                'active_teachers': active_teachers
            },
            'current_quarter': {
                'id': str(current_quarter.id) if current_quarter else None,
                'name': current_quarter.name if current_quarter else None
            }
        })
