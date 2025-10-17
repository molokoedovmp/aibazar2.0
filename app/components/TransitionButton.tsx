'use client';

import { useRouter } from 'next/navigation';
import { useState, type ComponentProps } from 'react';
import { Button } from '@/components/ui/button';

interface TransitionButtonProps extends ComponentProps<typeof Button> {
  path: string;
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
