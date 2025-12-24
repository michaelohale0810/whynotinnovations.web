import React from "react";

interface LightbulbIconProps {
  className?: string;
  size?: number;
}

export function LightbulbIcon({ className = "", size = 36 }: LightbulbIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
    >
      {/* Da Vinci inspired geometric shape - overlapping circles and geometric patterns */}
      
      {/* Outer circle */}
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="#A855F7"
        strokeWidth="2.5"
      />
      
      {/* Inner circle */}
      <circle
        cx="50"
        cy="50"
        r="25"
        fill="none"
        stroke="#EC4899"
        strokeWidth="2"
      />
      
      {/* Square rotated 45 degrees */}
      <rect
        x="30"
        y="30"
        width="40"
        height="40"
        fill="none"
        stroke="#8B5CF6"
        strokeWidth="2"
        transform="rotate(45 50 50)"
      />
      
      {/* Diagonal lines from center */}
      <line
        x1="50"
        y1="10"
        x2="50"
        y2="90"
        stroke="#A855F7"
        strokeWidth="2"
      />
      <line
        x1="10"
        y1="50"
        x2="90"
        y2="50"
        stroke="#A855F7"
        strokeWidth="2"
      />
      <line
        x1="20"
        y1="20"
        x2="80"
        y2="80"
        stroke="#EC4899"
        strokeWidth="1.5"
      />
      <line
        x1="80"
        y1="20"
        x2="20"
        y2="80"
        stroke="#EC4899"
        strokeWidth="1.5"
      />
    </svg>
  );
}
