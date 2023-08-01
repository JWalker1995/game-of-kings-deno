import React from 'react';

const showViewBox = false;

export interface ViewBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export default ({ viewBox: { minX, minY, maxX, maxY }, style, children }: {
  viewBox: ViewBox;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) => (
  <svg
    viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
    xmlns='http://www.w3.org/2000/svg'
    xmlnsXlink='http://www.w3.org/1999/xlink'
    style={style}
  >
    {children}
    {showViewBox
      ? (
        <rect
          x={minX}
          y={minY}
          width={maxX - minX}
          height={maxY - minY}
          fill='none'
          stroke='red'
          strokeWidth='2px'
          vector-effect='non-scaling-stroke'
        />
      )
      : undefined}
  </svg>
);
