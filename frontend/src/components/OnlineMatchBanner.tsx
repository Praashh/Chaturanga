import React from 'react';
import type { SocketStatus } from '../hooks/useChaturangaSocket';

interface OnlineMatchBannerProps {
  roomId: string;
  socketStatus: SocketStatus;
  assignedColor: 'white' | 'black' | null;
  onShare: () => void;
}

export const OnlineMatchBanner: React.FC<OnlineMatchBannerProps> = ({
  roomId,
  socketStatus,
  assignedColor,
  onShare,
}) => (
  <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-md bg-[#201e1b] border border-[#2e2a24] text-xs">
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${
          socketStatus === 'connected'
            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
            : socketStatus === 'connecting'
            ? 'bg-amber-400 animate-pulse'
            : 'bg-red-400'
        }`}
      />
      <span className="text-[#8a857d] font-mono text-[11px]">Room:</span>
      <span className="font-mono font-semibold text-[#fcd34d] text-[11px]">
        {roomId}
      </span>
    </div>

    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#b5b0a8] font-medium">
        {assignedColor
          ? `Playing as ${assignedColor === 'white' ? 'White ♔' : 'Black ♚'}`
          : 'Connecting...'}
      </span>
      <button
        onClick={onShare}
        className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#2a2620] hover:bg-[#38332b] text-[10px] text-[#d4af37] border border-[#d4af37]/30 transition-colors cursor-pointer"
        title="Copy game room invite link"
      >
        <span>Invite</span>
      </button>
    </div>
  </div>
);
