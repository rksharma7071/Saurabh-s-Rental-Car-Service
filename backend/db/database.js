import mongoose from "mongoose";

mongoose.set("strictQuery", true);

let connectionPromise = null;

/** Connect to MongoDB. Safe to call multiple times — reuses the same connection. */
export function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);
  if (connectionPromise) return connectionPromise;

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    return Promise.reject(
      new Error(
        "MONGODB_URI is not set. Add it to backend/.env (local) or your host's environment variables " +
          "(e.g. a MongoDB Atlas connection string like mongodb+srv://user:pass@cluster.mongodb.net/rental)."
      )
    );
  }

  connectionPromise = mongoose
    .connect(MONGODB_URI)
    .then((conn) => {
      console.log(`Connected to MongoDB (${conn.connection.name})`);
      return conn;
    })
    .catch((err) => {
      connectionPromise = null;
      console.error("MongoDB connection error:", err.message);
      throw err;
    });

  return connectionPromise;
}

export default mongoose;
