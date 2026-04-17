/**
 * Utility helper functions.
 */

/**
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format bytes per second to readable rate.
 */
export function formatRate(bytesPerSec) {
  if (!bytesPerSec || bytesPerSec === 0) return '0 bps';
  const bits = bytesPerSec * 8;
  if (bits >= 1000000000) return `${(bits / 1000000000).toFixed(1)} Gbps`;
  if (bits >= 1000000) return `${(bits / 1000000).toFixed(1)} Mbps`;
  if (bits >= 1000) return `${(bits / 1000).toFixed(1)} Kbps`;
  return `${bits.toFixed(0)} bps`;
}

/**
 * Format timestamp to relative time.
 */
export function timeAgo(timestamp) {
  if (!timestamp) return '';
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now - time) / 1000);

  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Format timestamp to locale string.
 */
export function formatTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Get latency class for styling.
 */
export function getLatencyClass(ms) {
  if (ms === null || ms === undefined) return 'bad';
  if (ms < 50) return 'good';
  if (ms < 100) return 'medium';
  return 'bad';
}
