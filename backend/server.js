const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const maxRetries = 5;
const retryInterval = 5000; // 5 seconds

// Create a MySQL connection pool to manage connections efficiently
const dbPool = mysql.createPool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mydiary",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function connectWithRetry(retries) {
  return new Promise((resolve, reject) => {
    dbPool.getConnection((err, connection) => {
      if (err) {
        console.error(`Failed to connect to db - retrying in ${retryInterval / 1000} sec`, err);
        if (retries > 0) {
          setTimeout(() => {
            resolve(connectWithRetry(retries - 1));
          }, retryInterval);
        } else {
          console.error("Max retries reached. Exiting.");
          reject(err);
        }
      } else {
        console.log("Connected to MySQL database");
        resolve(connection);
      }
    });
  });
}

connectWithRetry(maxRetries)
  .then((connection) => {
    connection.release(); // Release the initial connection back to the pool
    startServer();
  })
  .catch((err) => {
    console.error("Failed to connect to database after max retries", err);
    process.exit(1);
  });

// Routes
app.get("/entries", (req, res) => {
  dbPool.query("SELECT * FROM entries ORDER BY date DESC", (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.post("/entries", (req, res) => {
  const { title, content } = req.body;
  dbPool.query("INSERT INTO entries (title, content) VALUES (?, ?)", [title, content], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: result.insertId, title, content });
  });
});

app.put("/entries/:id", (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  dbPool.query("UPDATE entries SET title = ?, content = ? WHERE id = ?", [title, content, id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id, title, content });
  });
});

app.delete("/entries/:id", (req, res) => {
  const { id } = req.params;
  dbPool.query("DELETE FROM entries WHERE id = ?", [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: "Entry deleted successfully" });
  });
});

function startServer() {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
