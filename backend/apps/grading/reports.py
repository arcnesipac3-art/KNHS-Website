import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

class SF9Generator:
    """Generator for DepEd School Form 9 (Learner's Progress Report Card)."""

    def __init__(self, student_data, grades_data, conduct_data, attendance_data):
        self.student = student_data
        self.grades = grades_data
        self.conduct = conduct_data
        self.attendance = attendance_data
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        self.styles.add(ParagraphStyle(
            name='CenterBold',
            parent=self.styles['Normal'],
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            fontSize=10
        ))
        self.styles.add(ParagraphStyle(
            name='Center',
            parent=self.styles['Normal'],
            alignment=TA_CENTER,
            fontSize=9
        ))
        self.styles.add(ParagraphStyle(
            name='Header1',
            parent=self.styles['Normal'],
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            fontSize=12,
            spaceAfter=6
        ))

    def generate(self):
        """Generate SF9 PDF and return as bytes."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30
        )
        
        elements = []
        
        # 1. Header (School Info)
        elements.extend(self._create_header())
        elements.append(Spacer(1, 12))
        
        # 2. Learner Info
        elements.extend(self._create_learner_info())
        elements.append(Spacer(1, 12))
        
        # 3. Report on Learning Progress (Grades)
        elements.append(Paragraph("REPORT ON LEARNING PROGRESS AND ACHIEVEMENT", self.styles['Header1']))
        elements.append(self._create_grades_table())
        elements.append(Spacer(1, 12))
        
        # 4. Report on Learner's Observed Values (Conduct)
        elements.append(Paragraph("REPORT ON LEARNER'S OBSERVED VALUES", self.styles['Header1']))
        elements.append(self._create_conduct_table())
        elements.append(Spacer(1, 12))
        
        # 5. Attendance Record
        elements.append(Paragraph("ATTENDANCE RECORD", self.styles['Header1']))
        elements.append(self._create_attendance_table())
        
        doc.build(elements)
        pdf = buffer.getvalue()
        buffer.close()
        return pdf

    def _create_header(self):
        return [
            Paragraph("REPUBLIKA NG PILIPINAS", self.styles['Center']),
            Paragraph("KAGAWARAN NG EDUKASYON", self.styles['Center']),
            Paragraph("REGION XII / DIVISION OF ILIGAN CITY", self.styles['CenterBold']),
            Paragraph("KIWALAN NATIONAL HIGH SCHOOL", self.styles['Header1']),
            Paragraph("Kiwalan, Iligan City, Lanao del Norte", self.styles['Center']),
            Paragraph("LEARNER'S PROGRESS REPORT CARD (SF9)", self.styles['Header1']),
        ]

    def _create_learner_info(self):
        data = [
            [f"Name: {self.student['name']}", f"LRN: {self.student['lrn']}"],
            [f"Grade: {self.student['grade_level']}", f"Section: {self.student['section']}"],
            [f"School Year: {self.student['academic_year']}", f"Sex: {self.student['sex'] or 'N/A'}"],
        ]
        t = Table(data, colWidths=[3.5*inch, 3.5*inch])
        t.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        return [t]

    def _create_grades_table(self):
        header = ["Learning Areas", "1", "2", "3", "4", "Final Grade", "Remarks"]
        data = [header]
        
        for subject, quarters in self.grades.items():
            row = [
                subject,
                quarters.get(1, ""),
                quarters.get(2, ""),
                quarters.get(3, ""),
                quarters.get(4, ""),
                quarters.get('final', ""),
                "Passed" if quarters.get('final', 0) >= 75 else "Failed" if quarters.get('final') else ""
            ]
            data.append(row)
            
        t = Table(data, colWidths=[2*inch, 0.5*inch, 0.5*inch, 0.5*inch, 0.5*inch, 1*inch, 1*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        return t

    def _create_conduct_table(self):
        header = ["Core Values", "Behavior Statements", "1", "2", "3", "4"]
        data = [header]
        
        # Group conduct data by core value
        for cv_label, behaviors in self.conduct.items():
            first_behavior = True
            for behavior_text, quarters in behaviors.items():
                row = [
                    cv_label if first_behavior else "",
                    behavior_text,
                    quarters.get(1, ""),
                    quarters.get(2, ""),
                    quarters.get(3, ""),
                    quarters.get(4, ""),
                ]
                data.append(row)
                first_behavior = False
                
        t = Table(data, colWidths=[1.2*inch, 3.5*inch, 0.4*inch, 0.4*inch, 0.4*inch, 0.4*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('SPAN', (0, 1), (0, 2)), # Example span for Maka-Diyos
        ]))
        return t

    def _create_attendance_table(self):
        header = ["", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Total"]
        data = [
            header,
            ["Days Present"] + [""] * 11,
            ["Days Absent"] + [""] * 11,
            ["Days Tardy"] + [""] * 11,
        ]
        # Fill in real data if available in self.attendance
        
        t = Table(data, colWidths=[1.2*inch] + [0.5*inch] * 11)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ]))
        return t
