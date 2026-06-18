import React, { useState } from 'react';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { hardwareService } from '../../services/HardwareService';

const HardwareSettings: React.FC = () => {
  const [lastScanned, setLastScanned] = useState<string>('');
  const [serialConnected, setSerialConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Hook for testing the barcode scanner
  useBarcodeScanner({
    onScan: (barcode) => {
      setLastScanned(barcode);
    },
    enabled: true
  });

  const handleConnectSerial = async () => {
    try {
      setError(null);
      const success = await hardwareService.connectSerialPrinter();
      setSerialConnected(success);
    } catch (err: any) {
      setError(err.message || "Failed to connect to serial port");
    }
  };

  const handleDisconnectSerial = async () => {
    await hardwareService.disconnectSerialPrinter();
    setSerialConnected(false);
  };

  const handleTestPrint = async () => {
    try {
      setError(null);
      await hardwareService.printTestReceipt();
    } catch (err: any) {
      setError(err.message || "Failed to print");
    }
  };

  const handlePopDrawer = async () => {
    try {
      setError(null);
      await hardwareService.openCashDrawer();
    } catch (err: any) {
      setError(err.message || "Failed to open cash drawer");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div>
        <h2 style={{ margin: 0, color: 'var(--text-h)' }}>Hardware & Devices</h2>
        <p style={{ opacity: 0.7, margin: '8px 0 0' }}>Configure connected peripherals like scanners and receipt printers.</p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f87171' }}>
          {error}
        </div>
      )}

      {/* Barcode Scanner Section */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', color: 'var(--text-h)' }}>Barcode Scanner (HID)</h3>
        <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '16px' }}>
          Most USB and Bluetooth scanners act as keyboards. Focus anywhere on the screen and scan a barcode to test it.
        </p>
        <div style={{
          background: 'var(--code-bg)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px dashed var(--border)',
          fontFamily: 'var(--mono)',
          minHeight: '24px',
          display: 'flex',
          alignItems: 'center',
          color: lastScanned ? 'var(--text-h)' : 'var(--text-muted)'
        }}>
          {lastScanned ? `Last scanned: ${lastScanned}` : 'Waiting for scan...'}
        </div>
      </div>

      {/* ESC/POS Thermal Printer Section */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', color: 'var(--text-h)' }}>Thermal Printer & Cash Drawer</h3>
        <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '16px' }}>
          Connect directly to a USB/Serial ESC/POS thermal printer. This is required for directly popping the cash drawer.
          <br/><em>Note: Web Serial API is supported on Chrome and Edge.</em>
        </p>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {!serialConnected ? (
            <button
              onClick={handleConnectSerial}
              style={{
                padding: '10px 16px',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Connect Serial Printer
            </button>
          ) : (
            <button
              onClick={handleDisconnectSerial}
              style={{
                padding: '10px 16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Disconnect Printer
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: serialConnected ? '#10b981' : '#ef4444'
            }}></div>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              {serialConnected ? 'Connected via Web Serial' : 'Disconnected'}
            </span>
          </div>
        </div>

        {serialConnected && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={handleTestPrint}
              style={{
                padding: '8px 16px',
                background: 'var(--code-bg)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Print Test Receipt
            </button>
            <button
              onClick={handlePopDrawer}
              style={{
                padding: '8px 16px',
                background: 'var(--code-bg)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Pop Cash Drawer
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default HardwareSettings;
