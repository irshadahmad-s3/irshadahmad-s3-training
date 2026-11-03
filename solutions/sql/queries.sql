-- Query 1: Display student names along with their department names.
SELECT
    s.student_id,
    s.first_name,
    s.last_name,
    d.department_name
FROM students s
INNER JOIN departments d
ON s.department_id = d.department_id;


-- Query 2: Count the total number of students in each department.
SELECT
    d.department_name,
    COUNT(s.student_id) AS total_students
FROM departments d
LEFT JOIN students s
ON d.department_id = s.department_id
GROUP BY d.department_id, d.department_name
ORDER BY total_students DESC;


-- Query 3: Display departments having more than 1000 students.
SELECT
    d.department_name,
    COUNT(s.student_id) AS total_students
FROM departments d
INNER JOIN students s
ON d.department_id = s.department_id
GROUP BY d.department_id, d.department_name
HAVING COUNT(s.student_id) > 1000;

-- Query 4: Display the total number of students enrolled in each course.
SELECT
    c.course_name,
    COUNT(e.student_id) AS total_enrollments
FROM courses c
LEFT JOIN enrollments e
ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_name
ORDER BY total_enrollments DESC;


-- Query 5: Display the average marks obtained in each course.
SELECT
    c.course_name,
    ROUND(AVG(e.marks), 2) AS average_marks
FROM courses c
INNER JOIN enrollments e
ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_name
ORDER BY average_marks DESC;


-- Query 6: Display courses having an average score greater than 75.
SELECT
    c.course_name,
    ROUND(AVG(e.marks), 2) AS average_marks
FROM courses c
INNER JOIN enrollments e
ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_name
HAVING AVG(e.marks) > 75;

-- Query 7: Find students who have scored more than the overall average marks.
SELECT
    s.student_id,
    s.first_name,
    s.last_name,
    e.marks
FROM students s
INNER JOIN enrollments e
ON s.student_id = e.student_id
WHERE e.marks > (
    SELECT AVG(marks)
    FROM enrollments
);


-- Query 8: Display students who have not enrolled in any course.
SELECT
    s.student_id,
    s.first_name,
    s.last_name
FROM students s
WHERE NOT EXISTS (
    SELECT 1
    FROM enrollments e
    WHERE e.student_id = s.student_id
);


-- Query 9: Display the department with the highest number of students.
SELECT
    department_name,
    total_students
FROM (
    SELECT
        d.department_name,
        COUNT(s.student_id) AS total_students
    FROM departments d
    INNER JOIN students s
    ON d.department_id = s.department_id
    GROUP BY d.department_id, d.department_name
) AS department_summary
ORDER BY total_students DESC
LIMIT 1;


-- Query 10: Display the top 10 students based on their average marks.
SELECT
    s.student_id,
    s.first_name,
    s.last_name,
    ROUND(AVG(e.marks), 2) AS average_marks
FROM students s
INNER JOIN enrollments e
ON s.student_id = e.student_id
GROUP BY s.student_id, s.first_name, s.last_name
ORDER BY average_marks DESC
LIMIT 10;