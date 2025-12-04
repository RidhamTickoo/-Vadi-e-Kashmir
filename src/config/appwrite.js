// src/config/appwrite.js
import { Client, Account, Databases, Storage, ID, Functions } from 'appwrite';

// Appwrite Configuration - Using Environment Variables
const APPWRITE_ENDPOINT = process.env.REACT_APP_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.REACT_APP_APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = process.env.REACT_APP_APPWRITE_DATABASE_ID;
const APPWRITE_EMAIL_FUNCTION_ID = process.env.REACT_APP_EMAIL_FUNCTION_ID;

// Validate required environment variables
if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_DATABASE_ID) {
  throw new Error('Missing required Appwrite environment variables. Please check your .env file.');
}

// Collection IDs
export const COLLECTION_IDS = {
  PRODUCTS: process.env.REACT_APP_COLLECTION_PRODUCTS,
  CATEGORIES: process.env.REACT_APP_COLLECTION_CATEGORIES,
  ORDERS: process.env.REACT_APP_COLLECTION_ORDERS,
  USERS: process.env.REACT_APP_COLLECTION_USERS,
  BLOGS: process.env.REACT_APP_COLLECTION_BLOGS,
  REVIEWS: process.env.REACT_APP_COLLECTION_REVIEWS,
  ADMINS: process.env.REACT_APP_COLLECTION_ADMINS,
  CART: process.env.REACT_APP_COLLECTION_CART,
  SETTINGS: process.env.REACT_APP_COLLECTION_SETTINGS || 'settings'
};

// Storage Bucket IDs
export const BUCKET_IDS = {
  PRODUCTS: process.env.REACT_APP_BUCKET_PRODUCTS,
  BLOGS: process.env.REACT_APP_BUCKET_BLOGS,
  AVATARS: process.env.REACT_APP_BUCKET_AVATARS
};

// Initialize Appwrite Client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Initialize Services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export { ID };

// Export configuration for use in constructing URLs
export const DATABASE_ID = APPWRITE_DATABASE_ID;
export const ENDPOINT = APPWRITE_ENDPOINT;
export const PROJECT_ID = APPWRITE_PROJECT_ID;
export const EMAIL_FUNCTION_ID = APPWRITE_EMAIL_FUNCTION_ID;

export default client;
