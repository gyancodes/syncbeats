// SyncBeats Client Entry Point
import { SyncBeatsApp } from './app/SyncBeatsApp.js';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.syncBeats = new SyncBeatsApp();
});