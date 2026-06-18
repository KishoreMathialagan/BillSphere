import { useEffect, useRef } from 'react';

interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void;
  enabled?: boolean;
}

/**
 * Hook to capture input from HID barcode scanners.
 * Scanners act like keyboards that type very fast and press Enter.
 */
export function useBarcodeScanner({ onScan, enabled = true }: UseBarcodeScannerProps) {
  const buffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);
  
  // Scanners typically type faster than 30ms per character.
  // We use 50ms as a safe threshold.
  const TIME_THRESHOLD_MS = 50;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const currentTime = new Date().getTime();

      // If the time between this key and the last key is too long, clear buffer
      // because it's probably normal human typing
      if (currentTime - lastKeyTime.current > TIME_THRESHOLD_MS) {
        buffer.current = '';
      }

      lastKeyTime.current = currentTime;

      // Handle Enter key (scanners suffix scans with Enter)
      if (e.key === 'Enter') {
        if (buffer.current.length > 2) {
          // Valid scan detected
          onScan(buffer.current);
          buffer.current = '';
          e.preventDefault();
        }
        return;
      }

      // Ignore modifiers and non-character keys
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        buffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, enabled]);
}
