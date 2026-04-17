import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function Header({ title, isConnected }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="header" id="header">
      <div className="header-left">
        <h2>{title}</h2>
      </div>
      <div className="header-right">
        <div
          className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}
          id="connection-status"
        >
          <span className="connection-dot" />
          {isConnected ? (
            <>
              <Wifi size={14} />
              <span>Live</span>
            </>
          ) : (
            <>
              <WifiOff size={14} />
              <span>Offline</span>
            </>
          )}
        </div>
        <div className="header-time">
          {time.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
      </div>
    </header>
  );
}
