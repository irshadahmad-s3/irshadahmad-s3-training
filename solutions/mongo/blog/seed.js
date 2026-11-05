// Run: mongosh "mongodb://localhost:27017/s3_training" --file solutions/mongo/blog/seed.js
const author = { _id: 'author-1', name: 'Asha Rao', bio: 'Writes about databases' };
db.authors.updateOne({ _id: author._id }, { $set: author }, { upsert: true });
const post = {
  _id: 'post-1', title: 'Choosing a database',
  body: 'A practical introduction to SQL and document databases.',
  authorId: author._id,
  tags: ['databases', 'beginner'],
  publishedAt: ISODate('2026-11-05T00:00:00Z'),
  authorSummary: { name: author.name },
};
db.posts.updateOne({ _id: post._id }, { $set: post }, { upsert: true });
const comment = {
  _id: 'comment-1', postId: post._id, authorId: author._id,
  body: 'The examples are helpful.',
  createdAt: ISODate('2026-11-05T01:00:00Z'),
};
db.comments.updateOne({ _id: comment._id }, { $set: comment }, { upsert: true });

print('Post with referenced author and comments:');
db.posts.aggregate([
  { $match: { _id: post._id } },
  { $lookup: { from: 'authors', localField: 'authorId', foreignField: '_id', as: 'author' } },
  { $lookup: { from: 'comments', localField: '_id', foreignField: 'postId', as: 'comments' } },
]).forEach(printjson);
