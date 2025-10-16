import * as React from "react";

type Props = React.SVGProps<SVGSVGElement> & { size?: number };

export default function YandexIdIcon({ size = 24, ...props }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      {/* Брендовый красный ближе к официальному: #FC3F1D */}
      <circle cx="12" cy="12" r="12" fill="#FC3F1D" />
      {/* Глиф "Я" уменьшен и центрирован внутри круга */}
      <g transform="translate(2.4,2.4) scale(0.8)">
        <path
          fill="#fff"
          d="M12.53 2c3.83 0 6.47 2.25 6.47 5.86 0 3.3-1.98 5.25-4.72 6.22l4.96 7.92h-3.9l-4.5-7.54h-.08V22H7.96V2.44h4.57Z"
        />
      </g>
    </svg>
  );
}
