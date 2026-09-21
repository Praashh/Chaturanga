import React from 'react';
import type { PieceType, PieceColor } from '../types/game';

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

  // White pieces: clean pure white fill, crisp 2px dark border
  // Black pieces: solid pitch-black silhouette, NO white outline, subtle internal white details
  const fill = isWhite ? '#ffffff' : '#111111';
  const stroke = isWhite ? '#1c1917' : 'none';
  const strokeWidth = isWhite ? '2.5' : '0';
  const detailColor = isWhite ? '#1c1917' : '#ffffff';
  const goldAccent = '#f59e0b';

  const renderShape = () => {
    switch (type) {
      case 'ratha':
        // Chariot Wheel (Chakra)
        return (
          <g transform="translate(50, 50)">
            {/* Outer tire */}
            <circle
              cx="0"
              cy="0"
              r="38"
              fill={fill}
              stroke={isWhite ? stroke : 'none'}
              strokeWidth={strokeWidth}
            />
            {/* Inner rim track */}
            <circle
              cx="0"
              cy="0"
              r="29"
              fill="none"
              stroke={detailColor}
              strokeWidth="2.5"
            />
            {/* 8 Radial Spokes */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
              <line
                key={angle}
                x1="0"
                y1="0"
                x2="29"
                y2="0"
                transform={`rotate(${angle})`}
                stroke={detailColor}
                strokeWidth="3"
                strokeLinecap="round"
              />
            ))}
            {/* Outer Rim Studs */}
            {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(angle => (
              <circle
                key={angle}
                cx="33.5"
                cy="0"
                r="1.8"
                transform={`rotate(${angle})`}
                fill={detailColor}
              />
            ))}
            {/* Center Hub */}
            <circle
              cx="0"
              cy="0"
              r="9.5"
              fill={fill}
              stroke={detailColor}
              strokeWidth="2.5"
            />
            <circle
              cx="0"
              cy="0"
              r="3.5"
              fill={isWhite ? goldAccent : '#ffffff'}
            />
          </g>
        );

      case 'gaja':
        // Modern side-profile Elephant
        return (
          <g>
            <path
              d="M 23 80 
                 L 23 64 
                 Q 23 43 40 37 
                 Q 52 33 68 35 
                 Q 78 39 82 49 
                 Q 85 57 83 69 
                 Q 81 79 75 77 
                 Q 72 75 75 69 
                 Q 77 61 74 53 
                 Q 71 47 64 47 
                 L 64 80 
                 L 52 80 
                 L 52 64 
                 L 36 64 
                 L 36 80 
                 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Tusk */}
            <path
              d="M 72 57 Q 80 57 86 51 Q 80 54 70 53 Z"
              fill="#ffffff"
              stroke={isWhite ? '#1c1917' : 'none'}
              strokeWidth={isWhite ? '1.5' : '0'}
            />
            {/* Eye */}
            <circle
              cx="64"
              cy="43"
              r="2.5"
              fill={isWhite ? '#1c1917' : '#ffffff'}
            />
            {/* Ear line */}
            <path
              d="M 53 41 Q 47 49 51 57"
              fill="none"
              stroke={detailColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        );

      case 'ashva':
        // Classical Staunton Knight / Ashva in harmony with Chaturanga set
        return (
          <g>
            {/* Pedestal Base matching Raja, Mantri, Padati */}
            <path
              d="M 24 82 L 76 82 L 72 74 L 28 74 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Horse Head & Arched Neck - Complete closed solid path */}
            <path
              d="M 28 74 
                 C 35 73, 40 67, 41 60 
                 C 42 54, 38 50, 34 47 
                 C 31 49, 28 51, 25 51 
                 C 21 51, 19 48, 20 45 
                 C 21 41, 25 37, 30 33 
                 C 37 28, 43 21, 47 16 
                 L 50 10 
                 L 54 15 
                 L 57 11 
                 L 59 16 
                 C 65 21, 68 28, 69 36 
                 C 70 45, 71 55, 71 65 
                 C 71 69, 72 72, 72 74 
                 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Eye */}
            <circle
              cx="41"
              cy="28"
              r="2.5"
              fill={isWhite ? '#1c1917' : '#ffffff'}
            />
            {/* Nostril */}
            <ellipse
              cx="25"
              cy="44"
              rx="1.5"
              ry="1"
              fill={isWhite ? '#1c1917' : '#ffffff'}
            />
            {/* Mouth slit */}
            <path
              d="M 21 46 Q 25 47 28 45"
              fill="none"
              stroke={detailColor}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Jaw / cheek muscle contour */}
            <path
              d="M 33 46 Q 39 42 43 34"
              fill="none"
              stroke={detailColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Mane crest accents */}
            <path
              d="M 64 26 Q 59 29 57 35"
              fill="none"
              stroke={detailColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 67 39 Q 61 42 59 48"
              fill="none"
              stroke={detailColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 69 52 Q 63 55 61 61"
              fill="none"
              stroke={detailColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        );

      case 'mantri':
        // Vizier / Counselor
        return (
          <g>
            {/* Base */}
            <path
              d="M 24 82 L 76 82 L 72 74 L 28 74 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Stem */}
            <path
              d="M 32 74 Q 38 52 42 46 L 58 46 Q 62 52 68 74 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Collar */}
            <ellipse
              cx="50"
              cy="46"
              rx="16"
              ry="4"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            {/* Domed Turban */}
            <path
              d="M 38 44 Q 34 32 50 20 Q 66 32 62 44 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Turban Finial */}
            <circle
              cx="50"
              cy="16"
              r="3.5"
              fill={goldAccent}
            />
            {/* Center line */}
            <line
              x1="50"
              y1="48"
              x2="50"
              y2="72"
              stroke={detailColor}
              strokeWidth="2"
            />
          </g>
        );

      case 'raja':
        // King with 5-point crown
        return (
          <g>
            {/* Base */}
            <path
              d="M 22 82 L 78 82 L 74 72 L 26 72 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Body */}
            <path
              d="M 30 72 Q 36 50 40 44 L 60 44 Q 64 50 70 72 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Collar */}
            <ellipse
              cx="50"
              cy="44"
              rx="18"
              ry="4"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            {/* 5-point Crown */}
            <path
              d="M 32 42 L 30 26 L 40 32 L 50 22 L 60 32 L 70 26 L 68 42 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Gold Coronet / Cross on top */}
            <path
              d="M 50 13 L 50 22 M 46 17 L 54 17"
              stroke={goldAccent}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Gold Crown Band */}
            <rect
              x="34"
              y="38"
              width="32"
              height="3.5"
              fill={goldAccent}
              rx="1.5"
            />
          </g>
        );

      case 'padati':
        // Clean solid classical Pawn
        return (
          <g>
            {/* Base */}
            <path
              d="M 26 82 L 74 82 L 70 74 L 30 74 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Stem */}
            <path
              d="M 34 74 Q 40 54 44 48 L 56 48 Q 60 54 66 74 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Collar ring */}
            <ellipse
              cx="50"
              cy="48"
              rx="14"
              ry="3.5"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            {/* Spherical Head */}
            <circle
              cx="50"
              cy="34"
              r="14"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </g>
        );
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
