'use client';

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Search,
  AlertTriangle,
  Shield,
  Maximize2,
  X,
  Crosshair,
  Radio,
  Eye,
  Scan,
  Activity,
  Film,
  Clock,
  ChevronRight,
  Cpu,
} from 'lucide-react';

import VideoPlayer from '@/components/video-player';
import { detectEvents, type VideoEvent } from './actions';
import type { Timestamp } from '@/app/types';

/* ─────────────────────────── GLOBAL STYLES (matches Sentinel AI) ─────────────────────────── */
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

  .scanlines::after {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px
    );
    pointer-events: none;
    z-index: 9999;
  }

  .cyber-grid {
    background-color: var(--bg-deep);
    background-image:
      linear-gradient(var(--grid-color) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
    background-size: 40px 40px;
    min-height: 100vh;
  }

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
  .panel-corners::before { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
  .panel-corners::after  { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

  .glow-safe   { color: var(--safe);  text-shadow: 0 0 12px var(--safe),  0 0 30px rgba(0,255,136,0.4); }
  .glow-danger { color: var(--danger); text-shadow: 0 0 12px var(--danger), 0 0 30px rgba(255,45,85,0.5); }
  .glow-cyber  { color: var(--cyber);  text-shadow: 0 0 10px var(--cyber); }

  @keyframes pulse-danger {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.6; }
  }
  @keyframes scan-line {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes flicker {
    0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
    20%, 24%, 55% { opacity: 0.4; }
  }
  @keyframes slide-in-right {
    from { transform: translateX(60px); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes slide-in-up {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes blink-cursor {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes glitch {
    0%, 90%, 100% { transform: translate(0); clip-path: none; }
    91%  { transform: translate(-2px,  1px); clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%); }
    93%  { transform: translate( 2px, -1px); clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); }
    95%  { transform: translate(0);          clip-path: none; }
  }
  @keyframes danger-flash {
    0%, 100% { background: rgba(255,45,85,0.07); }
    50%       { background: rgba(255,45,85,0.16); }
  }
  @keyframes rotate-border {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .anim-pulse-danger  { animation: pulse-danger 1.2s ease-in-out infinite; }
  .anim-flicker       { animation: flicker 4s linear infinite; }
  .anim-slide-right   { animation: slide-in-right 0.35s ease-out forwards; }
  .anim-slide-up      { animation: slide-in-up 0.3s ease-out forwards; }
  .anim-glitch        { animation: glitch 6s infinite; }
  .anim-danger-flash  { animation: danger-flash 1s ease-in-out infinite; }

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

  .crt-container { position: relative; }
  .crt-container::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 3px,
      rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px
    );
    pointer-events: none;
    z-index: 1;
  }

  .event-card {
    border-left: 3px solid;
    padding: 10px 14px;
    margin-bottom: 8px;
    border-radius: 0 4px 4px 0;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease;
    cursor: pointer;
  }
  .event-card:hover { transform: translateX(3px); }
  .event-card.safe   { border-left-color: var(--safe);   background: rgba(0,255,136,0.05); }
  .event-card.danger { border-left-color: var(--danger);  background: rgba(255,45,85,0.07); }

  .stat-box {
    background: rgba(0,10,20,0.8);
    border: 1px solid rgba(0,212,255,0.15);
    padding: 12px 16px;
    border-radius: 2px;
  }

  .header-title {
    font-family: 'Orbitron', sans-serif;
    font-weight: 900;
    letter-spacing: 0.05em;
    background: linear-gradient(90deg, #00d4ff 0%, #00ff88 40%, #fff 60%, #ff2d55 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

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
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .cyber-btn:hover:not(:disabled) {
    background: rgba(0,212,255,0.2);
    box-shadow: 0 0 20px rgba(0,212,255,0.35);
    color: #fff;
  }
  .cyber-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .cyber-btn-danger {
    border-color: var(--danger);
    background: rgba(255,45,85,0.08);
    color: var(--danger);
  }
  .cyber-btn-danger:hover:not(:disabled) {
    background: rgba(255,45,85,0.2);
    box-shadow: 0 0 20px rgba(255,45,85,0.35);
    color: #fff;
  }

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
  .tag-safe   { background: rgba(0,255,136,0.1); color: var(--safe);   border: 1px solid rgba(0,255,136,0.3); }
  .tag-danger { background: rgba(255,45,85,0.1); color: var(--danger); border: 1px solid rgba(255,45,85,0.3); }
  .tag-info   { background: rgba(0,212,255,0.1); color: var(--cyber);  border: 1px solid rgba(0,212,255,0.3); }
  .tag-warn   { background: rgba(255,204,0,0.1); color: var(--warn);   border: 1px solid rgba(255,204,0,0.3); }

  .section-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.2em;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .cyber-textarea {
    background: rgba(0, 15, 25, 0.85) !important;
    border: 1px solid rgba(0,212,255,0.25) !important;
    border-radius: 2px !important;
    color: var(--text-primary) !important;
    font-family: 'Rajdhani', sans-serif !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    padding: 12px 14px !important;
    outline: none !important;
    resize: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
    line-height: 1.5;
  }
  .cyber-textarea:focus {
    border-color: var(--cyber) !important;
    box-shadow: 0 0 12px rgba(0,212,255,0.2) !important;
  }
  .cyber-textarea::placeholder { color: var(--text-muted) !important; }

  .cyber-scroll::-webkit-scrollbar { width: 4px; }
  .cyber-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
  .cyber-scroll::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.4); border-radius: 0; }

  .frame-thumb {
    position: relative;
    cursor: pointer;
    overflow: hidden;
    border: 1px solid rgba(255,45,85,0.4);
    border-radius: 2px;
    transition: transform 0.2s ease;
  }
  .frame-thumb:hover { transform: scale(1.04); border-color: var(--danger); }
  .frame-thumb img { display: block; width: 100%; height: 80px; object-fit: cover; }
  .frame-thumb .overlay {
    position: absolute; inset: 0;
    background: rgba(255,45,85,0.25);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.2s;
  }
  .frame-thumb:hover .overlay { opacity: 1; }

  /* Modal */
  .modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.88);
    backdrop-filter: blur(6px);
    z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    animation: slide-in-up 0.2s ease-out;
  }
  .modal-inner {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
  }
  .modal-inner img {
    display: block;
    max-width: 100%;
    max-height: 85vh;
    border: 1px solid rgba(255,45,85,0.5);
    border-radius: 2px;
    box-shadow: 0 0 40px rgba(255,45,85,0.3);
  }
  .modal-close {
    position: absolute; top: -14px; right: -14px;
    width: 32px; height: 32px;
    background: rgba(255,45,85,0.15);
    border: 1px solid rgba(255,45,85,0.5);
    border-radius: 2px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
  }
  .modal-close:hover { background: rgba(255,45,85,0.35); }

  .radar-ring {
    border: 1px solid rgba(0,212,255,0.2);
    border-radius: 50%;
    animation: rotate-border 8s linear infinite;
    position: absolute;
  }
`;

/* ─────────────────────────── HELPERS ─────────────────────────── */
function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ─────────────────────────── SUB-COMPONENTS ─────────────────────────── */

function RadarIcon() {
  return (
    <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
      <div className="radar-ring" style={{ width: 48, height: 48, top: 0, left: 0 }} />
      <div className="radar-ring" style={{ width: 32, height: 32, top: 8, left: 8, animationDirection: 'reverse', animationDuration: '5s' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Crosshair size={18} color="var(--cyber)" />
      </div>
    </div>
  );
}

function AnalysisStatusCard({ progress }: { progress: number }) {
  return (
    <div className="panel panel-corners p-5 anim-slide-up" style={{ borderColor: 'rgba(0,212,255,0.4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <RadarIcon />
        <div>
          <p className="section-label" style={{ marginBottom: 2 }}>SYSTEM STATUS</p>
          <h3 className="font-display anim-flicker" style={{ color: 'var(--cyber)', fontSize: 14, letterSpacing: '0.12em' }}>
            NEURAL QUERY ANALYSIS
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'Share Tech Mono' }}>
            Scanning frames against investigation directive — {progress}% complete
          </p>
        </div>
      </div>
      <div className="cyber-progress" style={{ marginBottom: 8 }}>
        <div className="cyber-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--text-muted)' }}>QUERY_SCAN.EXE</span>
        <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--cyber)' }}>{progress}%</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
        {[0,1,2,3,4].map((i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--cyber)',
            animation: `pulse-danger ${0.8 + i * 0.15}s ease-in-out infinite`,
            animationDelay: `${i * 0.12}s`,
          }} />
        ))}
        <span className="font-mono-cyber" style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>PROCESSING</span>
      </div>
    </div>
  );
}

function TimestampCard({ ts, index, onClick }: { ts: Timestamp; index: number; onClick: () => void }) {
  return (
    <div
      className={`event-card anim-slide-right ${ts.isDangerous ? 'danger anim-danger-flash' : 'safe'}`}
      style={{ animationDelay: `${index * 0.04}s` }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, flexShrink: 0, borderRadius: 2,
          background: ts.isDangerous ? 'rgba(255,45,85,0.12)' : 'rgba(0,255,136,0.1)',
          border: `1px solid ${ts.isDangerous ? 'rgba(255,45,85,0.35)' : 'rgba(0,255,136,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {ts.isDangerous
            ? <AlertTriangle size={16} color="var(--danger)" />
            : <Shield size={16} color="var(--safe)" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span className="cyber-tag" style={{
              background: ts.isDangerous ? 'rgba(255,45,85,0.1)' : 'rgba(0,255,136,0.1)',
              color: ts.isDangerous ? 'var(--danger)' : 'var(--safe)',
              border: `1px solid ${ts.isDangerous ? 'rgba(255,45,85,0.3)' : 'rgba(0,255,136,0.3)'}`,
            }}>
              {ts.isDangerous ? '⚠ MATCH' : '✓ CLEAR'}
            </span>
            <span className="font-mono-cyber" style={{ fontSize: 11, color: 'var(--cyber)' }}>
              T+{ts.timestamp}
            </span>
          </div>
          <p style={{
            color: ts.isDangerous ? '#ffa0b0' : '#a0ffd0',
            fontSize: 13, fontFamily: 'Rajdhani', fontWeight: 500,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {ts.description}
          </p>
        </div>
        <ChevronRight size={14} color="var(--text-muted)" />
      </div>
    </div>
  );
}

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────── */
export default function InvestigatePage() {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [investigationPrompt, setInvestigationPrompt] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);
  const [dangerousFrames, setDangerousFrames] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [videoName, setVideoName] = useState('');
  const [systemTime, setSystemTime] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setSystemTime(
        `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
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

  const handleInvestigate = async () => {
    if (!videoUrl || !investigationPrompt) return;

    setIsAnalyzing(true);
    setTimestamps([]);
    setDangerousFrames([]);
    setUploadProgress(0);

    try {
      const video = document.createElement('video');
      video.src = videoUrl;
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => resolve(true);
        video.onerror = () => reject(new Error('Failed to load video'));
      });

      const duration = video.duration;
      if (!duration || duration === Infinity || isNaN(duration)) throw new Error('Invalid video duration');

      const interval = 3;
      const newTimestamps: Timestamp[] = [];
      const newDangerousFrames: string[] = [];

      for (let time = 0; time < duration; time += interval) {
        setUploadProgress(Math.floor((time / duration) * 100));
        const frame = await captureFrame(video, time);
        if (frame) {
          try {
            const result = await detectEvents(frame, investigationPrompt);
            if (result.events?.length > 0) {
              result.events.forEach((event: VideoEvent) => {
                const timestamp = formatTime(time);
                newTimestamps.push({ timestamp, description: event.description, isDangerous: event.isDangerous });
                if (event.isDangerous) newDangerousFrames.push(frame);
              });
            }
          } catch (err) {
            console.error('Frame error:', err);
          }
        }
      }

      setTimestamps(newTimestamps);
      setDangerousFrames(newDangerousFrames);
      setIsAnalyzing(false);
      setUploadProgress(100);
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: { target: { files: FileList | null } }) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setTimestamps([]);
    setDangerousFrames([]);
    const localUrl = URL.createObjectURL(file);
    setVideoUrl(localUrl);
    setVideoName(file.name);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleTimestampClick = (timestamp: string) => {
    if (!videoRef.current) return;
    const [m, s] = timestamp.split(':').map(Number);
    videoRef.current.currentTime = m * 60 + s;
    videoRef.current.play();
  };

  const dangerCount = timestamps.filter(t => t.isDangerous).length;
  const safeCount = timestamps.length - dangerCount;
  const isActive = isUploading || isAnalyzing;

  return (
    <>
      <style>{globalStyles}</style>

      <div className="cyber-grid scanlines" style={{ color: 'var(--text-primary)', minHeight: '100vh' }}>

        {/* ── Top HUD Bar ── */}
        <div style={{
          borderBottom: '1px solid rgba(0,212,255,0.15)',
          background: 'rgba(0,5,12,0.95)',
          padding: '8px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isActive ? 'var(--warn)' : 'var(--safe)',
              boxShadow: `0 0 8px ${isActive ? 'var(--warn)' : 'var(--safe)'}`,
              animation: isActive ? 'pulse-danger 0.8s infinite' : 'none',
            }} />
            <span className="font-mono-cyber" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              SENTINEL_AI // QUERY_INVESTIGATION_MODULE v1.4.2
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span className="font-mono-cyber" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              SYS: <span style={{ color: 'var(--safe)' }}>ONLINE</span>
            </span>
            <span className="font-mono-cyber" style={{ fontSize: 11, color: 'var(--cyber)' }}>{systemTime}</span>
            <span className="font-mono-cyber" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              MODE: <span style={{ color: 'var(--warn)' }}>INVESTIGATE</span>
            </span>
          </div>
        </div>

        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>

          {/* ── HEADER ── */}
          <div className="panel panel-corners" style={{
            padding: '32px 40px', marginBottom: 24,
            borderColor: 'rgba(0,212,255,0.3)', overflow: 'hidden', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)',
              opacity: 0.05, fontSize: 120, fontFamily: 'Orbitron', fontWeight: 900,
              color: 'var(--cyber)', userSelect: 'none',
            }}>QUERY</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className="section-label">SYSTEM MODULE</span>
                <span className="cyber-tag tag-warn" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Crosshair size={10} /> QUERY MODE
                </span>
              </div>
              <h1 className="header-title anim-glitch" style={{ fontSize: 'clamp(22px, 3.5vw, 40px)', lineHeight: 1.1, marginBottom: 10 }}>
                INTELLI INVESTIGATE
              </h1>
              <p style={{ color: 'var(--text-muted)', maxWidth: 580, lineHeight: 1.6, fontFamily: 'Rajdhani', fontSize: 15 }}>
                Upload a video feed and enter a{' '}
                <span style={{ color: 'var(--cyber)', fontWeight: 600 }}>custom directive</span>
                {' '}— the AI will scan every frame and surface matching events.
              </p>

              {timestamps.length > 0 && (
                <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: 'TOTAL MATCHES', value: timestamps.length, color: 'var(--cyber)' },
                    { label: 'THREATS', value: dangerCount, color: dangerCount > 0 ? 'var(--danger)' : 'var(--text-muted)' },
                    { label: 'CLEAR', value: safeCount, color: 'var(--safe)' },
                    { label: 'FLAGGED FRAMES', value: dangerousFrames.length, color: dangerousFrames.length > 0 ? 'var(--warn)' : 'var(--text-muted)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="stat-box">
                      <p className="section-label" style={{ marginBottom: 4 }}>{label}</p>
                      <p className="font-display" style={{ fontSize: 22, color, textShadow: `0 0 10px ${color}` }}>
                        {String(value).padStart(3, '0')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── MAIN GRID ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

            {/* ── LEFT: Video + Prompt + Results ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Video area */}
              {!videoUrl ? (
                <label
                  htmlFor="video-upload"
                  className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: 280, cursor: 'pointer', borderRadius: 2,
                  }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={(e) => {
                    e.preventDefault(); setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file?.type.startsWith('video/'))
                      handleFileUpload({ target: { files: e.dataTransfer.files } });
                  }}
                >
                  <div className="scan-effect" />
                  <div style={{ textAlign: 'center', zIndex: 1, padding: 40 }}>
                    <div style={{
                      width: 72, height: 72, margin: '0 auto 18px',
                      borderRadius: 2, border: '1px solid rgba(0,212,255,0.4)',
                      background: 'rgba(0,212,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 20px rgba(0,212,255,0.1)',
                    }}>
                      <Upload size={32} color="var(--cyber)" />
                    </div>
                    <p className="font-display" style={{ fontSize: 13, letterSpacing: '0.15em', color: 'var(--cyber)', marginBottom: 8 }}>
                      INITIALIZE VIDEO FEED
                    </p>
                    <p className="font-mono-cyber" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>
                      DRAG & DROP OR CLICK // MP4 · MOV · WebM · AVI
                    </p>
                    <button className="cyber-btn" type="button">
                      <Upload size={13} /> SELECT FILE
                    </button>
                  </div>
                  <input
                    id="video-upload" type="file" accept="video/*"
                    className="hidden" onChange={handleFileUpload}
                    disabled={isActive}
                    style={{ display: 'none' }}
                  />
                </label>
              ) : (
                <div className="panel crt-container" style={{ overflow: 'hidden', borderColor: 'rgba(0,212,255,0.35)' }}>
                  <div style={{
                    padding: '8px 14px', borderBottom: '1px solid rgba(0,212,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(0,10,20,0.6)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Film size={14} color="var(--cyber)" />
                      <span className="font-mono-cyber" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        FEED: <span style={{ color: 'var(--cyber)' }}>{videoName}</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="cyber-tag tag-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={10} /> MONITORING
                      </span>
                      <button
                        className="cyber-tag tag-danger"
                        style={{ cursor: 'pointer', background: 'rgba(255,45,85,0.08)' }}
                        onClick={() => { setVideoUrl(''); setTimestamps([]); setDangerousFrames([]); setVideoName(''); setUploadProgress(0); }}
                      >
                        ✕ CLEAR
                      </button>
                    </div>
                  </div>
                  <VideoPlayer url={videoUrl} timestamps={timestamps} ref={videoRef} />
                </div>
              )}

              {/* Investigation Directive */}
              <div className="panel panel-corners" style={{ padding: '18px', borderColor: 'rgba(0,212,255,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Crosshair size={14} color="var(--cyber)" />
                  <p className="section-label">INVESTIGATION DIRECTIVE</p>
                </div>
                <textarea
                  className="cyber-textarea"
                  rows={4}
                  placeholder={`Enter your investigation query...\ne.g. "Detect any instances of trespassing or unauthorized access"\n     "Find moments where people appear to be in distress"`}
                  value={investigationPrompt}
                  onChange={(e) => setInvestigationPrompt(e.target.value)}
                  disabled={isActive}
                />
                <div style={{ marginTop: 12 }}>
                  <button
                    className="cyber-btn"
                    style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '12px 20px' }}
                    onClick={handleInvestigate}
                    disabled={!videoUrl || !investigationPrompt || isActive}
                  >
                    <Search size={14} />
                    {isAnalyzing ? 'SCANNING...' : 'LAUNCH INVESTIGATION'}
                  </button>
                </div>
              </div>

              {/* Progress */}
              {isActive && <AnalysisStatusCard progress={uploadProgress} />}

              {/* Timestamps */}
              {!isAnalyzing && timestamps.length > 0 && (
                <div className="panel panel-corners" style={{ borderColor: 'rgba(0,212,255,0.25)' }}>
                  <div style={{
                    padding: '12px 18px', borderBottom: '1px solid rgba(0,212,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={14} color="var(--cyber)" />
                      <span className="font-display" style={{ fontSize: 12, letterSpacing: '0.15em', color: 'var(--cyber)' }}>
                        INCIDENT TIMELINE
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {dangerCount > 0 && <span className="cyber-tag tag-danger">{dangerCount} THREAT{dangerCount > 1 ? 'S' : ''}</span>}
                      {safeCount > 0 && <span className="cyber-tag tag-safe">{safeCount} CLEAR</span>}
                    </div>
                  </div>
                  <div className="cyber-scroll" style={{ maxHeight: 320, overflowY: 'auto', padding: '12px 18px' }}>
                    {timestamps.map((ts, i) => (
                      <TimestampCard
                        key={i} ts={ts} index={i}
                        onClick={() => handleTimestampClick(ts.timestamp)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No events */}
              {videoUrl && !isAnalyzing && timestamps.length === 0 && uploadProgress === 100 && (
                <div className="panel" style={{ padding: '40px', textAlign: 'center', borderColor: 'rgba(0,255,136,0.3)' }}>
                  <div style={{
                    width: 56, height: 56, margin: '0 auto 16px',
                    background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)',
                    borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Shield size={24} color="var(--safe)" />
                  </div>
                  <p className="font-display" style={{ fontSize: 13, color: 'var(--safe)', letterSpacing: '0.12em', marginBottom: 8 }}>
                    NO MATCHES FOUND
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Rajdhani' }}>
                    The directive returned no events in this video feed.
                  </p>
                </div>
              )}
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Threat gauge */}
              {timestamps.length > 0 && (
                <div className="panel panel-corners" style={{
                  padding: '18px',
                  borderColor: dangerCount > 0 ? 'rgba(255,45,85,0.35)' : 'rgba(0,255,136,0.3)',
                }}>
                  <p className="section-label" style={{ marginBottom: 12 }}>MATCH SEVERITY</p>
                  <div style={{ position: 'relative', height: 6, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.round((dangerCount / timestamps.length) * 100)}%`,
                      background: dangerCount > 0 ? 'linear-gradient(90deg, var(--warn), var(--danger))' : 'linear-gradient(90deg, var(--safe), var(--cyber))',
                      boxShadow: `0 0 10px ${dangerCount > 0 ? 'var(--danger)' : 'var(--safe)'}`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--safe)' }}>SAFE</span>
                    <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {Math.round((dangerCount / timestamps.length) * 100)}%
                    </span>
                    <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--danger)' }}>CRITICAL</span>
                  </div>
                  {dangerCount > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      marginTop: 12, padding: '8px 10px',
                      border: '1px solid rgba(255,45,85,0.3)', borderRadius: 2,
                      animation: 'danger-flash 1s ease-in-out infinite',
                    }}>
                      <AlertTriangle size={13} color="var(--danger)" />
                      <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--danger)' }}>
                        THREATS PRESENT IN FEED
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Suspicious Frames Gallery */}
              {dangerousFrames.length > 0 && (
                <div className="panel panel-corners" style={{ padding: '18px', borderColor: 'rgba(255,45,85,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <AlertTriangle size={14} color="var(--danger)" />
                    <p className="section-label" style={{ color: 'rgba(255,45,85,0.8)' }}>FLAGGED FRAMES</p>
                    <span className="cyber-tag tag-danger">{dangerousFrames.length}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {dangerousFrames.map((frame, i) => (
                      <div key={i} className="frame-thumb" onClick={() => setSelectedFrame(frame)}>
                        <img src={frame} alt={`Flagged frame ${i + 1}`} />
                        <div className="overlay">
                          <Maximize2 size={16} color="white" />
                        </div>
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          padding: '2px 4px', background: 'rgba(255,45,85,0.6)',
                          fontFamily: 'Share Tech Mono', fontSize: 9, color: 'white', textAlign: 'center',
                        }}>
                          #{String(i+1).padStart(2,'0')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feed metadata */}
              {videoUrl && (
                <div className="panel panel-corners" style={{ padding: '18px', borderColor: 'rgba(0,212,255,0.2)' }}>
                  <p className="section-label" style={{ marginBottom: 12 }}>FEED METADATA</p>
                  {[
                    { label: 'FILENAME', value: videoName || '—', color: 'var(--text-primary)' },
                    { label: 'TIMESTAMPS', value: timestamps.length.toString(), color: 'var(--cyber)' },
                    { label: 'THREATS FOUND', value: dangerCount.toString(), color: dangerCount > 0 ? 'var(--danger)' : 'var(--safe)' },
                    { label: 'FLAGGED FRAMES', value: dangerousFrames.length.toString(), color: dangerousFrames.length > 0 ? 'var(--warn)' : 'var(--safe)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 8, marginBottom: 8,
                    }}>
                      <span className="section-label">{label}</span>
                      <span className="font-mono-cyber" style={{
                        fontSize: 12, color, maxWidth: 160, textAlign: 'right',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Instructions panel (shown before upload) */}
              {!videoUrl && (
                <div className="panel panel-corners" style={{ padding: '18px', borderColor: 'rgba(0,212,255,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Cpu size={14} color="var(--cyber)" />
                    <p className="section-label">HOW IT WORKS</p>
                  </div>
                  {[
                    { step: '01', text: 'Upload any video feed via drag-and-drop or file picker.' },
                    { step: '02', text: 'Enter a natural-language investigation directive.' },
                    { step: '03', text: 'AI scans every 3-second frame against your directive.' },
                    { step: '04', text: 'Review timestamped matches and flagged frames.' },
                  ].map(({ step, text }) => (
                    <div key={step} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <span className="font-display" style={{ fontSize: 11, color: 'var(--cyber)', flexShrink: 0, marginTop: 2 }}>{step}</span>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Rajdhani', lineHeight: 1.5 }}>{text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick actions */}
              {videoUrl && (
                <div className="panel panel-corners" style={{ padding: '18px', borderColor: 'rgba(0,212,255,0.2)' }}>
                  <p className="section-label" style={{ marginBottom: 12 }}>QUICK ACTIONS</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      className="cyber-btn"
                      style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                      onClick={() => videoRef.current?.play()}
                    >
                      <Activity size={13} /> PLAY FEED
                    </button>
                    <button
                      className="cyber-btn cyber-btn-danger"
                      style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                      onClick={() => {
                        setVideoUrl(''); setTimestamps([]); setDangerousFrames([]);
                        setVideoName(''); setUploadProgress(0); setInvestigationPrompt('');
                      }}
                    >
                      <Upload size={13} /> NEW FEED
                    </button>
                  </div>
                </div>
              )}
            </div>
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
            SENTINEL AI © 2025 // INTELLI INVESTIGATE MODULE
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              MODEL: <span style={{ color: 'var(--cyber)' }}>CLAUDE-VISION-v3</span>
            </span>
            <span className="font-mono-cyber" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              STATUS: <span style={{ color: isActive ? 'var(--warn)' : 'var(--safe)' }}>
                {isAnalyzing ? 'SCANNING' : isUploading ? 'INGESTING' : 'STANDBY'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Full-Screen Frame Modal ── */}
      {selectedFrame && (
        <div className="modal-backdrop" onClick={() => setSelectedFrame(null)}>
          <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedFrame(null)}>
              <X size={16} color="var(--danger)" />
            </button>
            <div style={{
              position: 'absolute', top: -28, left: 0,
              fontFamily: 'Share Tech Mono', fontSize: 10,
              color: 'var(--danger)', letterSpacing: '0.12em',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <AlertTriangle size={10} /> FLAGGED FRAME — THREAT DETECTED
            </div>
            <img src={selectedFrame} alt="Flagged frame full view" />
            <div style={{
              position: 'absolute', bottom: -24, right: 0,
              fontFamily: 'Share Tech Mono', fontSize: 10, color: 'var(--text-muted)',
            }}>
              CLICK OUTSIDE TO CLOSE
            </div>
          </div>
        </div>
      )}
    </>
  );
}