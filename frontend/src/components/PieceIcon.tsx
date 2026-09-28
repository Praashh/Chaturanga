import React from 'react';
import type { PieceType, PieceColor } from '../types/game';
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
}

export const PieceIcon: React.FC<PieceIconProps> = ({
  type,
  color,
  className = '',
  size,
  fallen = false,
}) => {
  const isWhite = color === 'white';

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

  const renderShape = () => {
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
      {renderShape()}
    </svg>
  );
};
