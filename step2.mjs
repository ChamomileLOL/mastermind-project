import express from 'express';
import { MongoClient } from 'mongodb';
import 'dotenv/config';
import cors from 'cors';

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

// Tell Express to read incoming JSON data
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

// 📡 This creates a secure POST endpoint that listens for incoming payloads
app.post('/api/trigger', async (req, res) => {
  try {
    const incomingData = req.body;
    
    // 🛡️ NEW: Check for a secret Mastermind security key
    const apiKey = req.headers['x-api-key'];
    
    if (apiKey !== 'ZOLA_RESTORE_ORDER_99') {
      console.log("❌ Unauthorized access attempt blocked!");
      return res.status(401).json({ message: "Access Denied. Invalid API Key." });
    }

    console.log(`📥 Authorized trigger detected: [${incomingData.execution_id}]`);

    await client.connect();
    const database = client.db('mastermind_db');
    const logsCollection = database.collection('execution_logs');

    const result = await logsCollection.insertOne({
      ...incomingData,
      timestamp: new Date()
    });

    console.log("💾 Payload securely logged to MongoDB Atlas cluster.");
    
    res.status(200).json({
      message: "Render command accepted. Executing simulation...",
      logged_id: result.insertedId
    });

  } catch (error) {
    console.error("❌ System error:", error);
    res.status(500).json({ message: "System fault." });
  } finally {
    await client.close();
  }
});

// 📡 Dedicated API to get logs for the Frontend
app.get('/api/logs', async (req, res) => {
  try {
    await client.connect();
    const database = client.db('mastermind_db');
    const logsCollection = database.collection('execution_logs');

    // Fetch the logs from Atlas, sorted by the newest first
    const logs = await logsCollection.find({}).sort({ timestamp: -1 }).toArray();
    
    // Send standard JSON back to the requester
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "System fault." });
  } finally {
    await client.close();
  }
});

app.listen(port, () => {
  console.log(`🌐 Mastermind Listener active on http://localhost:${port}`);
  console.log("Waiting for incoming API requests...");
});