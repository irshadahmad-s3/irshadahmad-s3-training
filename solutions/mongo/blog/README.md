# MongoDB blog model

Run the commands in `mongosh` after selecting a database, for example `mongosh mongodb://localhost:27017/s3_training`. The model uses three collections: `authors`, `posts`, and `comments`.

## Insert sample data

```javascript
const blog = db;
const author = { _id: "author-1", name: "Asha Rao", bio: "Writes about databases" };
blog.authors.updateOne({ _id: author._id }, { $set: author }, { upsert: true });

const post = {
  _id: "post-1",
  title: "Choosing a database",
  body: "A practical introduction to SQL and document databases.",
  authorId: author._id, // Reference: author is shared and maintained separately.
  tags: ["databases", "beginner"],
  publishedAt: ISODate("2026-11-05T00:00:00Z"),
};
blog.posts.updateOne({ _id: post._id }, { $set: post }, { upsert: true });

const comment = {
  _id: "comment-1",
  postId: post._id, // Reference: comments are independently queried and can grow without bound.
  authorId: author._id,
  body: "The examples are helpful.",
  createdAt: ISODate("2026-11-05T01:00:00Z"),
};
blog.comments.updateOne({ _id: comment._id }, { $set: comment }, { upsert: true });

// Embed a bounded, post-specific snapshot to render a post page without a second read.
blog.posts.updateOne({ _id: post._id }, { $set: { authorSummary: { name: author.name } } });
```

## Retrieve related data

```javascript
const postDoc = blog.posts.findOne({ _id: "post-1" });
const postAuthor = blog.authors.findOne({ _id: postDoc.authorId });
const postComments = blog.comments.find({ postId: postDoc._id }).sort({ createdAt: 1 }).toArray();
printjson({ ...postDoc, author: postAuthor, comments: postComments });

// Or join posts to authors and comments for a report.
blog.posts.aggregate([
  { $match: { _id: "post-1" } },
  { $lookup: { from: "authors", localField: "authorId", foreignField: "_id", as: "author" } },
  { $lookup: { from: "comments", localField: "_id", foreignField: "postId", as: "comments" } },
]);
```

## Embedding versus referencing

- **Post and author:** `authorId` references the canonical author because one author can write many posts and profile edits should have one source of truth. `authorSummary.name` embeds only a small display snapshot used on post pages; it duplicates a name and should be refreshed if the canonical name changes.
- **Post and comments:** comments are referenced by `postId`, rather than embedded as a growing array. A post may receive an unbounded number of comments; separate documents avoid MongoDB's 16 MiB document limit and let comments be paged, moderated, and queried independently.
- **Comment and author:** `authorId` references the author so identity and profile data are not copied into every comment. The post page can query/lookup canonical authors when it needs them.
- **Post tags:** tags are embedded as a small bounded array because they belong to the post, are read with it, and are not independently managed entities.

The reference model costs extra reads or `$lookup` for canonical related data. Embedding is convenient for data that is small, bounded, and commonly read together; references fit shared or unbounded data.
