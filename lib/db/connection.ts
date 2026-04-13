import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var _mongoConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

if (!global._mongoConn) {
  global._mongoConn = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (global._mongoConn.conn) return global._mongoConn.conn;

  if (!global._mongoConn.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined');
    global._mongoConn.promise = mongoose.connect(uri);
  }

  global._mongoConn.conn = await global._mongoConn.promise;
  return global._mongoConn.conn;
}
