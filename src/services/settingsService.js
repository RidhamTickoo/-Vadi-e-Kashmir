// src/services/settingsService.js
// Service to manage app settings stored in Appwrite database

import { databases, DATABASE_ID, COLLECTION_IDS, ID } from '../config/appwrite';

const SETTINGS_DOC_ID = 'app_settings';

class SettingsService {
  // Get all settings
  async getSettings() {
    try {
      const doc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_IDS.SETTINGS,
        SETTINGS_DOC_ID
      );
      return { success: true, settings: doc };
    } catch (error) {
      // If document doesn't exist, create default settings
      if (error.code === 404) {
        return await this.initializeSettings();
      }
      console.error('Error getting settings:', error);
      return { success: false, error: error.message };
    }
  }

  // Initialize default settings
  async initializeSettings() {
    try {
      const defaultSettings = {
        acceptingOrders: false,
        maintenanceMode: false,
        updatedAt: new Date().toISOString()
      };

      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.SETTINGS,
        SETTINGS_DOC_ID,
        defaultSettings
      );

      return { success: true, settings: doc };
    } catch (error) {
      console.error('Error initializing settings:', error);
      return { success: false, error: error.message };
    }
  }

  // Update accepting orders status
  async setAcceptingOrders(status) {
    try {
      const doc = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.SETTINGS,
        SETTINGS_DOC_ID,
        {
          acceptingOrders: status,
          updatedAt: new Date().toISOString()
        }
      );
      return { success: true, settings: doc };
    } catch (error) {
      // If document doesn't exist, create it first
      if (error.code === 404) {
        await this.initializeSettings();
        return await this.setAcceptingOrders(status);
      }
      console.error('Error updating accepting orders:', error);
      return { success: false, error: error.message };
    }
  }

  // Get accepting orders status
  async getAcceptingOrders() {
    try {
      const result = await this.getSettings();
      if (result.success) {
        return { success: true, acceptingOrders: result.settings.acceptingOrders };
      }
      return { success: false, acceptingOrders: false };
    } catch (error) {
      console.error('Error getting accepting orders status:', error);
      return { success: false, acceptingOrders: false };
    }
  }
}

const settingsService = new SettingsService();
export default settingsService;
