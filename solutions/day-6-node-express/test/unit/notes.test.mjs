import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectId } from 'mongodb';
import { createRequire } from 'node:module';

const testRequire = createRequire(import.meta.url);
const query = vi.fn();
const collection = {
  insertOne: vi.fn(), find: vi.fn(), findOne: vi.fn(), findOneAndUpdate: vi.fn(), deleteOne: vi.fn(),
};
const dbPath = testRequire.resolve('../../src/db.js');
const mongoDbPath = testRequire.resolve('../../src/mongo-db.js');
testRequire.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { pool: { query } } };
testRequire.cache[mongoDbPath] = { id: mongoDbPath, filename: mongoDbPath, loaded: true, exports: { mongoDb: async () => ({ collection: () => collection }) } };
const { pg, mongo } = testRequire('../../src/notes.js');

describe('PostgreSQL notes adapter', () => {
  beforeEach(() => query.mockReset());
  it('creates and lists notes', async () => {
    const row = { id: 1, title: 'Note', description: 'Text', status: 'open' };
    query.mockResolvedValueOnce({ rows: [row] }).mockResolvedValueOnce({ rows: [row] });
    await expect(pg.create(row)).resolves.toEqual(row);
    await expect(pg.all()).resolves.toEqual([row]);
  });
  it('reads, updates, and deletes by id', async () => {
    const row = { id: 1, title: 'Note', description: 'Text', status: 'open' };
    query.mockResolvedValueOnce({ rows: [row] }).mockResolvedValueOnce({ rows: [row] }).mockResolvedValueOnce({ rowCount: 1 });
    await expect(pg.byId(1)).resolves.toEqual(row);
    await expect(pg.update(1, row)).resolves.toEqual(row);
    await expect(pg.delete(1)).resolves.toBe(true);
  });
  it('returns no row and false when an id is missing', async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rowCount: 0 });
    await expect(pg.byId(404)).resolves.toBeUndefined();
    await expect(pg.delete(404)).resolves.toBe(false);
  });
});

describe('MongoDB notes adapter', () => {
  const id = new ObjectId();
  const note = { title: 'Note', description: 'Text', status: 'open' };
  beforeEach(() => {
    for (const fn of Object.values(collection)) fn.mockReset();
  });
  it('inserts a note with timestamps and returns its string id', async () => {
    collection.insertOne.mockResolvedValue({ insertedId: id });
    const saved = await mongo.create(note);
    expect(saved).toMatchObject({ ...note, id: id.toString() });
    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(saved.updatedAt).toBeInstanceOf(Date);
  });
  it('lists notes in id order and maps Mongo ids to strings', async () => {
    collection.find.mockReturnValue({ sort: () => ({ toArray: async () => [{ _id: id, ...note }] }) });
    await expect(mongo.all()).resolves.toEqual([{ ...note, id: id.toString() }]);
  });
  it('reads existing ids and rejects malformed or missing ids', async () => {
    collection.findOne.mockResolvedValue({ _id: id, ...note });
    await expect(mongo.byId(id.toString())).resolves.toMatchObject({ ...note, id: id.toString() });
    await expect(mongo.byId('bad-id')).resolves.toBeUndefined();
    collection.findOne.mockResolvedValue(null);
    await expect(mongo.byId(new ObjectId().toString())).resolves.toBeUndefined();
  });
  it('updates and deletes existing documents and handles malformed or missing ids', async () => {
    collection.findOneAndUpdate.mockResolvedValue({ _id: id, ...note });
    collection.deleteOne.mockResolvedValue({ deletedCount: 1 });
    await expect(mongo.update(id.toString(), note)).resolves.toMatchObject({ ...note, id: id.toString() });
    await expect(mongo.update('bad-id', note)).resolves.toBeUndefined();
    collection.findOneAndUpdate.mockResolvedValue(null);
    await expect(mongo.update(new ObjectId().toString(), note)).resolves.toBeUndefined();
    await expect(mongo.delete(id.toString())).resolves.toBe(true);
    await expect(mongo.delete('bad-id')).resolves.toBe(false);
    collection.deleteOne.mockResolvedValue({ deletedCount: 0 });
    await expect(mongo.delete(new ObjectId().toString())).resolves.toBe(false);
  });
  it('propagates MongoDB errors', async () => {
    collection.insertOne.mockRejectedValue(new Error('database unavailable'));
    await expect(mongo.create(note)).rejects.toThrow('database unavailable');
  });
});
