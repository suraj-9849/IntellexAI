'use client';

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Upload, Save, Clock, Film, AlertTriangle, ChevronRight, Shield, Eye, Zap, Radio, Cpu, Lock, Unlock, Activity, Scan } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import VideoPlayer from '@/components/video-player';
import TimestampList from '@/components/timestamp-list';
import type { Timestamp } from '@/app/types';
import { detectEvents, type VideoEvent } from './actions';
import Link from 'next/link';
import { sendDangerEmail } from './sendDangerEmail';

/* ─────────────────────────── GLOBAL STYLES ─────────────────────────── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@300;400;500;600;700&family=Orbitron:wght@400;700;900&display=swap');

  :root {
    --safe: #00ff88;
    --danger: #ff2d55;
    --warn: #ffcc00;
    --cyber: #00d4ff;
    --bg-deep: #020408;
    --bg-panel: rgba(5, 15, 25, 0.92);
    --border-glow: rgba(0, 212, 255, 0.3);
    --text-primary: #e8f4ff;
    --text-muted: #4a7a9b;
    --grid-color: rgba(0, 212, 255, 0.04);
  }

  * { box-sizing: border-box; }

  body {
    background: var(--bg-deep);
    font-family: 'Rajdhani', sans-serif;
    overflow-x: hidden;
  }

  .font-mono-cyber { font-family: 'Share Tech Mono', monospace; }
  .font-display { font-family: 'Orbitron', sans-serif; }
  .font-body { font-family: 'Rajdhani', sans-serif; }

  /* ── Scanline overlay ── */
  .scanlines::after {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.03) 2px,
      rgba(0,0,0,0.03) 4px
    );
    pointer-events: none;
    z-index: 9999;
  }

  /* ── Grid background ── */
  .cyber-grid {
    background-color: var(--bg-deep);
    background-image:
      linear-gradient(var(--grid-color) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
    background-size: 40px 40px;
    min-height: 100vh;
  }

  /* ── Glowing border panels ── */
  .panel {
    background: var(--bg-panel);
    border: 1px solid var(--border-glow);
    border-radius: 2px;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(12px);
  }

  .panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(0,212,255,0.03) 0%, transparent 60%);
    pointer-events: none;
  }

  /* Corner accents */
  .panel-corners::before,
  .panel-corners::after {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    border-color: var(--cyber);
    border-style: solid;
    z-index: 2;
  }
  .panel-corners::before {
    top: -1px; left: -1px;
    border-width: 2px 0 0 2px;
  }
  .panel-corners::after {
    bottom: -1px; right: -1px;
    border-width: 0 2px 2px 0;
  }

  /* ── Status text glow ── */
  .glow-safe { color: var(--safe); text-shadow: 0 0 12px var(--safe), 0 0 30px rgba(0,255,136,0.4); }
  .glow-danger { color: var(--danger); text-shadow: 0 0 12px var(--danger), 0 0 30px rgba(255,45,85,0.5); }
  .glow-cyber { color: var(--cyber); text-shadow: 0 0 10px var(--cyber); }

  .border-safe { border-color: rgba(0,255,136,0.5) !important; box-shadow: 0 0 16px rgba(0,255,136,0.15), inset 0 0 16px rgba(0,255,136,0.05); }
  .border-danger { border-color: rgba(255,45,85,0.6) !important; box-shadow: 0 0 20px rgba(255,45,85,0.25), inset 0 0 20px rgba(255,45,85,0.07); }

  /* ── Animations ── */
  @keyframes pulse-danger {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  @keyframes scan-line {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes flicker {
    0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
    20%, 24%, 55% { opacity: 0.4; }
  }
  @keyframes rotate-border {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes slide-in-right {
    from { transform: translateX(60px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slide-in-up {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes blink-cursor {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  @keyframes radar-sweep {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes glitch {
    0%, 90%, 100% { transform: translate(0); clip-path: none; }
    91% { transform: translate(-2px, 1px); clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%); }
    93% { transform: translate(2px, -1px); clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); }
    95% { transform: translate(0); clip-path: none; }
  }
  @keyframes data-stream {
    0% { transform: translateY(0); opacity: 0.8; }
    100% { transform: translateY(-40px); opacity: 0; }
  }

  .anim-pulse-danger { animation: pulse-danger 1.2s ease-in-out infinite; }
  .anim-flicker { animation: flicker 4s linear infinite; }
  .anim-slide-right { animation: slide-in-right 0.35s ease-out forwards; }
  .anim-slide-up { animation: slide-in-up 0.3s ease-out forwards; }
  .anim-glitch { animation: glitch 6s infinite; }

  /* ── Upload zone ── */
  .upload-zone {
    border: 1px dashed rgba(0,212,255,0.35);
    background: rgba(0, 20, 35, 0.6);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  .upload-zone:hover, .upload-zone.dragging {
    border-color: var(--cyber);
    background: rgba(0, 40, 65, 0.7);
    box-shadow: 0 0 30px rgba(0,212,255,0.15), inset 0 0 30px rgba(0,212,255,0.05);
  }
  .upload-zone .scan-effect {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--cyber), transparent);
    animation: scan-line 2.5s linear infinite;
  }

  /* ── Progress bar ── */
  .cyber-progress {
    height: 4px;
    background: rgba(0,212,255,0.1);
    border-radius: 0;
    overflow: visible;
    position: relative;
  }
  .cyber-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #00d4ff, #00ff88);
    position: relative;
    transition: width 0.4s ease;
    box-shadow: 0 0 10px var(--cyber), 0 0 20px rgba(0,212,255,0.4);
  }
  .cyber-progress-fill::after {
    content: '';
    position: absolute;
    right: -1px; top: -3px;
    width: 2px; height: 10px;
    background: white;
    box-shadow: 0 0 8px white;
  }

  /* ── Event log card ── */
  .event-card {
    border-left: 3px solid;
    padding: 10px 14px;
    margin-bottom: 8px;
    border-radius: 0 4px 4px 0;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease;
  }
  .event-card:hover { transform: translateX(3px); }
  .event-card.safe {
    border-left-color: var(--safe);
    background: rgba(0, 255, 136, 0.05);
  }
  .event-card.danger {
    border-left-color: var(--danger);
    background: rgba(255, 45, 85, 0.07);
  }
  .event-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 80%, rgba(255,255,255,0.02));
    pointer-events: none;
  }

  /* ── Stat boxes ── */
  .stat-box {
    background: rgba(0,10,20,0.8);
    border: 1px solid rgba(0,212,255,0.15);
    padding: 12px 16px;
    border-radius: 2px;
    position: relative;
  }

  /* ── CRT effect on video container ── */
  .crt-container {
    position: relative;
  }
  .crt-container::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(0,0,0,0.05) 3px,
      rgba(0,0,0,0.05) 4px
    );
    pointer-events: none;
    z-index: 1;
    border-radius: inherit;
  }

  /* ── Hexagon shield icon ── */
  .hex-shield {
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    display: flex; align-items: center; justify-content: center;
  }

  /* ── Blinking cursor ── */
  .cursor-blink::after {
    content: '█';
    animation: blink-cursor 1s step-end infinite;
    font-size: 0.7em;
    margin-left: 2px;
    color: var(--cyber);
  }

  /* ── Scrollbar ── */
  .cyber-scroll::-webkit-scrollbar { width: 4px; }
  .cyber-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
  .cyber-scroll::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.4); border-radius: 0; }

  /* ── Header title ── */
  .header-title {
    font-family: 'Orbitron', sans-serif;
    font-weight: 900;
    letter-spacing: 0.05em;
    background: linear-gradient(90deg, #00d4ff 0%, #00ff88 40%, #fff 60%, #ff2d55 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Danger flash ── */
  @keyframes danger-flash {
    0%, 100% { background: rgba(255,45,85,0.07); }
    50% { background: rgba(255,45,85,0.16); }
  }
  .anim-danger-flash { animation: danger-flash 1s ease-in-out infinite; }

  /* ── Button ── */
  .cyber-btn {
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: 1px solid var(--cyber);
    background: rgba(0,212,255,0.08);
    color: var(--cyber);
    padding: 10px 20px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.25s;
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  }
  .cyber-btn:hover {
    background: rgba(0,212,255,0.2);
    box-shadow: 0 0 20px rgba(0,212,255,0.35);
    color: #fff;
  }
  .cyber-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .cyber-btn-danger {
    border-color: var(--danger);
    background: rgba(255,45,85,0.08);
    color: var(--danger);
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  }
  .cyber-btn-danger:hover {
    background: rgba(255,45,85,0.2);
    box-shadow: 0 0 20px rgba(255,45,85,0.35);
    color: #fff;
  }

  /* ── Radar animation in header ── */
  .radar-ring {
    border: 1px solid rgba(0,212,255,0.2);
    border-radius: 50%;
    animation: rotate-border 8s linear infinite;
    position: absolute;
  }

  /* ── Tag ── */
  .cyber-tag {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    padding: 2px 8px;
    border-radius: 0;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .tag-safe { background: rgba(0,255,136,0.1); color: var(--safe); border: 1px solid rgba(0,255,136,0.3); }
  .tag-danger { background: rgba(255,45,85,0.1); color: var(--danger); border: 1px solid rgba(255,45,85,0.3); }
  .tag-info { background: rgba(0,212,255,0.1); color: var(--cyber); border: 1px solid rgba(0,212,255,0.3); }

  /* ── Divider ── */
  .cyber-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent);
    margin: 16px 0;
  }

  /* ── Section label ── */
  .section-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.2em;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  /* ── Input ── */
  .cyber-input {
    background: rgba(0, 15, 25, 0.8) !important;
    border: 1px solid rgba(0,212,255,0.25) !important;
    border-radius: 0 !important;
    color: var(--text-primary) !important;
    font-family: 'Share Tech Mono', monospace !important;
    font-size: 13px !important;
    padding: 10px 14px !important;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .cyber-input:focus {
    border-color: var(--cyber) !important;
    box-shadow: 0 0 12px rgba(0,212,255,0.2) !important;
  }
  .cyber-input::placeholder { color: var(--text-muted) !important; }
`;

/* ─────────────────────────── HELPERS ─────────────────────────── */
function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ─────────────────────────── SUBCOMPONENTS ─────────────────────────── */

function HexShield({ dangerous }: { dangerous: boolean }) {
  return (
    <div
      className={`hex-shield ${dangerous ? 'anim-pulse-danger' : ''}`}
      style={{
        width: 44,
        height: 50,
        background: dangerous
          ? 'linear-gradient(135deg, rgba(255,45,85,0.2), rgba(255,45,85,0.05))'
          : 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.05))',
        flexShrink: 0,
      }}
    >
      {dangerous ? (
        <AlertTriangle size={20} color="var(--danger)" />
      ) : (
        <Shield size={20} color="var(--safe)" />
      )}
    </div>
  );
}

function EventLogCard({ event, index }: { event: Timestamp; index: number }) {
  return (
    <div
      className={`event-card anim-slide-right ${event.isDangerous ? 'danger' : 'safe'} ${event.isDangerous ? 'anim-danger-flash' : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-center gap-3">
        <HexShield dangerous={event.isDangerous} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="cyber-tag"
              style={{
                background: event.isDangerous ? 'rgba(255,45,85,0.1)' : 'rgba(0,255,136,0.1)',
                color: event.isDangerous ? 'var(--danger)' : 'var(--safe)',
                border: `1px solid ${event.isDangerous ? 'rgba(255,45,85,0.3)' : 'rgba(0,255,136,0.3)'}`,
              }}
            >
              {event.isDangerous ? '⚠ THREAT' : '✓ CLEAR'}
            </span>
            <span className="font-mono-cyber text-xs" style={{ color: 'var(--cyber)' }}>
              T+{event.timestamp}
            </span>
          </div>
          <p
            className="text-sm leading-snug truncate"
            style={{ color: event.isDangerous ? '#ffa0b0' : '#a0ffd0', fontFamily: 'Rajdhani', fontWeight: 500 }}
          >
            {event.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function RadarIcon() {
  return (
    <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
      <div className="radar-ring" style={{ width: 48, height: 48, top: 0, left: 0 }} />
      <div className="radar-ring" style={{ width: 32, height: 32, top: 8, left: 8, animationDirection: 'reverse', animationDuration: '5s' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Scan size={18} color="var(--cyber)" />
      </div>
    </div>
  );
}

function AnalysisStatusCard({ isUploading, isAnalyzing, progress }: { isUploading: boolean; isAnalyzing: boolean; progress: number }) {
  return (
    <div className="panel panel-corners p-5 anim-slide-up" style={{ borderColor: 'rgba(0,212,255,0.4)' }}>
      <div className="flex items-center gap-4 mb-4">
        <RadarIcon />
        <div>
          <p className="section-label mb-0.5">SYSTEM STATUS</p>
          <h3
            className="font-display anim-flicker"
            style={{ color: 'var(--cyber)', fontSize: 14, letterSpacing: '0.12em' }}
          >
            {isUploading ? 'INGESTING VIDEO FEED' : 'NEURAL THREAT ANALYSIS'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'Share Tech Mono' }}>
            {isUploading ? 'Buffering frames into memory...' : `Scanning frames for hostile activity — ${progress}% complete`}
          </p>
        </div>
      </div>

      <div className="cyber-progress mb-2">
        <div className="cyber-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex justify-between mt-2">
        <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          FRAME_SCAN.EXE
        </span>
        <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--cyber)' }}>
          {progress}%
        </span>
      </div>

      {/* Live blinking dots */}
      <div className="flex gap-2 mt-3 items-center">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--cyber)',
              animation: `pulse-danger ${0.8 + i * 0.15}s ease-in-out infinite`,
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
        <span className="font-mono-cyber cursor-blink" style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
          PROCESSING
        </span>
      </div>
    </div>
  );
}

function LiveThreatBanner({ result }: { result: { description: string; isDangerous: boolean } }) {
  return (
    <div
      className={`panel panel-corners p-4 anim-slide-right ${result.isDangerous ? 'anim-danger-flash' : ''}`}
      style={{
        borderColor: result.isDangerous ? 'rgba(255,45,85,0.6)' : 'rgba(0,255,136,0.5)',
        boxShadow: result.isDangerous
          ? '0 0 24px rgba(255,45,85,0.25), inset 0 0 24px rgba(255,45,85,0.05)'
          : '0 0 20px rgba(0,255,136,0.18), inset 0 0 20px rgba(0,255,136,0.04)',
      }}
    >
      <div className="flex items-center gap-4">
        {result.isDangerous ? (
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 4,
              background: 'rgba(255,45,85,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,45,85,0.4)',
            }}>
              <AlertTriangle size={24} color="var(--danger)" />
            </div>
          </div>
        ) : (
          <div style={{
            width: 48, height: 48, borderRadius: 4,
            background: 'rgba(0,255,136,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(0,255,136,0.3)',
          }}>
            <Shield size={24} color="var(--safe)" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="section-label">LATEST FRAME ANALYSIS</span>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: result.isDangerous ? 'var(--danger)' : 'var(--safe)',
              boxShadow: `0 0 8px ${result.isDangerous ? 'var(--danger)' : 'var(--safe)'}`,
              animation: 'pulse-danger 1s infinite',
            }} />
          </div>
          <p
            className={`font-display text-sm ${result.isDangerous ? 'anim-glitch' : ''}`}
            style={{
              color: result.isDangerous ? 'var(--danger)' : 'var(--safe)',
              textShadow: result.isDangerous
                ? '0 0 10px var(--danger)'
                : '0 0 10px var(--safe)',
              letterSpacing: '0.05em',
            }}
          >
            {result.isDangerous ? '⚠ CRITICAL THREAT DETECTED' : '✓ ZONE CLEAR'}
          </p>
          <p style={{ color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Rajdhani', fontWeight: 500, marginTop: 2 }}>
            {result.description}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            CONF
          </span>
          <div
            className="font-display"
            style={{
              fontSize: 22, fontWeight: 900,
              color: result.isDangerous ? 'var(--danger)' : 'var(--safe)',
              textShadow: `0 0 12px ${result.isDangerous ? 'var(--danger)' : 'var(--safe)'}`,
            }}
          >
            {result.isDangerous ? '⬆HIGH' : '⬇LOW'}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────── */

interface SavedVideo {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  timestamps: Timestamp[];
}

export default function UploadPage() {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);
  const [eventLog, setEventLog] = useState<Timestamp[]>([]);
  const [lastApiResult, setLastApiResult] = useState<{ description: string; isDangerous: boolean } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoName, setVideoName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [systemTime, setSystemTime] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Test email sender
  const handleSendTestEmail = async () => {
    setTestEmailStatus('Sending...');
    try {
      const res = await sendDangerEmail({
        title: 'Test Email from Upload Page',
        description: 'This is a test email to verify the email sending functionality.'
      });
      if (res && !res.error) {
        setTestEmailStatus('Test email sent successfully!');
      } else {
        setTestEmailStatus('Failed to send test email.');
      }
    } catch (err) {
      setTestEmailStatus('Error sending test email.');
    }
    setTimeout(() => setTestEmailStatus(null), 4000);
  };

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setSystemTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const captureFrame = async (video: HTMLVideoElement, time: number): Promise<string | null> => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;
    try { video.currentTime = time; } catch { return null; }
    await new Promise((resolve) => { video.onseeked = resolve; });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleFileUpload = async (e: { target: { files: FileList | null } }) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
  if (!file) return;

    setEventLog([]);
    setLastApiResult(null);

    try {
      const localUrl = URL.createObjectURL(file);
      setVideoUrl(localUrl);
      setVideoName(file.name);

      while (!videoRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const video = videoRef.current;
      video.src = localUrl;

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);
        const ok = () => { clearTimeout(timeout); resolve(true); };
        const fail = () => { clearTimeout(timeout); reject(new Error('Load failed')); };
        video.addEventListener('loadeddata', ok);
        video.addEventListener('error', fail);
        if (video.readyState >= 2) ok();
      });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIsUploading(false);
      setUploadProgress(100);
      setIsAnalyzing(true);

      const duration = video.duration;
      if (!duration || duration === Infinity || isNaN(duration)) throw new Error('Invalid duration');

      const interval = 3;
      const newTimestamps: Timestamp[] = [];

      for (let time = 0; time < duration; time += interval) {
        const progress = Math.floor((time / duration) * 100);
        setUploadProgress(progress);
        const frame = await captureFrame(video, time);
        if (frame) {
          try {
            const result = await detectEvents(frame);
            if (result.events?.length > 0) {
              const event = result.events[0];
              setLastApiResult({ description: event.description, isDangerous: event.isDangerous });
              const timestamp = formatTime(time);
              const eventObj: Timestamp = { timestamp, description: event.description, isDangerous: event.isDangerous };
              newTimestamps.push(eventObj);
              setEventLog((prev) => [eventObj, ...prev].slice(0, 30));
              // Send email if dangerous event detected
              if (event.isDangerous) {
                await sendDangerEmail({
                  title: `Critical Event Detected (${timestamp})`,
                  description: event.description,
                });
              }
            }
          } catch (err) {
            console.error('Frame analysis error:', err);
          }
        }
      }

      setTimestamps(newTimestamps);
      setIsAnalyzing(false);
      setUploadProgress(100);
    } catch (error) {
      console.error('Error:', error);
      setIsUploading(false);
      setIsAnalyzing(false);
      let dangerEvents: Timestamp[] = [];

      // Send summary email after detection
      let summary = '';
      if (dangerEvents.length > 0) {
        summary = `<h3>Dangerous Events Detected in Video: ${file.name}</h3><ul>` +
          dangerEvents.map(ev => `<li><b>${ev.timestamp}</b>: ${ev.description}</li>`).join('') +
          '</ul>';
      } else {
        summary = `<h3>No dangerous events detected in video: ${file.name}</h3>`;
      }
      await sendDangerEmail({
        title: `Video Analysis Report: ${file.name}`,
        description: summary,
      });
    }
  };

  const handleTimestampClick = (timestamp: string) => {
    if (!videoRef.current) return;
    const [m, s] = timestamp.split(':').map(Number);
    videoRef.current.currentTime = m * 60 + s;
    videoRef.current.play();
  };

  const handleSaveVideo = () => {
    if (!videoUrl || !videoName) return;
    const saved: SavedVideo[] = JSON.parse(localStorage.getItem('savedVideos') || '[]');
    saved.push({ id: Date.now().toString(), name: videoName, url: videoUrl, thumbnailUrl: videoUrl, timestamps });
    localStorage.setItem('savedVideos', JSON.stringify(saved));
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const dangerCount = timestamps.filter((t) => t.isDangerous).length;
  const safeCount = timestamps.length - dangerCount;

  return (
    <>
      <style>{globalStyles}</style>

      {/* Test Email Button */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
        <Button variant="outline" onClick={handleSendTestEmail}>
          Send Test Email
        </Button>
        {testEmailStatus && (
          <div style={{ marginTop: 8, color: 'var(--cyber)', fontWeight: 600 }}>{testEmailStatus}</div>
        )}
      </div>

      <div className="cyber-grid scanlines" style={{ color: 'var(--text-primary)', minHeight: '100vh' }}>
        {/* ── Top HUD Bar ── */}
        <div style={{
          borderBottom: '1px solid rgba(0,212,255,0.15)',
          background: 'rgba(0,5,12,0.95)',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(10px)',
        }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isAnalyzing ? 'var(--danger)' : 'var(--safe)',
              boxShadow: `0 0 8px ${isAnalyzing ? 'var(--danger)' : 'var(--safe)'}`,
              animation: isAnalyzing ? 'pulse-danger 0.8s infinite' : 'none',
            }} />
            <span className="font-mono-cyber" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              SENTINEL_AI // THREAT_DETECTION_SYSTEM v2.7.1
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="font-mono-cyber" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              SYS:{' '}
              <span style={{ color: 'var(--safe)' }}>ONLINE</span>
            </span>
            <span className="font-mono-cyber" style={{ fontSize: 11, color: 'var(--cyber)' }}>
              {systemTime}
            </span>
            <span className="font-mono-cyber" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              SESSION: <span style={{ color: 'var(--warn)' }}>{(Math.random() * 0xffff | 0).toString(16).toUpperCase().padStart(4, '0')}</span>
            </span>
          </div>
        </div>

        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
          {/* ── HEADER ── */}
          <div
            className="panel panel-corners mb-6"
            style={{
              padding: '32px 40px',
              borderColor: 'rgba(0,212,255,0.3)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Background decorative elements */}
            <div style={{
              position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)',
              opacity: 0.06, fontSize: 140, fontFamily: 'Orbitron', fontWeight: 900,
              color: 'var(--cyber)', letterSpacing: '-0.05em', userSelect: 'none',
            }}>
              SENTINEL
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="section-label">SYSTEM MODULE</span>
                <div className="cyber-tag tag-info flex items-center gap-1">
                  <Radio size={10} /> ACTIVE
                </div>
              </div>
              <h1
                className="header-title anim-glitch"
                style={{ fontSize: 'clamp(24px, 4vw, 44px)', lineHeight: 1.1, marginBottom: 10 }}
              >
                VIDEO THREAT ANALYZER
              </h1>
              <p style={{ color: 'var(--text-muted)', maxWidth: 600, lineHeight: 1.6, fontFamily: 'Rajdhani', fontSize: 15 }}>
                Upload a video feed to activate AI-powered frame-by-frame threat detection.
                Identifies{' '}
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>violence · weapons · robbery · narcotics</span>
                {' '}in real time.
              </p>

              {/* Stat row */}
              {timestamps.length > 0 && (
                <div className="flex gap-4 mt-4 flex-wrap">
                  <div className="stat-box">
                    <p className="section-label mb-0.5">EVENTS TOTAL</p>
                    <p className="font-display" style={{ fontSize: 22, color: 'var(--cyber)', textShadow: '0 0 10px var(--cyber)' }}>
                      {timestamps.length.toString().padStart(3, '0')}
                    </p>
                  </div>
                  <div className="stat-box">
                    <p className="section-label mb-0.5">THREATS</p>
                    <p className="font-display" style={{ fontSize: 22, color: dangerCount > 0 ? 'var(--danger)' : 'var(--text-muted)', textShadow: dangerCount > 0 ? '0 0 10px var(--danger)' : 'none' }}>
                      {dangerCount.toString().padStart(3, '0')}
                    </p>
                  </div>
                  <div className="stat-box">
                    <p className="section-label mb-0.5">CLEAR ZONES</p>
                    <p className="font-display" style={{ fontSize: 22, color: 'var(--safe)', textShadow: '0 0 10px var(--safe)' }}>
                      {safeCount.toString().padStart(3, '0')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── MAIN LAYOUT ── */}
          <div style={{ display: 'grid', gridTemplateColumns: videoUrl ? '1fr 340px' : '1fr', gap: 20 }}>
            {/* LEFT COL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Upload zone or video player */}
              {!videoUrl ? (
                <label
                  htmlFor="video-upload"
                  className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, cursor: 'pointer', borderRadius: 4 }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file?.type.startsWith('video/')) {
                      const input = document.getElementById('video-upload') as HTMLInputElement;
                      if (input) {
                        const dt = new DataTransfer();
                        dt.items.add(file);
                        input.files = dt.files;
                        handleFileUpload({ target: { files: dt.files } } as any);
                      }
                    }
                  }}
                >
                  <div className="scan-effect" />
                  <div style={{ textAlign: 'center', zIndex: 1, padding: 40 }}>
                    <div style={{
                      width: 80, height: 80, margin: '0 auto 20px',
                      borderRadius: 4, border: '1px solid rgba(0,212,255,0.4)',
                      background: 'rgba(0,212,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 20px rgba(0,212,255,0.1)',
                    }}>
                      <Upload size={36} color="var(--cyber)" />
                    </div>
                    <p className="font-display" style={{ fontSize: 14, letterSpacing: '0.15em', color: 'var(--cyber)', marginBottom: 8 }}>
                      INITIALIZE VIDEO FEED
                    </p>
                    <p className="font-mono-cyber" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>
                      DRAG & DROP OR CLICK TO SELECT // MP4 · MOV · WebM · AVI
                    </p>
                    <button className="cyber-btn" type="button">
                      SELECT FILE
                    </button>
                  </div>
                  <input id="video-upload" type="file" accept="video/*" className="hidden" onChange={handleFileUpload} disabled={isUploading || isAnalyzing} />
                </label>
              ) : (
                <div
                  className="panel crt-container"
                  style={{ overflow: 'hidden', borderColor: 'rgba(0,212,255,0.35)' }}
                >
                  {/* Top bar */}
                  <div style={{
                    padding: '8px 14px',
                    borderBottom: '1px solid rgba(0,212,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(0,10,20,0.6)',
                  }}>
                    <div className="flex items-center gap-2">
                      <Film size={14} color="var(--cyber)" />
                      <span className="font-mono-cyber" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        FEED: <span style={{ color: 'var(--cyber)' }}>{videoName}</span>
                      </span>
                    </div>
                    <div className="cyber-tag tag-info flex items-center gap-1">
                      <Eye size={10} /> MONITORING
                    </div>
                  </div>
                  <VideoPlayer url={videoUrl} timestamps={timestamps} ref={videoRef} />
                </div>
              )}

              {/* Analysis progress */}
              {(isUploading || isAnalyzing) && (
                <AnalysisStatusCard isUploading={isUploading} isAnalyzing={isAnalyzing} progress={uploadProgress} />
              )}

              {/* Latest result banner */}
              {lastApiResult && <LiveThreatBanner result={lastApiResult} />}

              {/* Timestamps list */}
              {videoUrl && !isAnalyzing && timestamps.length > 0 && (
                <div className="panel panel-corners" style={{ borderColor: 'rgba(0,212,255,0.25)' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,212,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="flex items-center gap-2">
                      <Clock size={14} color="var(--cyber)" />
                      <span className="font-display" style={{ fontSize: 12, letterSpacing: '0.15em', color: 'var(--cyber)' }}>
                        INCIDENT TIMELINE
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {dangerCount > 0 && (
                        <span className="cyber-tag tag-danger">{dangerCount} THREAT{dangerCount > 1 ? 'S' : ''}</span>
                      )}
                      <span className="cyber-tag tag-safe">{safeCount} CLEAR</span>
                    </div>
                  </div>
                  <div style={{ padding: '14px 18px' }}>
                    <TimestampList timestamps={timestamps} onTimestampClick={handleTimestampClick} />
                  </div>
                </div>
              )}

              {/* No events message */}
              {videoUrl && !isAnalyzing && timestamps.length === 0 && (
                <div className="panel" style={{ padding: '40px', textAlign: 'center', borderColor: 'rgba(0,255,136,0.3)' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 4,
                    background: 'rgba(0,255,136,0.08)',
                    border: '1px solid rgba(0,255,136,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <Lock size={28} color="var(--safe)" />
                  </div>
                  <p className="font-display" style={{ fontSize: 14, color: 'var(--safe)', letterSpacing: '0.12em', marginBottom: 8 }}>
                    ALL CLEAR — NO THREATS DETECTED
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Rajdhani' }}>
                    The AI found no critical events in this video feed.
                  </p>
                </div>
              )}

              {/* Save section */}
              {videoUrl && (
                <div className="panel panel-corners" style={{ padding: '16px 18px', borderColor: 'rgba(0,212,255,0.2)' }}>
                  <p className="section-label mb-3">ARCHIVE FEED</p>
                  <div className="flex gap-3 flex-wrap items-center">
                    <input
                      className="cyber-input flex-1"
                      style={{ minWidth: 200, background: 'rgba(0,15,25,0.8)', border: '1px solid rgba(0,212,255,0.25)', color: 'var(--text-primary)', fontFamily: 'Share Tech Mono', fontSize: 13, padding: '10px 14px', outline: 'none' }}
                      placeholder="ENTER ARCHIVE LABEL..."
                      value={videoName}
                      onChange={(e) => setVideoName(e.target.value)}
                    />
                    <button className="cyber-btn" onClick={handleSaveVideo} disabled={!videoName} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Save size={14} /> SAVE TO ARCHIVE
                    </button>
                  </div>
                  {showSuccessMessage && (
                    <div className="flex items-center gap-2 mt-3 p-3" style={{ background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 2 }}>
                      <Shield size={16} color="var(--safe)" />
                      <span className="font-mono-cyber" style={{ fontSize: 11, color: 'var(--safe)' }}>
                        ARCHIVE WRITE SUCCESSFUL — VIDEO STORED IN LIBRARY
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            {videoUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Threat gauge */}
                <div className="panel panel-corners" style={{ padding: '18px', borderColor: dangerCount > 0 ? 'rgba(255,45,85,0.35)' : 'rgba(0,255,136,0.3)' }}>
                  <p className="section-label mb-3">THREAT LEVEL</p>
                  <div style={{ position: 'relative', height: 6, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 0, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: timestamps.length > 0 ? `${Math.round((dangerCount / timestamps.length) * 100)}%` : '0%',
                      background: dangerCount > 0
                        ? 'linear-gradient(90deg, var(--warn), var(--danger))'
                        : 'linear-gradient(90deg, var(--safe), var(--cyber))',
                      boxShadow: dangerCount > 0 ? '0 0 10px var(--danger)' : '0 0 10px var(--safe)',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--safe)' }}>SAFE</span>
                    <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {timestamps.length > 0 ? Math.round((dangerCount / timestamps.length) * 100) : 0}%
                    </span>
                    <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--danger)' }}>CRITICAL</span>
                  </div>

                  {dangerCount > 0 && (
                    <div className="flex items-center gap-2 mt-4 p-2 anim-danger-flash" style={{ border: '1px solid rgba(255,45,85,0.3)', borderRadius: 2 }}>
                      <AlertTriangle size={14} color="var(--danger)" />
                      <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--danger)' }}>
                        CRITICAL CONTENT PRESENT
                      </span>
                    </div>
                  )}
                </div>

                {/* File info */}
                <div className="panel panel-corners" style={{ padding: '18px', borderColor: 'rgba(0,212,255,0.2)' }}>
                  <p className="section-label mb-3">FEED METADATA</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'FILENAME', value: videoName, color: 'var(--text-primary)' },
                      {
                        label: 'DURATION',
                        value: videoRef.current?.duration ? formatTime(videoRef.current.duration) : '--:--',
                        color: 'var(--cyber)',
                      },
                      { label: 'TIMESTAMPS', value: timestamps.length.toString(), color: 'var(--cyber)' },
                      { label: 'THREATS', value: dangerCount.toString(), color: dangerCount > 0 ? 'var(--danger)' : 'var(--safe)' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 8 }}>
                        <span className="section-label">{label}</span>
                        <span className="font-mono-cyber" style={{ fontSize: 12, color, maxWidth: 150, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="panel panel-corners" style={{ padding: '18px', borderColor: 'rgba(0,212,255,0.2)' }}>
                  <p className="section-label mb-3">QUICK ACTIONS</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      className="cyber-btn"
                      style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                      onClick={() => videoRef.current?.play()}
                    >
                      <Activity size={13} /> PLAY FEED
                    </button>
                    <Link href="/pages/saved-videos" style={{ textDecoration: 'none' }}>
                      <button className="cyber-btn" style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Cpu size={13} /> VIEW ARCHIVE
                      </button>
                    </Link>
                    <button
                      className="cyber-btn cyber-btn-danger"
                      style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                      onClick={() => { setVideoUrl(''); setTimestamps([]); setVideoName(''); setEventLog([]); setLastApiResult(null); }}
                    >
                      <Upload size={13} /> NEW FEED
                    </button>
                  </div>
                </div>

                {/* Real-time event log */}
                {eventLog.length > 0 && (
                  <div className="panel panel-corners" style={{ padding: '18px', borderColor: 'rgba(0,212,255,0.2)', flex: 1 }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="section-label">EVENT LOG</p>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: isAnalyzing ? 'var(--danger)' : 'var(--safe)',
                        boxShadow: `0 0 8px ${isAnalyzing ? 'var(--danger)' : 'var(--safe)'}`,
                        animation: isAnalyzing ? 'pulse-danger 0.8s infinite' : 'none',
                      }} />
                    </div>
                    <div className="cyber-scroll" style={{ maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                      {eventLog.map((event, i) => (
                        <EventLogCard key={i} event={event} index={i} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer HUD ── */}
        <div style={{
          borderTop: '1px solid rgba(0,212,255,0.12)',
          padding: '10px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,5,12,0.8)',
        }}>
          <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            SENTINEL AI © 2025 // NEURAL THREAT DETECTION ENGINE
          </span>
          <div className="flex items-center gap-4">
            <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              MODEL: <span style={{ color: 'var(--cyber)' }}>CLAUDE-VISION-v3</span>
            </span>
            <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              STATUS:{' '}
              <span style={{ color: isAnalyzing ? 'var(--warn)' : 'var(--safe)' }}>
                {isAnalyzing ? 'SCANNING' : 'STANDBY'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}