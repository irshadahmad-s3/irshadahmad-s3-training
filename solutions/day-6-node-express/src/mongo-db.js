require('dotenv').config();
const { MongoClient } = require('mongodb');
let clientPromise;
let clientInstance;
function mongoDb() {
  if (!clientPromise) {
    clientInstance = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    clientPromise = clientInstance.connect().then(() => clientInstance.db(process.env.MONGODB_DATABASE || 's3_training'));
  }
  return clientPromise;
}
async function closeMongo() {
  if (clientInstance) await clientInstance.close();
  clientInstance = undefined;
  clientPromise = undefined;
}
module.exports = { mongoDb, closeMongo };
