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
  const isWhite = color === 'white';

  if (activeTheme === 'standard') {
    const code = `${isWhite ? 'w' : 'b'}${PIECE_CODE_MAP[type] ?? 'P'}`;
    const dimensionStyle =
      typeof size === 'number'
        ? { width: `${size}px`, height: `${size}px` }
        : typeof size === 'string'
          ? { width: size, height: size }
          : { width: '88%', height: '88%' };

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
  }

  // Ancient Vedic theme (Original Chaturanga pieces)
  const fill = isWhite ? '#ffffff' : '#111111';
  const stroke = isWhite ? '#1c1917' : 'none';
  const strokeWidth = isWhite ? '2.5' : '0';
  const detailColor = isWhite ? '#1c1917' : '#ffffff';
  const goldAccent = '#f59e0b';

  const shapeProps = {
    fill,
    stroke,
    strokeWidth,
    detailColor,
    goldAccent,
    isWhite,
  };

  const renderVedicShape = () => {
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
    }
  };

  return (
    <svg
      viewBox="0 0 100 100"
      width={size ?? '82%'}
      height={size ?? '82%'}
      className={`select-none pointer-events-none transition-transform duration-200 ${
        fallen ? 'rotate-90 translate-x-2' : ''
      } ${className}`}
    >
      {renderVedicShape()}
    </svg>
  );
};
