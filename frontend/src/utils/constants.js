/**
 * Constants used across the application.
 */

// Device type icons (emoji-based for simplicity)
export const DEVICE_ICONS = {
  modem: '🌐',
  router: '🔀',
  switch: '🔌',
  ap: '📡',
  pc: '🖥️',
  server: '🖧',
  printer: '🖨️',
};

// Device type labels
export const DEVICE_TYPE_LABELS = {
  modem: 'Modem',
  router: 'Router',
  switch: 'Switch',
  ap: 'Access Point',
  pc: 'PC / Client',
  server: 'Server',
  printer: 'Printer',
};

// Status colors
export const STATUS_COLORS = {
  online: '#10b981',
  warning: '#f59e0b',
  offline: '#ef4444',
  unreachable: '#6b7280',
};

// Status labels
export const STATUS_LABELS = {
  online: 'Online',
  warning: 'Warning',
  offline: 'Offline',
  unreachable: 'Unreachable',
};

// Alert type icons
export const ALERT_TYPE_ICONS = {
  down: '🔴',
  high_latency: '🟡',
  recovered: '🟢',
  unreachable: '⚫',
};
