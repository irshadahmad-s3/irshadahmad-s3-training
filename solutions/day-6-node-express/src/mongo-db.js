require('dotenv').config();
const { MongoClient } = require('mongodb');
const { logError } = require('./logger');
let clientPromise;
let clientInstance;
function mongoDb() {
  if (!clientPromise) {
    clientInstance = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    const client = clientInstance;
    client.on('error', (error) => logError('mongodb_client_error', error));
    clientPromise = client.connect()
      .then(() => client.db(process.env.MONGODB_DATABASE || 's3_training'))
      .catch((error) => {
        logError('mongodb_connection_failed', error);
        if (clientInstance === client) {
          clientInstance = undefined;
          clientPromise = undefined;
        }
        throw error;
      });
  }
  return clientPromise;
}
async function closeMongo() {
  if (clientInstance) await clientInstance.close();
  clientInstance = undefined;
  clientPromise = undefined;
}
module.exports = { mongoDb, closeMongo };
