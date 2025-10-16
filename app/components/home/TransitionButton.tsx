'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface TransitionButtonProps {
  path: string;
  children?: React.ReactNode;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  [key: string]: any;
}

export default function TransitionButton({
  path,
  children,
  className,
  size = 'default',
  variant = 'default',
  ...props
}: TransitionButtonProps) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleTransition = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      router.push(path);
    }, 500);
  };

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={handleTransition}
      {...props}
    >
      {children}
    </Button>
  );
}
