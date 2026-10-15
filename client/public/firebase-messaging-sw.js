/* global importScripts */
// Firebase Cloud Messaging background worker resolution
// Imports main FocusFlow service worker containing app-shell caching and push handling
if (typeof importScripts === 'function') {
  importScripts('/sw.js');
}
