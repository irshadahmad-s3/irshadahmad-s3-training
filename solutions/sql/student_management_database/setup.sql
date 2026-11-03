-- Student Management System
-- Create departments table

CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE
);

-- Create students table

CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    gender VARCHAR(10),
    date_of_birth DATE,
    department_id INT REFERENCES departments(department_id),
    admission_date DATE NOT NULL
);

-- Create courses table

CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    credits INT NOT NULL,
    department_id INT REFERENCES departments(department_id)
);

-- Create enrollments table

CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(student_id),
    course_id INT NOT NULL REFERENCES courses(course_id),
    enrollment_date DATE NOT NULL,
    marks DECIMAL(5,2),
    status VARCHAR(20) NOT NULL,
    UNIQUE(student_id, course_id)
);
-- Insert 10 departments

INSERT INTO departments (department_name)
VALUES
    ('Computer Science'),
    ('Information Technology'),
    ('Mechanical Engineering'),
    ('Civil Engineering'),
    ('Electrical Engineering'),
    ('Electronics Engineering'),
    ('Business Administration'),
    ('Mathematics'),
    ('Physics'),
    ('Chemistry');
    -- Insert 100 courses across 10 departments

INSERT INTO courses (course_name, credits, department_id)
SELECT
    'Course ' || course_number,
    3 + (course_number % 2),
    ((course_number - 1) % 10) + 1
FROM generate_series(1, 100) AS course_number;
-- Insert 10000 students

INSERT INTO students (
    first_name,
    last_name,
    email,
    gender,
    date_of_birth,
    department_id,
    admission_date
)
SELECT
    'FirstName' || student_number,
    'LastName' || student_number,
    'student' || student_number || '@example.com',
    CASE
        WHEN student_number % 2 = 0 THEN 'Male'
        ELSE 'Female'
    END,
    DATE '2000-01-01' + (student_number % 2500),
    ((student_number - 1) % 10) + 1,
    DATE '2022-07-01' + (student_number % 1000)
FROM generate_series(1, 10000) AS student_number;
-- Insert 20000 student course enrollments

INSERT INTO enrollments (
    student_id,
    course_id,
    enrollment_date,
    marks,
    status
)
SELECT
    student_number,
    ((student_number * 7 + enrollment_number - 1) % 100) + 1,
    DATE '2023-01-01' + (enrollment_number % 700),
    (50 + ((student_number + enrollment_number) % 51))::DECIMAL(5,2),
    CASE
        WHEN (student_number + enrollment_number) % 10 = 0
        THEN 'Failed'
        ELSE 'Completed'
    END
FROM generate_series(1, 10000) AS student_number
CROSS JOIN generate_series(1, 2) AS enrollment_number;