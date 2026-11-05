// Run with: mongosh "$MONGODB_URI/$MONGODB_DATABASE" --file solutions/mongo/drills.js
// Each block is a mongosh command and is safe to rerun for this practice dataset.
const dbName = db.getName();
const students = db.getCollection('students');

// 1. Insert one document.
students.updateOne({ email: 'maya@example.com' }, { $set: { name: 'Maya Chen', track: 'Node.js', score: 88, active: true } }, { upsert: true });

// 2. Insert several documents without duplicate emails on reruns.
[
  { email: 'omar@example.com', name: 'Omar Ali', track: 'MongoDB', score: 92, active: true },
  { email: 'lee@example.com', name: 'Lee Park', track: 'PostgreSQL', score: 76, active: false },
].forEach((student) => students.updateOne({ email: student.email }, { $set: student }, { upsert: true }));

// 3. Find every student.
students.find({});

// 4. Find students who are active and scored at least 80.
students.find({ active: true, score: { $gte: 80 } });

// 5. Update one student's score.
students.updateOne({ email: 'maya@example.com' }, { $set: { score: 90 } });

// 6. Update every student on the Node.js track.
students.updateMany({ track: 'Node.js' }, { $set: { cohort: 'Day 7' } });

// 7. Delete one student by unique email.
students.deleteOne({ email: 'lee@example.com' });

// 8. Delete all explicitly inactive students.
students.deleteMany({ active: false });

// 9. Sort high-to-low and return at most two students.
students.find({}).sort({ score: -1 }).limit(2);

// 10. Return selected fields only; _id is hidden explicitly.
students.find({}, { projection: { _id: 0, name: 1, email: 1, score: 1 } });

print(`MongoDB drills completed in ${dbName}.`);
