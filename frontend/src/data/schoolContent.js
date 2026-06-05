// School Content Constants for Public Website
// Created: June 5, 2026
// Purpose: Centralized content management for Mission, Vision, Faculty, Programs, News

export const mission = `Kiwalan National High School is committed to providing quality, accessible, and inclusive basic education that develops responsible, competent, and values-driven learners. We strive to deliver effective instruction aligned with the DepEd K-12 MATATAG curriculum, nurturing each learner's academic, personal, and social development to prepare them for higher education, employment, and active citizenship.`

export const vision = `To be a center of educational excellence in Iligan City and Lanao del Norte, producing graduates who are equipped with 21st-century skills, strong moral character, and a passion for lifelong learning. We envision a school community where every learner is empowered to reach their full potential and contribute meaningfully to the nation's progress.`

export const coreValues = [
  {
    id: 1,
    name: 'Excellence',
    description: 'We pursue the highest standards in teaching, learning, and service, continuously improving to meet the needs of our learners and community.',
  },
  {
    id: 2,
    name: 'Integrity',
    description: 'We uphold honesty, transparency, and ethical conduct in all our actions, fostering trust and accountability within our school community.',
  },
  {
    id: 3,
    name: 'Compassion',
    description: 'We care for the holistic well-being of every learner, showing empathy, respect, and understanding in all interactions.',
  },
  {
    id: 4,
    name: 'Innovation',
    description: 'We embrace creativity and adaptability, leveraging technology and modern pedagogies to enhance learning experiences.',
  },
  {
    id: 5,
    name: 'Nationalism',
    description: 'We instill love of country and pride in Filipino heritage, preparing learners to be active and responsible citizens.',
  },
  {
    id: 6,
    name: 'Collaboration',
    description: 'We work together as a community—teachers, learners, parents, and stakeholders—to achieve shared educational goals.',
  },
]

export const facultyList = [
  {
    id: 1,
    name: 'Dr. Maria Elena S. Rodriguez',
    position: 'School Principal',
  },
  {
    id: 2,
    name: 'Prof. Roberto M. Santos',
    position: 'Assistant Principal for Academic Affairs',
  },
  {
    id: 3,
    name: 'Ms. Jennifer L. Cruz',
    position: 'Senior High School Coordinator',
  },
  {
    id: 4,
    name: 'Mr. Antonio P. Reyes',
    position: 'Junior High School Coordinator',
  },
  {
    id: 5,
    name: 'Ms. Grace T. Mendoza',
    position: 'Registrar',
  },
  {
    id: 6,
    name: 'Mr. Carlos D. Villanueva',
    position: 'Guidance Counselor',
  },
]

export const jhsProgram = {
  title: 'Junior High School (Grades 7-10)',
  description: `Our Junior High School program follows the DepEd K-12 MATATAG curriculum, providing a solid foundation in core academic subjects including Mathematics, Science, English, Filipino, Araling Panlipunan, MAPEH, Edukasyon sa Pagpapakatao (ESP), and Technology and Livelihood Education (TLE). We focus on developing critical thinking, problem-solving skills, and values formation to prepare learners for Senior High School and beyond.`,
  highlights: [
    'MATATAG Curriculum implementation for Grades 7-10',
    'Comprehensive subject offerings aligned with DepEd standards',
    'Focus on basic literacy, numeracy, and digital skills',
    'Values education and character development',
    'Preparation for Senior High School track selection',
  ],
}

export const shsStrands = [
  {
    id: 1,
    code: 'STEM',
    name: 'Science, Technology, Engineering, and Mathematics',
    track: 'Academic',
    description: 'Designed for learners pursuing careers in science, engineering, technology, medicine, and mathematics. Emphasizes analytical thinking, research, and scientific inquiry.',
    subjects: 'Pre-Calculus, Basic Calculus, General Biology, General Chemistry, General Physics',
  },
  {
    id: 2,
    code: 'ABM',
    name: 'Accountancy, Business, and Management',
    track: 'Academic',
    description: 'Prepares learners for business, entrepreneurship, accounting, and management careers. Develops financial literacy, business acumen, and leadership skills.',
    subjects: 'Fundamentals of Accountancy, Business Ethics, Business Math, Business Finance, Organization and Management',
  },
  {
    id: 3,
    code: 'HUMSS',
    name: 'Humanities and Social Sciences',
    track: 'Academic',
    description: 'Ideal for learners interested in social sciences, education, liberal arts, communication, and public service. Enhances critical thinking and cultural awareness.',
    subjects: 'Philippine Politics and Governance, World Religions, Creative Writing, Creative Nonfiction, Disciplines and Ideas in the Social Sciences',
  },
  {
    id: 4,
    code: 'GAS',
    name: 'General Academic Strand',
    track: 'Academic',
    description: 'Offers flexibility for learners who are undecided about their career path or wish to explore multiple fields. Provides a broad academic foundation.',
    subjects: 'Humanities, Social Sciences, Applied Sciences, and elective courses based on learner interests',
  },
]

export const curriculumOverview = {
  title: 'DepEd K-12 Curriculum',
  description: `Kiwalan National High School implements the Department of Education's K-12 Basic Education Curriculum, enhanced by the MATATAG (Make the curriculum relevant to produce job-ready, Active, and responsible ciTizens who Are inspired by love of country and by Goals for lifelong learning) initiative. Our curriculum balances academic excellence with values formation, ensuring learners are prepared for higher education, employment, entrepreneurship, and middle-level skills development.`,
  structure: [
    'Grades 7-10: Junior High School (Core Subjects)',
    'Grades 11-12: Senior High School (Core + Track Subjects)',
    'Specialized subjects based on chosen track/strand',
    'Work Immersion / Research / Capstone Project',
  ],
}

export const newsItems = [
  {
    id: 1,
    title: 'KNHS Students Excel in Regional Science Fair',
    date: '2026-05-15',
    category: 'Achievement',
    excerpt: 'Three Grade 10 STEM students from KNHS won top honors at the Regional Science and Technology Fair, showcasing innovative research projects in environmental science and renewable energy.',
  },
  {
    id: 2,
    title: 'School Year 2026-2027 Enrollment Now Open',
    date: '2026-05-01',
    category: 'Announcement',
    excerpt: 'KNHS is now accepting applications for incoming Grade 7 and Grade 11 students for SY 2026-2027. Apply online through our digital portal and track your application status in real-time.',
  },
  {
    id: 3,
    title: 'Recognition Day Honors Outstanding Learners',
    date: '2026-04-20',
    category: 'School Event',
    excerpt: 'Over 200 students received academic excellence awards during the 4th Quarter Recognition Day. The ceremony celebrated achievements in academics, sports, arts, and community service.',
  },
  {
    id: 4,
    title: 'Teachers Complete MATATAG Curriculum Training',
    date: '2026-04-10',
    category: 'Academic',
    excerpt: 'All JHS faculty members successfully completed intensive training on the new MATATAG curriculum framework, enhancing their capacity to deliver more relevant and engaging instruction.',
  },
  {
    id: 5,
    title: 'KNHS Launches Digital Learning Portal',
    date: '2026-03-15',
    category: 'Announcement',
    excerpt: 'The school officially launched its comprehensive digital campus portal, enabling students to access assignments, grades, materials, and announcements online. Portal training sessions for students and parents are ongoing.',
  },
  {
    id: 6,
    title: 'Sports Team Wins Division Championship',
    date: '2026-03-05',
    category: 'Achievement',
    excerpt: 'The KNHS varsity basketball team clinched the Division Championship title in the Palarong Panlalawigan 2026, defeating rival schools in a thrilling finals match.',
  },
  {
    id: 7,
    title: 'Brigada Eskwela 2026: Community Partnership Success',
    date: '2026-05-25',
    category: 'School Event',
    excerpt: 'Parents, alumni, and community partners joined forces during Brigada Eskwela week to repair classrooms, paint facilities, and prepare the school for the upcoming academic year.',
  },
]

export const upcomingEvents = [
  {
    id: 1,
    title: 'Opening of Classes - School Year 2026-2027',
    date: '2026-06-15',
    location: 'School Campus',
    description: 'First day of classes for all grade levels. Students are advised to arrive on time and bring necessary school supplies. Orientation for new students will be held in the gymnasium.',
  },
  {
    id: 2,
    title: 'Parent-Teacher Association General Assembly',
    date: '2026-06-20',
    location: 'School Gymnasium',
    description: 'First PTA meeting of the school year. Agenda includes election of officers, budget presentation, and school policies discussion. All parents and guardians are encouraged to attend.',
  },
  {
    id: 3,
    title: 'Disaster Risk Reduction and Management (DRRM) Drill',
    date: '2026-07-05',
    location: 'School Campus',
    description: 'Mandatory earthquake and fire drill for all students and personnel. This activity aims to enhance preparedness and ensure safety protocols are well understood.',
  },
  {
    id: 4,
    title: 'Buwan ng Wika Celebration',
    date: '2026-08-12',
    location: 'School Gymnasium',
    description: 'Month-long celebration of Filipino language and culture featuring sabayang pagbigkas, traditional dances, and cultural presentations by all grade levels.',
  },
  {
    id: 5,
    title: 'First Quarter Grading Period Ends',
    date: '2026-09-15',
    location: 'N/A',
    description: 'End of the first quarter grading period. Report cards will be distributed during the parent-teacher conference scheduled for September 20-22, 2026.',
  },
]

export const officeHours = {
  schedule: 'Monday - Friday: 8:00 AM - 5:00 PM',
  note: 'Office closed on weekends, national holidays, and school breaks. For urgent concerns during enrollment periods, please check the enrollment page for extended hours.',
}

export const contactInfo = {
  address: 'Kiwalan, Iligan City, Lanao del Norte',
  email: 'info@kiwalan-nhs.edu.ph',
  phone: '(063) 123-4567',
  fax: '(063) 123-4568',
}
