"""
Seed data for initializing the knowledge base with sample database schemas.
"""

SAMPLE_SCHEMAS = [
    {
        "name": "ecommerce_db",
        "description": "E-commerce platform with users, products, orders, and payments. Includes cart functionality and order tracking.",
        "schema": """
-- Users and Authentication
users(
    user_id INT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
)

-- User Addresses
addresses(
    address_id INT PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES users(user_id),
    address_type VARCHAR(20), -- 'billing' or 'shipping'
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE
)

-- Product Categories
categories(
    category_id INT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    parent_category_id INT FOREIGN KEY REFERENCES categories(category_id),
    description TEXT,
    image_url VARCHAR(500)
)

-- Products
products(
    product_id INT PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT FOREIGN KEY REFERENCES categories(category_id),
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    stock_quantity INT DEFAULT 0,
    sku VARCHAR(50) UNIQUE,
    brand VARCHAR(100),
    weight DECIMAL(8, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
)

-- Shopping Cart
cart(
    cart_id INT PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES users(user_id),
    product_id INT FOREIGN KEY REFERENCES products(product_id),
    quantity INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Orders
orders(
    order_id INT PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES users(user_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address_id INT FOREIGN KEY REFERENCES addresses(address_id),
    billing_address_id INT FOREIGN KEY REFERENCES addresses(address_id),
    status VARCHAR(50), -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP
)

-- Order Items
order_items(
    order_item_id INT PRIMARY KEY,
    order_id INT FOREIGN KEY REFERENCES orders(order_id),
    product_id INT FOREIGN KEY REFERENCES products(product_id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
)

-- Payments
payments(
    payment_id INT PRIMARY KEY,
    order_id INT FOREIGN KEY REFERENCES orders(order_id),
    payment_method VARCHAR(50), -- 'credit_card', 'paypal', 'stripe', etc.
    amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(50), -- 'pending', 'completed', 'failed', 'refunded'
    transaction_id VARCHAR(100),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Product Reviews
reviews(
    review_id INT PRIMARY KEY,
    product_id INT FOREIGN KEY REFERENCES products(product_id),
    user_id INT FOREIGN KEY REFERENCES users(user_id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    helpful_count INT DEFAULT 0
)
"""
    },
    {
        "name": "company_hr_db",
        "description": "Human Resources management system with employees, departments, projects, and payroll tracking.",
        "schema": """
-- Departments
departments(
    department_id INT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    manager_id INT,
    budget DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Employees
employees(
    employee_id INT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    hire_date DATE NOT NULL,
    job_title VARCHAR(100),
    department_id INT FOREIGN KEY REFERENCES departments(department_id),
    manager_id INT FOREIGN KEY REFERENCES employees(employee_id),
    salary DECIMAL(10, 2),
    commission_pct DECIMAL(4, 2),
    birth_date DATE,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE
)

-- Projects
projects(
    project_id INT PRIMARY KEY,
    project_name VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15, 2),
    department_id INT FOREIGN KEY REFERENCES departments(department_id),
    status VARCHAR(50), -- 'planning', 'active', 'on_hold', 'completed', 'cancelled'
    priority VARCHAR(20) -- 'low', 'medium', 'high', 'critical'
)

-- Employee Project Assignments
project_assignments(
    assignment_id INT PRIMARY KEY,
    employee_id INT FOREIGN KEY REFERENCES employees(employee_id),
    project_id INT FOREIGN KEY REFERENCES projects(project_id),
    role VARCHAR(100),
    hours_allocated DECIMAL(6, 2),
    start_date DATE,
    end_date DATE
)

-- Attendance
attendance(
    attendance_id INT PRIMARY KEY,
    employee_id INT FOREIGN KEY REFERENCES employees(employee_id),
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status VARCHAR(20), -- 'present', 'absent', 'leave', 'holiday'
    notes TEXT
)

-- Leave Requests
leave_requests(
    leave_id INT PRIMARY KEY,
    employee_id INT FOREIGN KEY REFERENCES employees(employee_id),
    leave_type VARCHAR(50), -- 'vacation', 'sick', 'personal', 'maternity', 'paternity'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INT,
    reason TEXT,
    status VARCHAR(20), -- 'pending', 'approved', 'rejected'
    approved_by INT FOREIGN KEY REFERENCES employees(employee_id),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP
)

-- Payroll
payroll(
    payroll_id INT PRIMARY KEY,
    employee_id INT FOREIGN KEY REFERENCES employees(employee_id),
    pay_period_start DATE,
    pay_period_end DATE,
    basic_salary DECIMAL(10, 2),
    overtime_hours DECIMAL(6, 2),
    overtime_pay DECIMAL(10, 2),
    bonuses DECIMAL(10, 2),
    deductions DECIMAL(10, 2),
    net_pay DECIMAL(10, 2),
    payment_date DATE,
    payment_method VARCHAR(50)
)

-- Performance Reviews
performance_reviews(
    review_id INT PRIMARY KEY,
    employee_id INT FOREIGN KEY REFERENCES employees(employee_id),
    reviewer_id INT FOREIGN KEY REFERENCES employees(employee_id),
    review_date DATE,
    review_period_start DATE,
    review_period_end DATE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    strengths TEXT,
    areas_for_improvement TEXT,
    goals TEXT,
    comments TEXT
)
"""
    },
    {
        "name": "school_management_db",
        "description": "Educational institution management with students, courses, enrollments, grades, and faculty.",
        "schema": """
-- Students
students(
    student_id INT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    enrollment_date DATE,
    graduation_date DATE,
    status VARCHAR(20), -- 'active', 'graduated', 'withdrawn', 'suspended'
    gpa DECIMAL(3, 2)
)

-- Faculty
faculty(
    faculty_id INT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    title VARCHAR(100), -- 'Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'
    hire_date DATE,
    office_location VARCHAR(100),
    specialization VARCHAR(200)
)

-- Courses
courses(
    course_id INT PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    description TEXT,
    credits INT,
    department VARCHAR(100),
    level VARCHAR(20), -- 'Undergraduate', 'Graduate', 'Doctoral'
    prerequisites VARCHAR(500)
)

-- Semesters
semesters(
    semester_id INT PRIMARY KEY,
    semester_name VARCHAR(50), -- 'Fall 2024', 'Spring 2025'
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE
)

-- Course Sections
sections(
    section_id INT PRIMARY KEY,
    course_id INT FOREIGN KEY REFERENCES courses(course_id),
    semester_id INT FOREIGN KEY REFERENCES semesters(semester_id),
    faculty_id INT FOREIGN KEY REFERENCES faculty(faculty_id),
    section_number VARCHAR(10),
    schedule VARCHAR(100), -- 'MWF 10:00-11:00'
    room VARCHAR(50),
    max_capacity INT,
    enrolled_count INT DEFAULT 0
)

-- Enrollments
enrollments(
    enrollment_id INT PRIMARY KEY,
    student_id INT FOREIGN KEY REFERENCES students(student_id),
    section_id INT FOREIGN KEY REFERENCES sections(section_id),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20), -- 'enrolled', 'dropped', 'completed'
    grade VARCHAR(5)
)

-- Assignments
assignments(
    assignment_id INT PRIMARY KEY,
    section_id INT FOREIGN KEY REFERENCES sections(section_id),
    title VARCHAR(200),
    description TEXT,
    due_date TIMESTAMP,
    max_points INT,
    assignment_type VARCHAR(50) -- 'homework', 'quiz', 'exam', 'project'
)

-- Grades
grades(
    grade_id INT PRIMARY KEY,
    enrollment_id INT FOREIGN KEY REFERENCES enrollments(enrollment_id),
    assignment_id INT FOREIGN KEY REFERENCES assignments(assignment_id),
    points_earned DECIMAL(5, 2),
    submitted_at TIMESTAMP,
    graded_at TIMESTAMP,
    feedback TEXT
)

-- Attendance
class_attendance(
    attendance_id INT PRIMARY KEY,
    enrollment_id INT FOREIGN KEY REFERENCES enrollments(enrollment_id),
    class_date DATE,
    status VARCHAR(20), -- 'present', 'absent', 'late', 'excused'
    notes TEXT
)

-- Student Fees
student_fees(
    fee_id INT PRIMARY KEY,
    student_id INT FOREIGN KEY REFERENCES students(student_id),
    semester_id INT FOREIGN KEY REFERENCES semesters(semester_id),
    fee_type VARCHAR(50), -- 'tuition', 'lab', 'library', 'activity'
    amount DECIMAL(10, 2),
    due_date DATE,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    payment_date DATE,
    status VARCHAR(20) -- 'pending', 'paid', 'overdue', 'waived'
)
"""
    },
    {
        "name": "hospital_db",
        "description": "Healthcare management system with patients, doctors, appointments, treatments, and medical records.",
        "schema": """
-- Patients
patients(
    patient_id INT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    blood_type VARCHAR(5),
    phone VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    registration_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE
)

-- Doctors
doctors(
    doctor_id INT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    specialization VARCHAR(100),
    license_number VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    email VARCHAR(100),
    years_of_experience INT,
    consultation_fee DECIMAL(8, 2),
    department VARCHAR(100),
    is_available BOOLEAN DEFAULT TRUE
)

-- Appointments
appointments(
    appointment_id INT PRIMARY KEY,
    patient_id INT FOREIGN KEY REFERENCES patients(patient_id),
    doctor_id INT FOREIGN KEY REFERENCES doctors(doctor_id),
    appointment_date DATE,
    appointment_time TIME,
    duration_minutes INT DEFAULT 30,
    reason VARCHAR(500),
    status VARCHAR(20), -- 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Medical Records
medical_records(
    record_id INT PRIMARY KEY,
    patient_id INT FOREIGN KEY REFERENCES patients(patient_id),
    doctor_id INT FOREIGN KEY REFERENCES doctors(doctor_id),
    visit_date DATE,
    diagnosis TEXT,
    symptoms TEXT,
    treatment TEXT,
    notes TEXT,
    follow_up_date DATE
)

-- Prescriptions
prescriptions(
    prescription_id INT PRIMARY KEY,
    medical_record_id INT FOREIGN KEY REFERENCES medical_records(record_id),
    medication_name VARCHAR(200),
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    prescribed_date DATE,
    refills_allowed INT DEFAULT 0
)

-- Lab Tests
lab_tests(
    test_id INT PRIMARY KEY,
    patient_id INT FOREIGN KEY REFERENCES patients(patient_id),
    doctor_id INT FOREIGN KEY REFERENCES doctors(doctor_id),
    test_name VARCHAR(200),
    test_date DATE,
    results TEXT,
    status VARCHAR(20), -- 'pending', 'in_progress', 'completed'
    technician_name VARCHAR(100),
    notes TEXT
)

-- Hospital Beds
beds(
    bed_id INT PRIMARY KEY,
    room_number VARCHAR(20),
    bed_number VARCHAR(10),
    ward VARCHAR(50), -- 'General', 'ICU', 'Emergency', 'Pediatric', 'Maternity'
    bed_type VARCHAR(50), -- 'Standard', 'Deluxe', 'ICU'
    is_occupied BOOLEAN DEFAULT FALSE,
    daily_rate DECIMAL(8, 2)
)

-- Admissions
admissions(
    admission_id INT PRIMARY KEY,
    patient_id INT FOREIGN KEY REFERENCES patients(patient_id),
    doctor_id INT FOREIGN KEY REFERENCES doctors(doctor_id),
    bed_id INT FOREIGN KEY REFERENCES beds(bed_id),
    admission_date TIMESTAMP,
    discharge_date TIMESTAMP,
    reason TEXT,
    diagnosis TEXT,
    status VARCHAR(20), -- 'admitted', 'discharged', 'transferred'
    total_cost DECIMAL(10, 2)
)

-- Billing
billing(
    bill_id INT PRIMARY KEY,
    patient_id INT FOREIGN KEY REFERENCES patients(patient_id),
    admission_id INT FOREIGN KEY REFERENCES admissions(admission_id),
    bill_date DATE,
    consultation_charges DECIMAL(10, 2),
    medication_charges DECIMAL(10, 2),
    lab_charges DECIMAL(10, 2),
    room_charges DECIMAL(10, 2),
    other_charges DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    payment_status VARCHAR(20), -- 'pending', 'partial', 'paid'
    payment_date DATE
)
"""
    }
]


def initialize_knowledge_base(knowledge_base):
    """
    Initialize the knowledge base with sample schemas.
    """
    print("\n" + "="*60)
    print("Initializing Knowledge Base with Sample Schemas")
    print("="*60)
    
    for schema_data in SAMPLE_SCHEMAS:
        try:
            knowledge_base.add_schema(
                name=schema_data["name"],
                schema=schema_data["schema"],
                description=schema_data["description"]
            )
            print(f"✓ Added schema: {schema_data['name']}")
        except Exception as e:
            print(f"✗ Error adding schema {schema_data['name']}: {e}")
    
    print("="*60)
    print(f"Knowledge Base initialized with {len(SAMPLE_SCHEMAS)} schemas")
    print("="*60 + "\n")
