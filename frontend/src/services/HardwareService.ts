/**
 * ESC/POS commands
 */
const ESC = 0x1B;
const GS = 0x1D;

export class HardwareService {
  private port: any | null = null;
  
  // Singleton pattern for the service
  private static instance: HardwareService;

  private constructor() {}

  static getInstance() {
    if (!HardwareService.instance) {
      HardwareService.instance = new HardwareService();
    }
    return HardwareService.instance;
  }

  /**
   * Check if Web Serial is supported by the browser
   */
  isSerialSupported(): boolean {
    return 'serial' in navigator;
  }

  /**
   * Request a Web Serial port from the user
   */
  async connectSerialPrinter(): Promise<boolean> {
    if (!this.isSerialSupported()) {
      throw new Error("Web Serial API is not supported in this browser. Please use Chrome or Edge.");
    }

    try {
      // @ts-ignore
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 9600 }); // 9600 is standard, some might need 115200
      return true;
    } catch (err) {
      console.error("Failed to connect to printer", err);
      return false;
    }
  }

  /**
   * Disconnect the serial port
   */
  async disconnectSerialPrinter() {
    if (this.port) {
      try {
        await this.port.close();
        this.port = null;
      } catch (err) {
        console.error("Failed to close port", err);
      }
    }
  }

  /**
   * Write raw bytes to the printer
   */
  private async writeBytes(data: Uint8Array) {
    if (!this.port || !this.port.writable) {
      throw new Error("Printer not connected or not writable");
    }
    
    const writer = this.port.writable.getWriter();
    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
    }
  }

  /**
   * Kicks the cash drawer via ESC/POS
   */
  async openCashDrawer() {
    if (this.port) {
      // ESC p m t1 t2
      // m = 0 (drawer 1), t1 = 25, t2 = 250
      const kickCommand = new Uint8Array([ESC, 0x70, 0x00, 0x19, 0xFA]);
      await this.writeBytes(kickCommand);
    } else {
      console.warn("Cannot kick drawer: No serial printer connected");
    }
  }

  /**
   * Print a test receipt via Web Serial
   */
  async printTestReceipt() {
    if (!this.port) throw new Error("No serial printer connected");

    // Basic ESC/POS byte generator
    const encoder = new TextEncoder();
    const cmd = {
      init: [ESC, 0x40],
      alignCenter: [ESC, 0x61, 0x01],
      alignLeft: [ESC, 0x61, 0x00],
      boldOn: [ESC, 0x45, 0x01],
      boldOff: [ESC, 0x45, 0x00],
      cut: [GS, 0x56, 0x41, 0x00], // partial cut
    };

    let payload: number[] = [];
    payload.push(...cmd.init);
    
    // Header
    payload.push(...cmd.alignCenter);
    payload.push(...cmd.boldOn);
    payload.push(...encoder.encode("VENDOR MIND RETAIL\n"));
    payload.push(...cmd.boldOff);
    payload.push(...encoder.encode("Hardware Test Receipt\n"));
    payload.push(...encoder.encode("--------------------------------\n\n"));
    
    // Body
    payload.push(...cmd.alignLeft);
    payload.push(...encoder.encode("Connection: Web Serial API\n"));
    payload.push(...encoder.encode("Status: SUCCESS\n\n"));
    payload.push(...encoder.encode("Thank you for using Vendor Mind!\n\n\n\n\n"));
    
    // Cut
    payload.push(...cmd.cut);

    await this.writeBytes(new Uint8Array(payload));
  }
}

export const hardwareService = HardwareService.getInstance();
