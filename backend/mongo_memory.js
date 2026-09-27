const { MongoMemoryServer } = require('mongodb-memory-server');

async function startMongo() {
  const mongoServer = await MongoMemoryServer.create({
    instance: {
      port: 27017
    }
  });
  console.log(`MongoDB running on ${mongoServer.getUri()}`);
  
  // Keep alive
  process.stdin.resume();
}

startMongo();
