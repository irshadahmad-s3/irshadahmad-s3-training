# Same Notes List, two databases

The Day 7 Express API exposes equivalent CRUD endpoints backed by both stores:

- PostgreSQL: `/notes/postgres`
- MongoDB: `/notes/mongo`

Both accept `{ "title": "Read docs", "description": "Review API", "status": "open" }`, return a JSON envelope with `message` and `data`, list all notes, fetch by ID, replace fields on update, and delete. Status values are `open`, `in-progress`, and `done`.

## Database differences

PostgreSQL stores notes in a relational table with typed columns, constraints, timestamps, and an auto-generated integer ID. Queries use SQL and positional parameters such as `$1`; the schema enforces valid status values. MongoDB stores each note as a BSON document in `notes`, with an ObjectId and timestamps. The application validates fields, but MongoDB's flexible document shape does not require a fixed table schema.

SQL is a good fit when data has stable structure, constraints, relations, and joins. It brings transactions and strong relational integrity, but schema changes need migrations and relational modeling may take more upfront planning. MongoDB is convenient when document shapes vary or are read as complete aggregates; it reduces join work for embedded data, but duplicated or unvalidated fields can drift and relationships need references/lookups or application logic.

## Choice for this feature

For this small Notes List, I would choose PostgreSQL. Each note has a stable, simple shape, status values benefit from a database constraint, and there is no need for flexible nested documents. MongoDB works equally well for the demonstrated CRUD operations and may be preferable if notes later contain highly variable nested content.

## Run the same CRUD check against both

```sh
cd solutions/day-6-node-express
npm install
cp .env.example .env
docker compose up -d
npm run db:init
RUN_DB_TESTS=1 npm test
```

The integration tests create a note in each database, list it, read it by ID, update it, and delete it. API examples:

```sh
curl -X POST http://localhost:3000/notes/postgres -H 'Content-Type: application/json' -d '{"title":"Read docs","description":"Review API","status":"open"}'
curl -X POST http://localhost:3000/notes/mongo -H 'Content-Type: application/json' -d '{"title":"Read docs","description":"Review API","status":"open"}'
```
