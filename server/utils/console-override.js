/**
 * Console override for production environments
 * Automatically disables debug/info console methods in production
 * while keeping error and warn output
 *
 * Import this at the top of server.js to apply globally
 */

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  // Store original methods
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalDebug = console.debug;

  // Override console methods in production to be no-ops
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};

  // Keep console.warn and console.error untouched for important messages

  // Log that console override is active
  console.warn('⚠️  Production mode: console.log, console.info, and console.debug are disabled');
} else {
  console.log('✅ Development mode: All console logs enabled');
}

export { isProd };
