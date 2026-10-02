import React from 'react';
import type { PieceType, PieceColor } from '../types/game';
import { usePieceTheme, type PieceTheme } from '../context/PieceThemeContext';
import {
  RathaShape,
  GajaShape,
  AshvaShape,
  MantriShape,
  RajaShape,
  PadatiShape,
} from './piece-shapes';

interface PieceIconProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
  size?: number | string;
  fallen?: boolean;
  theme?: PieceTheme;
}

const PIECE_CODE_MAP: Record<PieceType, string> = {
  raja: 'K',
  mantri: 'Q',
  ratha: 'R',
  gaja: 'B',
  ashva: 'N',
  padati: 'P',
};

const getDimensionStyle = (size?: number | string): React.CSSProperties => {
  if (typeof size === 'number') {
    return { width: `${size}px`, height: `${size}px` };
  }
  if (typeof size === 'string') {
    return { width: size, height: size };
  }
  return { width: '88%', height: '88%' };
};

interface SubPieceIconProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
  size?: number | string;
  fallen?: boolean;
}

const StandardPieceIcon: React.FC<SubPieceIconProps> = ({
  type,
  color,
  className = '',
  size,
  fallen = false,
}) => {
  const isWhite = color === 'white';
  const code = `${isWhite ? 'w' : 'b'}${PIECE_CODE_MAP[type] ?? 'P'}`;
  const dimensionStyle = getDimensionStyle(size);

  return (
    <img
      src={`/pieces/${code}.svg`}
      alt={`${color} ${type}`}
      draggable={false}
      className={`select-none pointer-events-none transition-transform duration-200 drop-shadow-sm ${
        fallen ? 'rotate-90 translate-x-2' : ''
      } ${className}`}
      style={{
        ...dimensionStyle,
        objectFit: 'contain',
      }}
    />
  );
};

const VedicPieceShape: React.FC<{ type: PieceType; isWhite: boolean }> = ({
  type,
  isWhite,
}) => {
  const shapeProps = {
    fill: isWhite ? '#ffffff' : '#111111',
    stroke: isWhite ? '#1c1917' : 'none',
    strokeWidth: isWhite ? '2.5' : '0',
    detailColor: isWhite ? '#1c1917' : '#ffffff',
    goldAccent: '#f59e0b',
    isWhite,
  };

  switch (type) {
    case 'ratha':
      return <RathaShape {...shapeProps} />;
    case 'gaja':
      return <GajaShape {...shapeProps} />;
    case 'ashva':
      return <AshvaShape {...shapeProps} />;
    case 'mantri':
      return <MantriShape {...shapeProps} />;
    case 'raja':
      return <RajaShape {...shapeProps} />;
    case 'padati':
      return <PadatiShape {...shapeProps} />;
    default:
      return null;
  }
};

const VedicPieceIcon: React.FC<SubPieceIconProps> = ({
  type,
  color,
  className = '',
  size,
  fallen = false,
}) => {
  const isWhite = color === 'white';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size ?? '82%'}
      height={size ?? '82%'}
      className={`select-none pointer-events-none transition-transform duration-200 ${
        fallen ? 'rotate-90 translate-x-2' : ''
      } ${className}`}
    >
      <VedicPieceShape type={type} isWhite={isWhite} />
    </svg>
  );
};

export const PieceIcon: React.FC<PieceIconProps> = ({
  type,
  color,
  className = '',
  size,
  fallen = false,
  theme: propTheme,
}) => {
  const { pieceTheme: contextTheme } = usePieceTheme();
  const activeTheme = propTheme ?? contextTheme;

  if (activeTheme === 'standard') {
    return (
      <StandardPieceIcon
        type={type}
        color={color}
        className={className}
        size={size}
        fallen={fallen}
      />
    );
  }

  return (
    <VedicPieceIcon
      type={type}
      color={color}
      className={className}
      size={size}
      fallen={fallen}
    />
  );
};

