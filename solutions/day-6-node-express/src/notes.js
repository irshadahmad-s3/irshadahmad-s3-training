const { ObjectId } = require('mongodb');
const { pool } = require('./db');
const { mongoDb } = require('./mongo-db');

const pg = {
  async create(note) {
    const { rows } = await pool.query('INSERT INTO notes(title,description,status) VALUES($1,$2,$3) RETURNING id::int AS id,title,description,status', [note.title, note.description, note.status]);
    return rows[0];
  },
  async all() { return (await pool.query('SELECT id::int AS id,title,description,status FROM notes ORDER BY id')).rows; },
  async byId(id) { return (await pool.query('SELECT id::int AS id,title,description,status FROM notes WHERE id=$1', [id])).rows[0]; },
  async update(id, note) { return (await pool.query('UPDATE notes SET title=$1,description=$2,status=$3,updated_at=now() WHERE id=$4 RETURNING id::int AS id,title,description,status', [note.title,note.description,note.status,id])).rows[0]; },
  async delete(id) { return (await pool.query('DELETE FROM notes WHERE id=$1', [id])).rowCount > 0; },
};

async function mongoCollection() { return (await mongoDb()).collection('notes'); }
const mongo = {
  async create(note) {
    const doc = { ...note, createdAt: new Date(), updatedAt: new Date() };
    const result = await (await mongoCollection()).insertOne(doc);
    return { ...doc, id: result.insertedId.toString() };
  },
  async all() { return (await (await mongoCollection()).find({}).sort({ _id: 1 }).toArray()).map(({ _id, ...note }) => ({ ...note, id: _id.toString() })); },
  async byId(id) {
    if (!ObjectId.isValid(id)) return undefined;
    const { _id, ...note } = (await (await mongoCollection()).findOne({ _id: new ObjectId(id) })) || {};
    return _id ? { ...note, id: _id.toString() } : undefined;
  },
  async update(id, note) {
    if (!ObjectId.isValid(id)) return undefined;
    const value = await (await mongoCollection()).findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { ...note, updatedAt: new Date() } }, { returnDocument: 'after', includeResultMetadata: false });
    if (!value) return undefined;
    const { _id, ...fields } = value;
    return { ...fields, id: _id.toString() };
  },
  async delete(id) {
    if (!ObjectId.isValid(id)) return false;
    return (await (await mongoCollection()).deleteOne({ _id: new ObjectId(id) })).deletedCount > 0;
  },
};

module.exports = { pg, mongo };
