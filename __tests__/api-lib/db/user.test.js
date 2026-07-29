import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { insertUser, dbProjectionUsers } from '../../../api-lib/db/user';
import bcrypt from 'bcryptjs';

let mongoServer;
let connection;
let db;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  connection = await MongoClient.connect(uri);
  db = connection.db('test');
});

afterAll(async () => {
  await connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  await db.collection('users').deleteMany({});
});

describe('User DB operations', () => {
  describe('insertUser', () => {
    it('should insert a user with default role citizen', async () => {
      const user = await insertUser(db, {
        email: 'test@example.com',
        originalPassword: 'password123',
        name: 'Test User',
        username: 'testuser',
      });
      
      expect(user.role).toBe('citizen');
      expect(user.email).toBe('test@example.com');
      
      const insertedUser = await db.collection('users').findOne({ email: 'test@example.com' });
      expect(insertedUser.role).toBe('citizen');
      
      const match = await bcrypt.compare('password123', insertedUser.password);
      expect(match).toBe(true);
    });
    
    it('should allow overriding the role', async () => {
      const user = await insertUser(db, {
        email: 'admin@example.com',
        originalPassword: 'password123',
        name: 'Admin User',
        username: 'adminuser',
        role: 'admin'
      });
      
      expect(user.role).toBe('admin');
    });
  });

  describe('dbProjectionUsers', () => {
    it('should return projection excluding password and email', () => {
      const projection = dbProjectionUsers();
      expect(projection).toEqual({
        password: 0,
        email: 0,
        emailVerified: 0
      });
    });
    
    it('should prefix fields if prefix is provided', () => {
      const projection = dbProjectionUsers('creator.');
      expect(projection).toEqual({
        'creator.password': 0,
        'creator.email': 0,
        'creator.emailVerified': 0
      });
    });
  });
});
