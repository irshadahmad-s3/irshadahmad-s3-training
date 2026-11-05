// MongoDB University-style practice. Run in mongosh against a scratch database.
const learners = db.learners;
[
  { _id: 1, name: 'Asha', age: 21, score: 88, track: 'MongoDB', active: true },
  { _id: 2, name: 'Ben', age: 19, score: 72, track: 'PostgreSQL', active: true },
  { _id: 3, name: 'Chen', age: 24, score: 95, track: 'MongoDB', active: false },
  { _id: 4, name: 'Dia', age: 20, score: 81, track: 'Node.js' },
].forEach((doc) => learners.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true }));
function answer(question, filter) {
  print(question);
  learners.find(filter).forEach(printjson);
}

// 1. Find the learner whose score is exactly 88. ($eq)
answer('1. Score equals 88 ($eq)', { score: { $eq: 88 } });
// 2. Find learners who are not active. ($ne)
answer('2. Not active ($ne)', { active: { $ne: true } });
// 3. Find learners with a score greater than 80. ($gt)
answer('3. Score above 80 ($gt)', { score: { $gt: 80 } });
// 4. Find learners aged 21 or older. ($gte)
answer('4. Age 21 or older ($gte)', { age: { $gte: 21 } });
// 5. Find learners younger than 21. ($lt)
answer('5. Age below 21 ($lt)', { age: { $lt: 21 } });
// 6. Find learners with score no higher than 81. ($lte)
answer('6. Score at most 81 ($lte)', { score: { $lte: 81 } });
// 7. Find learners on either named track. ($in)
answer('7. MongoDB or Node.js track ($in)', { track: { $in: ['MongoDB', 'Node.js'] } });
// 8. Find learners not on either named track. ($nin)
answer('8. Neither MongoDB nor Node.js track ($nin)', { track: { $nin: ['MongoDB', 'Node.js'] } });
// 9. Find active learners whose score is at least 80. ($and)
answer('9. Active and score at least 80 ($and)', { $and: [{ active: true }, { score: { $gte: 80 } }] });
// 10. Find learners named Asha or with score above 90. ($or); check optional field. ($exists)
answer('10. Asha or score above 90, with track present ($or, $exists)', { $or: [{ name: 'Asha' }, { score: { $gt: 90 } }], track: { $exists: true } });
