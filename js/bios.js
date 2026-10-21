class BiosEngine {
  constructor() {
    this.storageKey = 'win98_bios_settings';
    this.postScreen = null;
    this.setupScreen = null;
    this.activeSubmenu = null;
    this.mainMenuIndex = 0;
    this.submenuRowIndex = 0;
    this.currentModal = null;
    this.modalHandlers = {};
    this.postAborted = false;
    this.postRunning = false;
    this.bootFailed = false;
    this.postTimer = null;
    this.clockTimer = null;
    this.failedPasswords = 0;
    this.accessLevel = 'supervisor';
    this.onPostFinishedCallback = null;
    this.chipsetId = '04/12/1999-i440BX-W977-2A69KB0EC-00';

    this.defaultSettings = {
      standard: {
        priMaster: { type: 'Auto' },
        priSlave: { type: 'None' },
        secMaster: { type: 'CD-ROM' },
        secSlave: { type: 'None' },
        floppyA: '1.44M, 3.5 in.',
        floppyB: 'None',
        video: 'EGA/VGA',
        haltOn: 'All Errors'
      },
      features: {
        virusWarning: 'Disabled',
        cpuInternalCache: 'Enabled',
        externalCache: 'Enabled',
        quickPost: 'Enabled',
        bootSequence: 'A, C, SCSI',
        swapFloppy: 'Disabled',
        bootUpFloppySeek: 'Enabled',
        bootUpNumLock: 'On',
        typematicRateSetting: 'Disabled',
        typematicRate: '30',
        typematicDelay: '250',
        securityOption: 'Setup',
        pciPaletteSnoop: 'Disabled',
        osSelectForOs2: 'Non-OS2',
        videoBiosShadow: 'Enabled',
        c8000Shadow: 'Disabled'
      },
      chipset: {
        sdramConfig: 'By SPD',
        sdramCasLatency: '2',
        sdramRasToCas: '2',
        sdramRasPrecharge: '2',
        dramIntegrity: 'Non-ECC',
        agpApertureSize: '64M',
        agp2xMode: 'Enabled',
        cpuHostClock: '100 MHz',
        cpuMultiplier: '4.5x',
        cpuVoltage: 'Auto'
      },
      power: {
        powerManagement: 'User Define',
        pmControlApm: 'Yes',
        videoOffMethod: 'DPMS Support',
        videoOffAfter: 'Standby',
        dozeMode: 'Disabled',
        standbyMode: '20 Min',
        suspendMode: 'Disabled',
        hddPowerDown: 'Disabled',
        softOffPwrBtn: 'Instant-Off'
      },
      pnpPci: {
        pnpOsInstalled: 'Yes',
        resourcesControlledBy: 'Auto(ESCD)',
        resetConfigData: 'Disabled',
        assignIrqVga: 'Enabled',
        assignIrqUsb: 'Enabled',
        pciLatencyTimer: '32'
      },
      peripherals: {
        onChipPrimaryIde: 'Enabled',
        onChipSecondaryIde: 'Enabled',
        idePriMasterPio: 'Auto',
        idePriMasterUdma: 'Auto',
        usbController: 'Enabled',
        usbKeyboardSupport: 'Enabled',
        onboardFdc: 'Enabled',
        serialPort1: '3F8/IRQ4',
        serialPort2: '2F8/IRQ3',
        parallelPort: '378/IRQ7',
        parallelPortMode: 'ECP+EPP',
        onboardAudio: 'Enabled'
      },
      security: {
        supervisorPassword: '',
        userPassword: ''
      },
      meta: {
        colorTheme: 'theme-blue'
      }
    };

    this.failSafeOverrides = {
      features: { quickPost: 'Disabled', externalCache: 'Disabled', videoBiosShadow: 'Disabled' },
      chipset: { sdramConfig: 'User Define', sdramCasLatency: '3', sdramRasToCas: '3', sdramRasPrecharge: '3', agp2xMode: 'Disabled' },
      peripherals: { idePriMasterPio: 'Mode 0', idePriMasterUdma: 'Disabled' }
    };

    this.featurePages = ['features', 'chipset', 'power', 'pnpPci', 'peripherals'];
    this.settingsPages = ['standard', ...this.featurePages, 'security', 'meta'];

    this.settings = this.loadSettings();
    this.initOptionsSchema();
  }

  clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  readStoredSettings() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return this.deepMerge(this.clone(this.defaultSettings), JSON.parse(raw));
    } catch (e) {
      console.warn('Failed to parse BIOS settings from storage, using defaults', e);
    }
    return this.clone(this.defaultSettings);
  }

  loadSettings() {
    return this.readStoredSettings();
  }

  saveSettings() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
      return true;
    } catch (e) {
      console.error('Failed to save BIOS settings to storage', e);
      return false;
    }
  }

  deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      const incoming = source[key];
      const isBranch = incoming && typeof incoming === 'object' && !Array.isArray(incoming);
      if (isBranch && target[key] && typeof target[key] === 'object') {
        this.deepMerge(target[key], incoming);
      } else {
        target[key] = incoming;
      }
    }
    return target;
  }

  buildDefaults(kind) {
    const defaults = this.clone(this.defaultSettings);
    if (kind === 'BIOS') this.deepMerge(defaults, this.clone(this.failSafeOverrides));
    return defaults;
  }

  applyDefaults(kind, page = null) {
    const defaults = this.buildDefaults(kind);
    const pages = page ? [page] : this.featurePages;
    pages.forEach(p => { this.settings[p] = defaults[p]; });
  }

  restorePageFromCmos(page) {
    this.settings[page] = this.readStoredSettings()[page];
  }

  countUnsavedChanges() {
    const stored = this.readStoredSettings();
    const countDiff = (a, b) => {
      if (a && typeof a === 'object') {
        return Object.keys(a).reduce((sum, key) => sum + countDiff(a[key], b ? b[key] : undefined), 0);
      }
      return a === b ? 0 : 1;
    };
    return this.settingsPages.reduce((sum, page) => sum + countDiff(this.settings[page], stored[page]), 0);
  }

  getEffectiveCpuSpecs() {
    const fsb = parseInt(this.settings.chipset.cpuHostClock, 10) || 100;
    const mult = parseFloat(this.settings.chipset.cpuMultiplier) || 4.5;
    const exactFsb = fsb === 66 ? 66.6667 : (fsb === 133 ? 133.3334 : fsb);
    const freq = Math.round(exactFsb * mult);
    const pciClock = Math.round(fsb === 66 ? exactFsb / 2 : exactFsb / 3);

    let name = 'GenuineIntel Pentium(R) II Processor';
    if (fsb < 100) {
      name = 'Intel Celeron(R) Processor';
    } else if (freq >= 600) {
      name = 'Intel Pentium(R) III Processor';
    } else if (fsb > 100) {
      name = 'GenuineIntel Pentium(R) II (Overclocked)';
    }

    return {
      fsb,
      multiplier: mult,
      frequency: freq,
      pciClock,
      name,
      fullTitle: `${name} ${freq}MHz`,
      ramMb: 128,
      ramKb: 131072,
      baseKb: 640,
      extKb: 130048,
      sysKb: 384
    };
  }

  isAudioEnabled() {
    return this.settings.peripherals.onboardAudio === 'Enabled';
  }

  isChannelEnabled(channelKey) {
    return this.settings.peripherals[this.driveChannels[channelKey].ide] === 'Enabled';
  }

  getDrive(channelKey) {
    const channel = this.driveChannels[channelKey];
    const type = this.settings.standard[channelKey].type;
    const present = type !== 'None';
    return { type, present, detected: present && this.isChannelEnabled(channelKey), ...channel.model };
  }

  hasBootableHdd() {
    return ['priMaster', 'priSlave'].some(key => this.getDrive(key).detected);
  }

  hasCdrom() {
    return this.getDrive('secMaster').detected;
  }

  hasFloppy() {
    return this.settings.standard.floppyA !== 'None' && this.settings.peripherals.onboardFdc === 'Enabled';
  }

  resolveBootDevice() {
    const order = this.settings.features.bootSequence.split(',').map(part => part.trim());
    const attempts = [];
    for (const device of order) {
      if (device === 'C' && this.hasBootableHdd()) return { device: 'C', attempts };
      if (device === 'CDROM' && this.hasCdrom()) attempts.push('Boot from ATAPI CD-ROM : Failure ...');
    }
    return { device: null, attempts };
  }

  getPasswordAccess(entered) {
    const { supervisorPassword, userPassword } = this.settings.security;
    if (supervisorPassword && entered === supervisorPassword) return 'supervisor';
    if (userPassword && entered === userPassword) return supervisorPassword ? 'user' : 'supervisor';
    return null;
  }

  hasAnyPassword() {
    return Boolean(this.settings.security.supervisorPassword || this.settings.security.userPassword);
  }

  initOptionsSchema() {
    const hdd = (name, size, cyl, landz) => ({ name, size, cyl, head: 16, precomp: 0, landz, sector: 63, mode: 'LBA' });
    const atapi = (name) => ({ name, size: 0, cyl: 0, head: 0, precomp: 0, landz: 0, sector: 0, mode: '' });

    this.driveChannels = {
      priMaster: { ide: 'onChipPrimaryIde', model: hdd('QUANTUM FIREBALL CR 8.4A', 8449, 16383, 16382) },
      priSlave: { ide: 'onChipPrimaryIde', model: hdd('WDC AC310200R', 10263, 19885, 19884) },
      secMaster: { ide: 'onChipSecondaryIde', model: atapi('SONY CD-ROM CRX140E') },
      secSlave: { ide: 'onChipSecondaryIde', model: atapi('IOMEGA ZIP 100 ATAPI') }
    };

    const clockText = (date) => `${date.getHours()} : ${String(date.getMinutes()).padStart(2, '0')} : ${String(date.getSeconds()).padStart(2, '0')}`;
    const dateText = (date) => `${date.getMonth() + 1} / ${date.getDate()} / ${date.getFullYear()}`;
    const whenEnabled = (page, key) => ({ page, key, equals: 'Enabled' });

    this.pageTitles = {
      standard: 'STANDARD CMOS SETUP',
      features: 'BIOS FEATURES SETUP',
      chipset: 'CHIPSET FEATURES SETUP',
      power: 'POWER MANAGEMENT SETUP',
      pnpPci: 'PNP/PCI CONFIGURATION',
      peripherals: 'INTEGRATED PERIPHERALS'
    };

    this.mainMenu = {
      left: [
        { id: 'standard', label: 'STANDARD CMOS SETUP', desc: 'Time, date, hard disk type, floppy drives, video' },
        { id: 'features', label: 'BIOS FEATURES SETUP', desc: 'Boot sequence, caches, keyboard and security option' },
        { id: 'chipset', label: 'CHIPSET FEATURES SETUP', desc: 'FSB clock, CPU multiplier, SDRAM and AGP timing' },
        { id: 'power', label: 'POWER MANAGEMENT SETUP', desc: 'Doze, standby, suspend and monitor power saving' },
        { id: 'pnpPci', label: 'PNP/PCI CONFIGURATION', desc: 'Plug and Play and PCI interrupt assignment' },
        { id: 'peripherals', label: 'INTEGRATED PERIPHERALS', desc: 'IDE channels, USB, COM/LPT ports and onboard audio' }
      ],
      right: [
        { id: 'loadBiosDefaults', label: 'LOAD BIOS DEFAULTS', desc: 'Fail-safe values: slowest timings, most stable' },
        { id: 'loadSetupDefaults', label: 'LOAD SETUP DEFAULTS', desc: 'Optimal values for this board. Passwords are kept' },
        { id: 'supervisorPass', label: 'SUPERVISOR PASSWORD', desc: 'Full access to Setup. Enter an empty value to clear it' },
        { id: 'userPass', label: 'USER PASSWORD', desc: 'Boot access and limited Setup access. Empty value clears it' },
        { id: 'hddAutoDetect', label: 'IDE HDD AUTO DETECTION', desc: 'List the drives found on both IDE channels' },
        { id: 'saveAndExit', label: 'SAVE & EXIT SETUP', desc: 'Write changes to CMOS and restart' },
        { id: 'exitNoSave', label: 'EXIT WITHOUT SAVING', desc: 'Discard changes and restart' }
      ]
    };
    this.mainMenuItems = [...this.mainMenu.left, ...this.mainMenu.right];
    this.userLevelItems = ['userPass', 'saveAndExit', 'exitNoSave'];

    this.schemas = {
      standard: [
        { key: 'date', label: 'Date (mm:dd:yy)', readOnly: true, read: () => dateText(new Date()), desc: 'Battery-backed calendar. Follows the host computer clock' },
        { key: 'time', label: 'Time (hh:mm:ss)', readOnly: true, read: () => clockText(new Date()), desc: 'Battery-backed clock. Follows the host computer clock' },
        { key: 'priMaster', field: 'type', drive: true, label: 'Primary Master', options: ['Auto', 'User', 'None'], desc: 'Drive C:. With None and no Primary Slave, Win 98 cannot boot' },
        { key: 'priSlave', field: 'type', drive: true, label: 'Primary Slave', options: ['None', 'Auto', 'User'], desc: 'Second hard disk on IDE channel 0' },
        { key: 'secMaster', field: 'type', drive: true, label: 'Secondary Master', options: ['CD-ROM', 'None'], desc: 'ATAPI CD-ROM drive on IDE channel 1' },
        { key: 'secSlave', field: 'type', drive: true, label: 'Secondary Slave', options: ['None', 'Auto'], desc: 'ATAPI removable drive on IDE channel 1' },
        { key: 'floppyA', label: 'Drive A', options: ['1.44M, 3.5 in.', '1.2M, 5.25 in.', '720K, 3.5 in.', '2.88M, 3.5 in.', 'None'], desc: 'Floppy drive A: format. None skips the floppy seek at boot' },
        { key: 'floppyB', label: 'Drive B', options: ['None', '1.44M, 3.5 in.', '1.2M, 5.25 in.'], desc: 'Floppy drive B: format' },
        { key: 'video', label: 'Video', options: ['EGA/VGA', 'CGA 40', 'CGA 80', 'MONO'], desc: 'Primary display adapter type' },
        { key: 'haltOn', label: 'Halt On', options: ['All Errors', 'No Errors', 'All , But Keyboard', 'All , But Disk', 'All , But Disk/Key'], desc: 'Which POST errors stop the boot' }
      ],
      features: [
        { key: 'virusWarning', label: 'Virus Warning', options: ['Disabled', 'Enabled'], desc: 'Enables real-time boot sector anti-virus guard' },
        { key: 'cpuInternalCache', label: 'CPU Internal Cache', options: ['Enabled', 'Disabled'], desc: 'Enables CPU L1 primary instruction and data cache' },
        { key: 'externalCache', label: 'External Cache', options: ['Enabled', 'Disabled'], desc: 'Enables motherboard L2 cache pipeline burst SRAM' },
        { key: 'quickPost', label: 'Quick Power On Self Test', options: ['Enabled', 'Disabled'], desc: 'Skips extended repetitive DRAM diagnostic cycles for faster boot' },
        { key: 'bootSequence', label: 'Boot Sequence', options: ['A, C, SCSI', 'C, A, SCSI', 'CDROM, C, A', 'C Only', 'A, CDROM, C'], desc: 'Order of devices searched for a bootable system. Win 98 is on C:' },
        { key: 'swapFloppy', label: 'Swap Floppy Drive', options: ['Disabled', 'Enabled'], desc: 'Swaps logical drive assignment between Drive A: and Drive B:' },
        { key: 'bootUpFloppySeek', label: 'Boot Up Floppy Seek', options: ['Enabled', 'Disabled'], desc: 'Seeks the floppy drive heads during POST' },
        { key: 'bootUpNumLock', label: 'Boot Up NumLock Status', options: ['On', 'Off'], desc: 'Selects the initial power-on state of keyboard NumLock LED' },
        { key: 'typematicRateSetting', label: 'Typematic Rate Setting', options: ['Disabled', 'Enabled'], desc: 'Enables custom keyboard keystroke repeat speed programming' },
        { key: 'typematicRate', label: 'Typematic Rate (Chars/Sec)', options: ['6', '8', '10', '12', '15', '20', '24', '30'], requires: whenEnabled('features', 'typematicRateSetting'), desc: 'Number of keystrokes per second when key is held down' },
        { key: 'typematicDelay', label: 'Typematic Delay (Msec)', options: ['250', '500', '750', '1000'], requires: whenEnabled('features', 'typematicRateSetting'), desc: 'Initial delay in milliseconds before key repeat triggers' },
        { key: 'securityOption', label: 'Security Option', options: ['Setup', 'System'], desc: 'Setup: password asked to enter Setup. System: password asked on every boot' },
        { key: 'pciPaletteSnoop', label: 'PCI/VGA Palette Snoop', options: ['Disabled', 'Enabled'], desc: 'Allows MPEG/3D accelerator cards to snoop standard VGA palette' },
        { key: 'osSelectForOs2', label: 'OS Select For OS/2', options: ['Non-OS2', 'OS2'], desc: 'Memory configuration mode for OS/2 operating system with >64MB RAM' },
        { key: 'videoBiosShadow', label: 'Video BIOS Shadow', options: ['Enabled', 'Disabled'], desc: 'Copies slow Video ROM to fast 32-bit system RAM at C0000-C7FFF' },
        { key: 'c8000Shadow', label: 'C8000-CBFFF Shadow', options: ['Disabled', 'Enabled'], desc: 'Shadows optional network or SCSI controller expansion ROM' }
      ],
      chipset: [
        { key: 'sdramConfig', label: 'SDRAM Configuration', options: ['By SPD', '7ns (143MHz)', '8ns (125MHz)', 'User Define'], desc: 'By SPD reads timings from the DIMM. User Define unlocks manual timings' },
        { key: 'sdramCasLatency', label: 'SDRAM CAS Latency', options: ['2', '3'], requires: { page: 'chipset', key: 'sdramConfig', equals: 'User Define' }, desc: 'SDRAM Column Address Strobe clock cycle latency' },
        { key: 'sdramRasToCas', label: 'SDRAM RAS to CAS Delay', options: ['2', '3'], requires: { page: 'chipset', key: 'sdramConfig', equals: 'User Define' }, desc: 'Clocks between Row Address and Column Address strobe' },
        { key: 'sdramRasPrecharge', label: 'SDRAM RAS Precharge Time', options: ['2', '3'], requires: { page: 'chipset', key: 'sdramConfig', equals: 'User Define' }, desc: 'Clocks allocated for RAS precharge before refresh cycle' },
        { key: 'dramIntegrity', label: 'DRAM Data Integrity Mode', options: ['Non-ECC', 'ECC'], desc: 'Enables Error Checking and Correcting parity logic' },
        { key: 'agpApertureSize', label: 'AGP Aperture Size (MB)', options: ['32M', '64M', '128M', '256M'], desc: 'Amount of main system RAM mapped for AGP 3D texture storage' },
        { key: 'agp2xMode', label: 'AGP 2X Mode', options: ['Enabled', 'Disabled'], desc: 'Enables 133MHz 2X double-pumped transfer protocol on AGP 3D card' },
        { key: 'cpuHostClock', label: 'CPU Host/PCI Clock (FSB)', options: ['66 MHz', '100 MHz', '112 MHz', '124 MHz', '133 MHz', '140 MHz', '150 MHz'], desc: 'Front Side Bus clock. Above 100 MHz overclocks the CPU and PCI bus' },
        { key: 'cpuMultiplier', label: 'CPU Bus Multiplier', options: ['3.5x', '4.0x', '4.5x', '5.0x', '5.5x'], desc: 'CPU clock = FSB x multiplier' },
        { key: 'cpuVoltage', label: 'CPU Core Voltage (Vcore)', options: ['Auto', '2.00V', '2.05V', '2.10V', '2.20V'], desc: 'Regulated switching power supply voltage for Deschutes Slot 1 CPU' }
      ],
      power: [
        { key: 'powerManagement', label: 'Power Management', options: ['User Define', 'Min Saving', 'Max Saving', 'Disabled'], desc: 'User Define unlocks the individual timers below' },
        { key: 'pmControlApm', label: 'PM Control by APM', options: ['Yes', 'No'], desc: 'Allows Win 98 Advanced Power Management driver to manage standby' },
        { key: 'videoOffMethod', label: 'Video Off Method', options: ['DPMS Support', 'V/H SYNC+Blank', 'Blank Screen'], desc: 'Selects monitor power saving sync signal blanking method' },
        { key: 'videoOffAfter', label: 'Video Off After', options: ['Standby', 'Suspend', 'Doze', 'Instant-Off'], desc: 'State trigger after which monitor sync is powered off' },
        { key: 'dozeMode', label: 'Doze Mode', options: ['Disabled', '1 Min', '2 Min', '4 Min', '8 Min', '20 Min', '1 Hour'], requires: { page: 'power', key: 'powerManagement', equals: 'User Define' }, desc: 'Slows down CPU clock when system is idle' },
        { key: 'standbyMode', label: 'Standby Mode', options: ['Disabled', '1 Min', '2 Min', '4 Min', '8 Min', '20 Min', '1 Hour'], requires: { page: 'power', key: 'powerManagement', equals: 'User Define' }, desc: 'Powers down monitor and video accelerator during inactivity' },
        { key: 'suspendMode', label: 'Suspend Mode', options: ['Disabled', '1 Min', '2 Min', '4 Min', '8 Min', '20 Min', '1 Hour'], requires: { page: 'power', key: 'powerManagement', equals: 'User Define' }, desc: 'Powers down motherboard peripherals into low-power sleep' },
        { key: 'hddPowerDown', label: 'HDD Power Down', options: ['Disabled', '1 Min', '2 Min', '5 Min', '10 Min', '15 Min'], requires: { page: 'power', key: 'powerManagement', equals: 'User Define' }, desc: 'Spins down IDE hard disk drive spindle motor after idle interval' },
        { key: 'softOffPwrBtn', label: 'Soft-Off by PWR-BTTN', options: ['Instant-Off', 'Delay 4 Sec'], desc: 'ATX power button override: immediate shutdown or 4-second hold' }
      ],
      pnpPci: [
        { key: 'pnpOsInstalled', label: 'PNP OS Installed', options: ['Yes', 'No'], desc: 'Set to Yes for Win 98 to configure PnP PCI devices dynamically' },
        { key: 'resourcesControlledBy', label: 'Resources Controlled By', options: ['Auto(ESCD)', 'Manual'], desc: 'Automatic Extended System Configuration Data arbitration or manual IRQs' },
        { key: 'resetConfigData', label: 'Reset Configuration Data', options: ['Disabled', 'Enabled'], desc: 'Forces clearing and rebuilding of ESCD NVRAM table upon next POST' },
        { key: 'assignIrqVga', label: 'Assign IRQ For VGA', options: ['Enabled', 'Disabled'], desc: 'Gives the display card its own interrupt. Shown in the POST PCI list' },
        { key: 'assignIrqUsb', label: 'Assign IRQ For USB', options: ['Enabled', 'Disabled'], requires: whenEnabled('peripherals', 'usbController'), desc: 'Gives the USB host controller its own interrupt' },
        { key: 'pciLatencyTimer', label: 'PCI Latency Timer (Clocks)', options: ['32', '64', '96', '128'], desc: 'PCI bus clock cycles guaranteed to a PCI bus master before preemption' }
      ],
      peripherals: [
        { key: 'onChipPrimaryIde', label: 'On-Chip Primary IDE', options: ['Enabled', 'Disabled'], desc: 'IDE channel 0 with drive C:. Disabled means Win 98 cannot boot' },
        { key: 'onChipSecondaryIde', label: 'On-Chip Secondary IDE', options: ['Enabled', 'Disabled'], desc: 'IDE channel 1 with the CD-ROM drive' },
        { key: 'idePriMasterPio', label: 'IDE Primary Master PIO', options: ['Auto', 'Mode 0', 'Mode 1', 'Mode 2', 'Mode 3', 'Mode 4'], requires: whenEnabled('peripherals', 'onChipPrimaryIde'), desc: 'Programmed Input/Output transfer speed mode for Primary Master HDD' },
        { key: 'idePriMasterUdma', label: 'IDE Primary Master UDMA', options: ['Auto', 'Disabled'], requires: whenEnabled('peripherals', 'onChipPrimaryIde'), desc: 'Enables Ultra DMA/33 high-speed burst bus mastering transfers' },
        { key: 'usbController', label: 'Onboard USB Controller', options: ['Enabled', 'Disabled'], desc: 'Enables Intel 82371AB PIIX4 Universal Serial Bus host root hub' },
        { key: 'usbKeyboardSupport', label: 'USB Keyboard Support', options: ['Enabled', 'Disabled'], requires: whenEnabled('peripherals', 'usbController'), desc: 'Provides legacy PS/2 emulation for USB keyboard in DOS and BIOS setup' },
        { key: 'onboardFdc', label: 'Onboard FDC Controller', options: ['Enabled', 'Disabled'], desc: 'Floppy disk controller. Disabled skips the floppy seek at boot' },
        { key: 'serialPort1', label: 'Onboard Serial Port 1', options: ['3F8/IRQ4', '2F8/IRQ3', 'Disabled'], desc: 'I/O address and IRQ line for COM1 standard 16550A UART serial port' },
        { key: 'serialPort2', label: 'Onboard Serial Port 2', options: ['2F8/IRQ3', '3F8/IRQ4', 'Disabled'], desc: 'I/O address and IRQ line for COM2 standard 16550A UART serial port' },
        { key: 'parallelPort', label: 'Onboard Parallel Port', options: ['378/IRQ7', '278/IRQ5', 'Disabled'], desc: 'Base address and IRQ for IEEE-1284 LPT1 printer port' },
        { key: 'parallelPortMode', label: 'Parallel Port Mode', options: ['ECP+EPP', 'SPP', 'EPP', 'ECP'], requires: { page: 'peripherals', key: 'parallelPort', notEquals: 'Disabled' }, desc: 'Bi-directional Extended Capabilities & Enhanced Parallel Port mode' },
        { key: 'onboardAudio', label: 'Sound Blaster / Audio System', options: ['Enabled', 'Disabled'], desc: 'Onboard sound chip. Disabled silences all Win 98 audio' }
      ]
    };
  }

  findOption(page, key) {
    return (this.schemas[page] || []).find(opt => opt.key === key);
  }

  getOptionValue(page, opt) {
    if (opt.readOnly) return opt.read();
    const holder = this.settings[page][opt.key];
    return opt.field ? holder[opt.field] : holder;
  }

  setOptionValue(page, opt, value) {
    if (opt.field) this.settings[page][opt.key][opt.field] = value;
    else this.settings[page][opt.key] = value;
  }

  getLockReason(opt) {
    if (opt.readOnly) return null;
    const rule = opt.requires;
    if (!rule) return null;
    const current = this.settings[rule.page][rule.key];
    const parentLabel = this.findOption(rule.page, rule.key).label;
    if (rule.equals !== undefined && current !== rule.equals) return `Available when ${parentLabel} is ${rule.equals}`;
    if (rule.notEquals !== undefined && current === rule.notEquals) return `Available when ${parentLabel} is not ${rule.notEquals}`;
    return null;
  }

  initDOM() {
    this.postScreen = document.getElementById('bios-post-screen');
    this.setupScreen = document.getElementById('bios-setup-screen');

    if (!this.postScreen || !this.setupScreen) {
      console.warn('BIOS DOM containers not found in index.html');
      return;
    }

    if (!this.setupScreen.classList.contains('active')) this.applyTheme(false);
    this.bindGlobalEvents();
  }

  applyTheme(active) {
    this.setupScreen.className = `bios-root ${this.settings.meta.colorTheme || 'theme-blue'}${active ? ' active' : ''}`;
  }

  bindGlobalEvents() {
    if (this.eventsBound) return;
    this.eventsBound = true;
    window.addEventListener('keydown', (e) => this.onKeyDown(e), true);
  }

  isSetupVisible() {
    return Boolean(this.setupScreen && this.setupScreen.classList.contains('active'));
  }

  isPostVisible() {
    return Boolean(this.postScreen && this.postScreen.classList.contains('active'));
  }

  onKeyDown(e) {
    const ownsKeyboard = this.isSetupVisible() || this.isPostVisible();
    if (!ownsKeyboard) return;
    e.stopPropagation();
    if (/^F\d+$/.test(e.key)) e.preventDefault();

    if (this.currentModal) {
      this.handleModalKey(e);
    } else if (this.isSetupVisible()) {
      this.handleSetupKey(e);
    } else if (this.bootFailed) {
      this.handleBootFailureKey(e);
    } else if (this.postRunning) {
      this.handlePostKey(e);
    }
  }

  handlePostKey(e) {
    if (e.key === 'Delete' || e.key === 'Del' || e.key === 'F2') {
      e.preventDefault();
      this.interruptPostForSetup();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.skipMemoryTest();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.finishPostInstantly();
    } else if (e.key === 'F8' && typeof window.openWin98StartupMenu === 'function' && this.resolveBootDevice().device) {
      e.preventDefault();
      this.stopPost();
      window.openWin98StartupMenu();
    }
  }

  handleBootFailureKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.retryBoot();
    } else if (e.key === 'Delete' || e.key === 'Del' || e.key === 'F2') {
      e.preventDefault();
      this.interruptPostForSetup();
    }
  }

  startPost(onFinished) {
    this.initDOM();
    if (!this.postScreen) {
      if (onFinished) onFinished();
      return;
    }

    this.onPostFinishedCallback = onFinished || this.onPostFinishedCallback || window.launchWindowsBootSequence;
    clearTimeout(this.postTimer);
    this.postAborted = false;
    this.postRunning = false;
    this.bootFailed = false;
    this.postScreen.innerHTML = '';
    this.postScreen.classList.add('active');

    const needsBootPassword = this.settings.features.securityOption === 'System' && this.hasAnyPassword();
    if (needsBootPassword) {
      this.promptPassword({
        title: 'Enter Password',
        cancellable: false,
        onAccepted: () => this.runPostSequence(this.getEffectiveCpuSpecs())
      });
    } else {
      this.runPostSequence(this.getEffectiveCpuSpecs());
    }
  }

  retryBoot() {
    this.startPost();
  }

  runPostSequence(cpu) {
    if (this.postAborted) return;
    this.postRunning = true;

    this.postScreen.innerHTML = `
      <div class="post-top-row">
        <div class="post-header-text">
          <div class="post-title-main">Award Modular BIOS v4.51PG, An Energy Star Ally</div>
          <div class="post-title-sub">Copyright (C) 1984-98, Award Software, Inc.</div>
          <div class="post-title-mb">ASUS P2B-F ACPI BIOS Revision 1012</div>
        </div>
        <div class="post-energy-star">
          <div class="energy-star-title">energy</div>
          <div class="energy-star-icon">★</div>
          <div class="energy-star-sub">EPA POLLUTION PREVENTER</div>
        </div>
      </div>

      <div class="post-body" id="post-body">
        <div class="post-line post-white">${cpu.name} - ${cpu.frequency}MHz</div>
        <div class="post-line post-dim">Memory Test : <span id="post-mem-count" class="post-white">0K</span> <span id="post-mem-status" class="post-cyan"></span></div>
        <div id="post-extra-lines"></div>
      </div>

      <div class="post-footer">
        <div class="post-prompt-row">
          <span class="post-white">Press <strong class="post-yellow">DEL</strong> to enter SETUP, <strong class="post-yellow">ESC</strong> to skip memory test</span>
          <span class="post-chipset-id">${this.chipsetId}</span>
        </div>
        <div class="post-action-hints">
          <button class="post-action-btn" id="btn-post-del">DEL  Enter Setup</button>
          <button class="post-action-btn" id="btn-post-skip">Space  Boot now</button>
        </div>
      </div>
    `;

    this.bindClick('#btn-post-del', () => this.interruptPostForSetup());
    this.bindClick('#btn-post-skip', () => this.finishPostInstantly());
    this.runMemoryCounter(cpu);
  }

  bindClick(selector, handler) {
    const el = this.postScreen.querySelector(selector);
    if (!el) return;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      handler();
    });
  }

  playFloppySeekIfPresent() {
    const seekEnabled = this.settings.features.bootUpFloppySeek === 'Enabled';
    if (seekEnabled && this.hasFloppy() && window.soundSys) {
      setTimeout(() => window.soundSys.playFloppySeekSound(), 200);
    }
  }

  runMemoryCounter(cpu) {
    const memEl = document.getElementById('post-mem-count');
    const statusEl = document.getElementById('post-mem-status');
    if (!memEl) return;

    const total = cpu.ramKb;
    const isQuick = this.settings.features.quickPost === 'Enabled';
    const step = isQuick ? 8192 : 2048;
    const interval = isQuick ? 25 : 45;
    let current = 0;

    const count = () => {
      if (this.postAborted || !this.postRunning) return;
      current += step;
      if (current >= total) {
        memEl.textContent = `${total}K`;
        statusEl.textContent = 'OK';
        if (window.soundSys) window.soundSys.playPostBeep();
        this.playFloppySeekIfPresent();
        this.postTimer = setTimeout(() => this.continuePostAfterMemory(), isQuick ? 300 : 600);
      } else {
        memEl.textContent = `${current}K`;
        this.postTimer = setTimeout(count, interval);
      }
    };

    count();
  }

  skipMemoryTest() {
    if (!this.postRunning || this.postAborted) return;
    const memEl = document.getElementById('post-mem-count');
    const statusEl = document.getElementById('post-mem-status');
    if (!memEl || statusEl.textContent === 'OK') return;
    clearTimeout(this.postTimer);
    memEl.textContent = `${this.getEffectiveCpuSpecs().ramKb}K`;
    statusEl.textContent = 'OK';
    if (window.soundSys) window.soundSys.playPostBeep();
    this.playFloppySeekIfPresent();
    this.continuePostAfterMemory();
  }

  continuePostAfterMemory() {
    if (this.postAborted || !this.postRunning) return;
    const extra = document.getElementById('post-extra-lines');
    if (!extra) return;

    const detectLine = (label, key) => {
      const drive = this.getDrive(key);
      return `<div class="post-line">Detecting IDE ${label} ... <span class="post-cyan">${drive.detected ? drive.name : 'None'}</span></div>`;
    };

    const lines = [
      '<div class="post-line post-dim">Award Plug and Play BIOS Extension v1.0A</div>',
      '<div class="post-line">Initialize Plug and Play Cards...</div>',
      detectLine('Primary Master  ', 'priMaster'),
      detectLine('Primary Slave   ', 'priSlave'),
      detectLine('Secondary Master', 'secMaster'),
      detectLine('Secondary Slave ', 'secSlave')
    ];

    let i = 0;
    const printLine = () => {
      if (this.postAborted || !this.postRunning) return;
      if (i < lines.length) {
        extra.insertAdjacentHTML('beforeend', lines[i]);
        i++;
        this.postTimer = setTimeout(printLine, 120);
      } else {
        this.postTimer = setTimeout(() => this.showPciDeviceListing(), 450);
      }
    };

    printLine();
  }

  getPciDevices() {
    const { peripherals, pnpPci } = this.settings;
    const devices = [
      { bus: 0, dev: 7, fn: 1, vendor: '8086', device: '7111', cls: 'IDE Controller', irq: '14' },
      { bus: 0, dev: 7, fn: 2, vendor: '8086', device: '7112', cls: 'Serial Bus (USB)', irq: pnpPci.assignIrqUsb === 'Enabled' ? '10' : 'NA', present: peripherals.usbController === 'Enabled' },
      { bus: 1, dev: 0, fn: 0, vendor: '10DE', device: '0020', cls: 'Display Controller', irq: pnpPci.assignIrqVga === 'Enabled' ? '11' : 'NA' },
      { bus: 0, dev: 9, fn: 0, vendor: '1274', device: '1371', cls: 'Multimedia Device', irq: '5', present: this.isAudioEnabled() },
      { bus: 0, dev: 10, fn: 0, vendor: '10EC', device: '8139', cls: 'Network Controller', irq: '9' }
    ];
    return devices.filter(d => d.present !== false);
  }

  showPciDeviceListing() {
    if (this.postAborted || !this.postRunning) return;
    const rows = this.getPciDevices()
      .map(d => `<tr><td>${d.bus}</td><td>${d.dev}</td><td>${d.fn}</td><td>${d.vendor}</td><td>${d.device}</td><td>${d.cls}</td><td>${d.irq}</td></tr>`)
      .join('');
    const boot = this.resolveBootDevice();
    const attemptLines = boot.attempts.map(text => `<div class="post-line post-cyan">${text}</div>`).join('');

    this.postScreen.innerHTML = `
      <div class="post-body">
        <div class="post-line post-cyan post-heading">PCI device listing...</div>
        <table class="post-pci-table">
          <thead>
            <tr><th>Bus No.</th><th>Device No.</th><th>Func No.</th><th>Vendor ID</th><th>Device ID</th><th>Device Class</th><th>IRQ</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="post-line post-dim">ACPI Controller enabled at IRQ 9</div>
        <div class="post-line post-gap">Verifying DMI Pool Data ............</div>
        ${attemptLines}
        <div id="post-boot-result"></div>
      </div>
      <div class="post-footer">
        <div class="post-prompt-row">
          <span class="post-dim">Boot sequence: ${this.settings.features.bootSequence}</span>
          <span class="post-chipset-id">${this.chipsetId}</span>
        </div>
      </div>
    `;

    if (boot.device) {
      this.postScreen.querySelector('#post-boot-result').innerHTML = '<div class="post-line post-white post-boot-line">Starting Microslop Win 98...</div>';
      this.postTimer = setTimeout(() => this.finishPostToWindows(), 1100);
    } else {
      this.postTimer = setTimeout(() => this.showBootFailure(), 500);
    }
  }

  showBootFailure() {
    if (this.postAborted || !this.postRunning) return;
    this.postRunning = false;
    this.bootFailed = true;
    if (window.soundSys) window.soundSys.playBiosErrorBeep();
    const target = this.postScreen.querySelector('#post-boot-result');
    target.innerHTML = `
      <div class="post-line post-white post-boot-line">DISK BOOT FAILURE, INSERT SYSTEM DISK AND PRESS ENTER</div>
      <div class="post-line post-dim">No bootable hard disk found. Check Primary Master and On-Chip Primary IDE in Setup.</div>
      <div class="post-action-hints">
        <button class="post-action-btn" id="btn-boot-retry">Enter  Retry boot</button>
        <button class="post-action-btn" id="btn-boot-setup">DEL  Enter Setup</button>
      </div>
    `;
    this.bindClick('#btn-boot-retry', () => this.retryBoot());
    this.bindClick('#btn-boot-setup', () => this.interruptPostForSetup());
    this.postScreen.querySelector('#btn-boot-retry').focus();
  }

  finishPostInstantly() {
    if (!this.postRunning) return;
    clearTimeout(this.postTimer);
    if (this.resolveBootDevice().device) {
      this.finishPostToWindows();
    } else {
      this.showPciDeviceListing();
      clearTimeout(this.postTimer);
      this.showBootFailure();
    }
  }

  stopPost() {
    clearTimeout(this.postTimer);
    this.postRunning = false;
    this.postAborted = true;
    this.bootFailed = false;
  }

  finishPostToWindows() {
    this.stopPost();
    if (this.postScreen) this.postScreen.classList.remove('active');
    const callback = this.onPostFinishedCallback;
    this.onPostFinishedCallback = null;
    if (callback) callback();
  }

  interruptPostForSetup() {
    this.stopPost();
    if (window.soundSys) window.soundSys.playBiosKeyBeep();
    this.openSetup();
    if (this.postScreen) this.postScreen.classList.remove('active');
  }

  promptPassword({ title, cancellable, onAccepted, onCancel }) {
    this.renderPasswordEntryModal(title, cancellable, (entered) => {
      const access = this.getPasswordAccess(entered);
      if (access) {
        this.failedPasswords = 0;
        this.closeModal();
        onAccepted(access);
        return;
      }
      this.failedPasswords++;
      if (window.soundSys) window.soundSys.playBiosErrorBeep();
      if (this.failedPasswords >= 3) {
        this.triggerSystemHalted();
      } else {
        this.closeModal();
        this.promptPassword({ title: `Invalid password. ${3 - this.failedPasswords} attempt(s) left`, cancellable, onAccepted, onCancel });
      }
    }, onCancel);
  }

  triggerSystemHalted() {
    this.closeModal();
    this.stopPost();
    this.failedPasswords = 0;
    this.clearClock();
    if (window.soundSys) window.soundSys.playSystemHaltedBeep();
    if (this.setupScreen) this.setupScreen.classList.remove('active');
    if (!this.postScreen) return;
    this.postScreen.innerHTML = `
      <div class="post-halted">
        <div class="post-halted-title">SYSTEM HALTED</div>
        <p class="post-white">Too many invalid password attempts.</p>
        <p class="post-yellow">Restart and try again, or clear CMOS to erase all passwords and settings.</p>
        <div class="post-action-hints post-halted-actions">
          <button class="post-action-btn" id="btn-halt-reset">Restart</button>
          <button class="post-action-btn" id="btn-halt-clear">Clear CMOS and restart</button>
        </div>
      </div>
    `;
    this.postScreen.classList.add('active');
    this.bindClick('#btn-halt-reset', () => this.retryBoot());
    this.bindClick('#btn-halt-clear', () => this.clearCmos());
  }

  clearCmos() {
    this.settings = this.clone(this.defaultSettings);
    this.saveSettings();
    this.retryBoot();
  }

  openSetup() {
    this.initDOM();
    if (!this.setupScreen) return;
    this.closeModal();
    this.clearClock();
    this.activeSubmenu = null;
    this.mainMenuIndex = 0;
    this.applyTheme(true);
    this.setupScreen.innerHTML = '';

    if (!this.hasAnyPassword()) {
      this.accessLevel = 'supervisor';
      this.renderMainMenu();
      return;
    }

    this.promptPassword({
      title: 'Enter Password',
      cancellable: true,
      onAccepted: (access) => {
        this.accessLevel = access;
        if (access === 'user') this.mainMenuIndex = this.mainMenuItems.findIndex(item => item.id === 'userPass');
        this.renderMainMenu();
      },
      onCancel: () => this.closeSetup()
    });
  }

  closeSetup() {
    this.closeModal();
    this.clearClock();
    if (this.setupScreen) this.setupScreen.classList.remove('active');
    this.startPost();
  }

  clearClock() {
    clearInterval(this.clockTimer);
    this.clockTimer = null;
  }

  renderScreen(title, body, legend, navButtons, status) {
    const legendHtml = legend.map(([key, text]) => `<span><span class="bios-key-tag">${key}</span> : ${text}</span>`).join('');
    const navHtml = navButtons.map(([act, text, tone]) => `<button class="bios-nav-btn${tone ? ` ${tone}` : ''}" data-act="${act}">${text}</button>`).join('');

    this.setupScreen.innerHTML = `
      <div class="bios-header">
        <div class="bios-header-top">ROM PCI/ISA BIOS (2A69KB0E)</div>
        <div class="bios-header-title">${title}</div>
        <div class="bios-header-vendor">AWARD SOFTWARE, INC.</div>
      </div>
      ${body}
      <div class="bios-footer">
        <div class="bios-status-line" id="bios-status-line">${status}</div>
        <div class="bios-keys-legend">${legendHtml}</div>
        <div class="bios-touch-nav">${navHtml}</div>
      </div>
    `;
  }

  isMainItemLocked(id) {
    return this.accessLevel === 'user' && !this.userLevelItems.includes(id);
  }

  renderMainMenu() {
    if (!this.setupScreen) return;
    this.clearClock();
    this.activeSubmenu = null;

    const itemHtml = (item, idx) => {
      const classes = ['bios-menu-item'];
      if (this.mainMenuIndex === idx) classes.push('active');
      if (this.isMainItemLocked(item.id)) classes.push('locked');
      return `<div class="${classes.join(' ')}" data-idx="${idx}" data-id="${item.id}">${item.label}</div>`;
    };
    const leftCount = this.mainMenu.left.length;
    const leftHtml = this.mainMenu.left.map((item, idx) => itemHtml(item, idx)).join('');
    const rightHtml = this.mainMenu.right.map((item, idx) => itemHtml(item, idx + leftCount)).join('');

    const current = this.mainMenuItems[this.mainMenuIndex];
    const status = this.isMainItemLocked(current.id) ? 'Supervisor password required' : current.desc;

    this.renderScreen(
      'CMOS SETUP UTILITY',
      `<div class="bios-main-frame">
        <div class="bios-col">${leftHtml}</div>
        <div class="bios-divider"></div>
        <div class="bios-col">${rightHtml}</div>
      </div>`,
      [['Esc', 'Quit'], ['↑ ↓ → ←', 'Select Item'], ['F2', 'Change Color'], ['F10', 'Save & Exit Setup']],
      [['up', '▲ Up'], ['down', '▼ Down'], ['left', '◄ Left'], ['right', '► Right'], ['enter', '↵ Enter', 'accent'], ['color', 'F2 Color'], ['esc', 'Esc Quit'], ['f10', 'F10 Save', 'confirm']],
      status
    );

    this.setupScreen.querySelectorAll('.bios-menu-item').forEach(el => {
      el.addEventListener('click', () => {
        this.mainMenuIndex = parseInt(el.dataset.idx, 10);
        this.renderMainMenu();
        this.activateMainMenuItem(el.dataset.id);
      });
    });

    this.bindNavButtons({
      up: () => this.moveMainMenu(0, -1),
      down: () => this.moveMainMenu(0, 1),
      left: () => this.moveMainMenu(-1, 0),
      right: () => this.moveMainMenu(1, 0),
      enter: () => this.activateMainMenuItem(this.mainMenuItems[this.mainMenuIndex].id),
      color: () => this.cycleColorTheme(),
      esc: () => this.promptQuitWithoutSaving(),
      f10: () => this.promptSaveAndExit()
    });
  }

  bindNavButtons(actions) {
    this.setupScreen.querySelectorAll('.bios-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = actions[btn.dataset.act];
        if (action) action();
      });
    });
  }

  moveMainMenu(dx, dy) {
    if (window.soundSys) window.soundSys.playBiosKeyBeep();
    const leftCount = this.mainMenu.left.length;
    const rightCount = this.mainMenu.right.length;
    const isLeft = this.mainMenuIndex < leftCount;

    if (dx > 0 && isLeft) {
      this.mainMenuIndex = Math.min(leftCount + this.mainMenuIndex, leftCount + rightCount - 1);
    } else if (dx < 0 && !isLeft) {
      this.mainMenuIndex = Math.min(this.mainMenuIndex - leftCount, leftCount - 1);
    }

    if (dy !== 0) {
      if (this.mainMenuIndex < leftCount) {
        this.mainMenuIndex = (this.mainMenuIndex + dy + leftCount) % leftCount;
      } else {
        const offset = this.mainMenuIndex - leftCount;
        this.mainMenuIndex = leftCount + (offset + dy + rightCount) % rightCount;
      }
    }

    this.renderMainMenu();
  }

  activateMainMenuItem(id) {
    if (this.isMainItemLocked(id)) {
      if (window.soundSys) window.soundSys.playBiosErrorBeep();
      return;
    }
    if (window.soundSys) window.soundSys.playBiosKeyBeep();
    if (this.schemas[id]) {
      this.openSubmenu(id);
    } else if (id === 'loadBiosDefaults') {
      this.promptLoadDefaults('BIOS');
    } else if (id === 'loadSetupDefaults') {
      this.promptLoadDefaults('SETUP');
    } else if (id === 'supervisorPass') {
      this.promptSetPassword('supervisor');
    } else if (id === 'userPass') {
      this.promptSetPassword('user');
    } else if (id === 'hddAutoDetect') {
      this.runHddAutoDetect();
    } else if (id === 'saveAndExit') {
      this.promptSaveAndExit();
    } else if (id === 'exitNoSave') {
      this.promptQuitWithoutSaving();
    }
  }

  openSubmenu(id) {
    this.activeSubmenu = id;
    this.submenuRowIndex = 0;
    this.renderSubmenu();
  }

  renderDriveColumns(drive) {
    const cells = drive.present
      ? [drive.type, drive.size, drive.cyl, drive.head, drive.precomp, drive.landz, drive.sector, drive.mode]
      : [drive.type, 0, 0, 0, 0, 0, 0, ''];
    if (drive.present && !drive.size) cells.splice(1, 7, '', '', '', '', '', '', '');
    return `<span class="bios-drive-cols">${cells.map(c => `<span>${c}</span>`).join('')}</span>`;
  }

  renderOptionRow(page, opt, idx) {
    const classes = ['bios-option-row'];
    if (this.submenuRowIndex === idx) classes.push('active');
    if (opt.readOnly || this.getLockReason(opt)) classes.push('locked');
    if (opt.drive) classes.push('drive-row');
    const value = opt.drive
      ? this.renderDriveColumns(this.getDrive(opt.key))
      : `<span class="bios-opt-val">${this.getOptionValue(page, opt)}</span>`;
    return `<div class="${classes.join(' ')}" data-idx="${idx}" data-key="${opt.key}"><span class="bios-opt-label">${opt.label}</span>${value}</div>`;
  }

  renderPagePanel(page) {
    const cpu = this.getEffectiveCpuSpecs();
    const cell = (label, value) => `<div class="bios-mem-row"><span class="bios-mem-label">${label}</span><span class="bios-mem-val">${value}</span></div>`;
    if (page === 'standard') {
      return `<div class="bios-memory-panel">${cell('Base Memory:', `${cpu.baseKb}K`)}${cell('Extended Memory:', `${cpu.extKb}K`)}${cell('Other Memory:', `${cpu.sysKb}K`)}${cell('Total Memory:', `${cpu.ramKb}K`)}</div>`;
    }
    if (page === 'chipset') {
      return `<div class="bios-memory-panel">${cell('CPU:', `${cpu.frequency}MHz`)}${cell('PCI Clock:', `${cpu.pciClock}MHz`)}<div class="bios-cpu-name">${cpu.name}</div></div>`;
    }
    return '';
  }

  renderSubmenu() {
    if (!this.setupScreen || !this.activeSubmenu) return;
    const page = this.activeSubmenu;
    const schema = this.schemas[page];
    this.clearClock();

    const driveHeader = page === 'standard'
      ? '<div class="bios-option-row drive-row drive-head"><span class="bios-opt-label">Hard Disks</span><span class="bios-drive-cols"><span>TYPE</span><span>SIZE</span><span>CYLS</span><span>HEAD</span><span>PRECOMP</span><span>LANDZ</span><span>SECTOR</span><span>MODE</span></span></div>'
      : '';
    const rows = schema.map((opt, idx) => this.renderOptionRow(page, opt, idx));
    if (driveHeader) rows.splice(2, 0, driveHeader);

    const legend = [['Esc', 'Exit'], ['↑ ↓', 'Select Item'], ['PgUp/PgDn/+/-', 'Modify'], ['F1', 'Help']];
    if (page !== 'standard') legend.push(['F5', 'Old Values'], ['F6', 'BIOS Defaults'], ['F7', 'Setup Defaults']);

    this.renderScreen(
      this.pageTitles[page],
      `<div class="bios-submenu-container">
        <div class="bios-option-list">${rows.join('')}</div>
        ${this.renderPagePanel(page)}
      </div>`,
      legend,
      [['sub-up', '▲ Up'], ['sub-down', '▼ Down'], ['prev', '◄ Prev (-)'], ['next', '► Next (+)'], ['help', 'F1 Help'], ['esc', 'Esc Return']],
      this.getLockReason(schema[this.submenuRowIndex]) || schema[this.submenuRowIndex].desc
    );

    this.setupScreen.querySelectorAll('.bios-option-row[data-idx]').forEach(row => {
      row.addEventListener('click', () => {
        const idx = parseInt(row.dataset.idx, 10);
        if (this.submenuRowIndex === idx) {
          this.cycleCurrentOption(1);
        } else {
          this.submenuRowIndex = idx;
          this.renderSubmenu();
        }
      });
    });

    this.bindNavButtons({
      'sub-up': () => this.moveSubmenu(-1),
      'sub-down': () => this.moveSubmenu(1),
      prev: () => this.cycleCurrentOption(-1),
      next: () => this.cycleCurrentOption(1),
      help: () => this.showItemHelp(),
      esc: () => this.returnToMainMenu()
    });

    if (page === 'standard') this.startClock();
  }

  startClock() {
    this.clockTimer = setInterval(() => {
      if (!this.isSetupVisible() || this.activeSubmenu !== 'standard') {
        this.clearClock();
        return;
      }
      ['date', 'time'].forEach(key => {
        const cell = this.setupScreen.querySelector(`.bios-option-row[data-key="${key}"] .bios-opt-val`);
        if (cell) cell.textContent = this.getOptionValue('standard', this.findOption('standard', key));
      });
    }, 1000);
  }

  returnToMainMenu() {
    if (window.soundSys) window.soundSys.playBiosKeyBeep();
    this.renderMainMenu();
  }

  moveSubmenu(dy) {
    if (window.soundSys) window.soundSys.playBiosKeyBeep();
    const total = this.schemas[this.activeSubmenu].length;
    this.submenuRowIndex = (this.submenuRowIndex + dy + total) % total;
    this.renderSubmenu();
  }

  cycleCurrentOption(dir = 1) {
    const page = this.activeSubmenu;
    const schema = this.schemas[page];
    if (!schema || !schema[this.submenuRowIndex]) return;
    const opt = schema[this.submenuRowIndex];

    if (opt.readOnly || this.getLockReason(opt)) {
      if (window.soundSys) window.soundSys.playBiosErrorBeep();
      return;
    }

    if (window.soundSys) window.soundSys.playBiosKeyBeep();
    const idx = opt.options.indexOf(this.getOptionValue(page, opt));
    const nextIdx = (idx + dir + opt.options.length) % opt.options.length;
    this.setOptionValue(page, opt, opt.options[nextIdx]);
    this.renderSubmenu();
  }

  showItemHelp() {
    const opt = this.schemas[this.activeSubmenu] && this.schemas[this.activeSubmenu][this.submenuRowIndex];
    if (!opt) return;
    const lock = this.getLockReason(opt);
    const values = opt.readOnly ? 'Read only' : `Available values:<br>${opt.options.join(', ')}`;
    const lockLine = lock ? `<br><br><span class="bios-help-warn">${lock}</span>` : '';
    this.renderHelpModal('ITEM SPECIFIC HELP', `<strong>${opt.label}</strong><br><br>${opt.desc}<br><br>${values}${lockLine}`);
  }

  handleSetupKey(e) {
    if (this.activeSubmenu) {
      this.handleSubmenuKey(e);
    } else {
      this.handleMainMenuKey(e);
    }
  }

  handleSubmenuKey(e) {
    const page = this.activeSubmenu;
    const key = e.key;
    const handlers = {
      ArrowUp: () => this.moveSubmenu(-1),
      ArrowDown: () => this.moveSubmenu(1),
      PageUp: () => this.cycleCurrentOption(1),
      PageDown: () => this.cycleCurrentOption(-1),
      ArrowRight: () => this.cycleCurrentOption(1),
      ArrowLeft: () => this.cycleCurrentOption(-1),
      '+': () => this.cycleCurrentOption(1),
      '=': () => this.cycleCurrentOption(1),
      ' ': () => this.cycleCurrentOption(1),
      '-': () => this.cycleCurrentOption(-1),
      Escape: () => this.returnToMainMenu(),
      F1: () => this.showItemHelp(),
      F10: () => this.promptSaveAndExit()
    };
    if (page !== 'standard') {
      handlers.F5 = () => {
        this.restorePageFromCmos(page);
        this.renderSubmenu();
      };
      handlers.F6 = () => this.promptLoadDefaults('BIOS', page);
      handlers.F7 = () => this.promptLoadDefaults('SETUP', page);
    }
    const handler = handlers[key];
    if (!handler) return;
    e.preventDefault();
    handler();
  }

  handleMainMenuKey(e) {
    const handlers = {
      ArrowUp: () => this.moveMainMenu(0, -1),
      ArrowDown: () => this.moveMainMenu(0, 1),
      ArrowLeft: () => this.moveMainMenu(-1, 0),
      ArrowRight: () => this.moveMainMenu(1, 0),
      Enter: () => this.activateMainMenuItem(this.mainMenuItems[this.mainMenuIndex].id),
      Escape: () => this.promptQuitWithoutSaving(),
      F10: () => this.promptSaveAndExit(),
      F2: () => this.cycleColorTheme()
    };
    const handler = handlers[e.key];
    if (!handler) return;
    e.preventDefault();
    handler();
  }

  promptSaveAndExit() {
    this.renderConfirmModal('SAVE to CMOS and EXIT (Y/N)?', '', 'Y', (yes) => {
      if (!yes) {
        this.closeModal();
        return;
      }
      this.saveSettings();
      if (window.soundSys) window.soundSys.playPostBeep();
      this.closeSetup();
    });
  }

  promptQuitWithoutSaving() {
    const changes = this.countUnsavedChanges();
    const note = changes > 0 ? `${changes} unsaved change${changes === 1 ? '' : 's'} will be discarded` : 'No unsaved changes';
    this.renderConfirmModal('Quit Without Saving (Y/N)?', note, 'N', (yes) => {
      if (!yes) {
        this.closeModal();
        return;
      }
      this.settings = this.loadSettings();
      this.closeSetup();
    });
  }

  promptLoadDefaults(kind = 'SETUP', page = null) {
    const scope = page ? this.pageTitles[page] : 'All feature pages. Passwords and drives are kept';
    this.renderConfirmModal(`Load ${kind} Defaults (Y/N)?`, scope, 'Y', (yes) => {
      this.closeModal();
      if (!yes) return;
      this.applyDefaults(kind, page);
      if (window.soundSys) window.soundSys.playPostBeep();
      if (this.activeSubmenu) this.renderSubmenu();
    });
  }

  promptSetPassword(type = 'supervisor') {
    const field = type === 'supervisor' ? 'supervisorPassword' : 'userPassword';
    this.renderPasswordEntryModal(`Enter ${type === 'supervisor' ? 'Supervisor' : 'User'} Password`, true, (first) => {
      this.closeModal();
      if (!first) {
        this.settings.security[field] = '';
        this.renderHelpModal('PASSWORD DISABLED', 'Password cleared. Save & Exit Setup to keep the change.');
        return;
      }
      this.renderPasswordEntryModal('Confirm Password', true, (second) => {
        this.closeModal();
        if (first === second) {
          this.settings.security[field] = first;
          if (window.soundSys) window.soundSys.playPostBeep();
          this.renderHelpModal('PASSWORD SET', 'Password stored. Save & Exit Setup to keep the change.');
        } else {
          if (window.soundSys) window.soundSys.playBiosErrorBeep();
          this.renderHelpModal('PASSWORD NOT CHANGED', 'Passwords do not match. The old password stays active.');
        }
      });
    });
  }

  runHddAutoDetect() {
    const channels = [['Primary Master', 'priMaster'], ['Primary Slave', 'priSlave'], ['Secondary Master', 'secMaster'], ['Secondary Slave', 'secSlave']];
    const overlay = this.openModal(`
      <div class="bios-modal-box help-box wide">
        <div class="bios-modal-title">IDE HDD AUTO DETECTION</div>
        <pre class="bios-hdd-auto-log" id="bios-hdd-log">Scanning IDE channels...</pre>
        <div class="bios-modal-actions">
          <button class="bios-modal-btn" id="btn-hdd-ok">OK</button>
        </div>
      </div>
    `, {});
    if (!overlay) return;

    const log = overlay.querySelector('#bios-hdd-log');
    const ok = overlay.querySelector('#btn-hdd-ok');
    ok.addEventListener('click', () => this.closeModal());
    ok.focus();

    setTimeout(() => {
      if (!log.isConnected) return;
      const header = 'HARD DISK         TYPE   SIZE   CYLS   HEAD  LANDZ  SECTOR  MODE';
      const lines = channels.map(([label, key]) => {
        const drive = this.getDrive(key);
        if (!this.isChannelEnabled(key)) return `${label.padEnd(18)}Channel disabled`;
        if (!drive.present) return `${label.padEnd(18)}None`;
        if (!drive.size) return `${label.padEnd(18)}${drive.name} (ATAPI)`;
        return `${label.padEnd(18)}Auto   ${String(drive.size).padEnd(7)}${String(drive.cyl).padEnd(7)}${String(drive.head).padEnd(6)}${String(drive.landz).padEnd(7)}${String(drive.sector).padEnd(8)}${drive.mode}`;
      });
      log.textContent = [header, ...lines].join('\n');
      if (window.soundSys) window.soundSys.playPostBeep();
    }, 600);
  }

  getModalParent() {
    return this.isSetupVisible() ? this.setupScreen : this.postScreen;
  }

  openModal(innerHtml, handlers) {
    const parent = this.getModalParent();
    if (!parent) return null;
    const overlay = document.createElement('div');
    overlay.className = 'bios-modal-overlay';
    overlay.innerHTML = innerHtml;
    parent.appendChild(overlay);
    this.currentModal = overlay;
    this.modalHandlers = handlers;
    return overlay;
  }

  renderConfirmModal(title, note, defaultVal, callback) {
    const overlay = this.openModal(`
      <div class="bios-modal-box">
        <div class="bios-modal-title">${title}</div>
        ${note ? `<div class="bios-modal-note">${note}</div>` : ''}
        <div class="bios-modal-input-wrap">
          <input type="text" class="bios-modal-input" maxlength="1" value="${defaultVal}" aria-label="${title}">
        </div>
        <div class="bios-modal-actions">
          <button class="bios-modal-btn btn-confirm-y">Y - Yes</button>
          <button class="bios-modal-btn btn-confirm-n">N - No</button>
        </div>
      </div>
    `, {
      onEnter: () => callback(input.value.trim().toUpperCase() === 'Y'),
      onEscape: () => callback(false)
    });
    if (!overlay) return;
    const input = overlay.querySelector('.bios-modal-input');
    input.focus();
    input.select();
    overlay.querySelector('.btn-confirm-y').addEventListener('click', () => callback(true));
    overlay.querySelector('.btn-confirm-n').addEventListener('click', () => callback(false));
  }

  renderPasswordEntryModal(title, cancellable, onSubmit, onCancel) {
    const cancel = () => {
      this.closeModal();
      if (onCancel) onCancel();
    };
    const overlay = this.openModal(`
      <div class="bios-modal-box">
        <div class="bios-modal-title">${title}</div>
        <div class="bios-modal-input-wrap">
          <input type="password" class="bios-modal-input" maxlength="8" aria-label="${title}">
        </div>
        <div class="bios-modal-actions">
          <button class="bios-modal-btn btn-pass-ok">OK (Enter)</button>
          ${cancellable ? '<button class="bios-modal-btn btn-pass-cancel">Cancel (Esc)</button>' : ''}
        </div>
      </div>
    `, {
      onEnter: () => onSubmit(input.value.trim()),
      onEscape: cancellable ? cancel : () => {}
    });
    if (!overlay) return;
    const input = overlay.querySelector('.bios-modal-input');
    input.focus();
    overlay.querySelector('.btn-pass-ok').addEventListener('click', () => onSubmit(input.value.trim()));
    const cancelBtn = overlay.querySelector('.btn-pass-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', cancel);
  }

  renderHelpModal(title, htmlContent) {
    const overlay = this.openModal(`
      <div class="bios-modal-box help-box">
        <div class="bios-modal-title">${title}</div>
        <div class="bios-help-body">${htmlContent}</div>
        <div class="bios-modal-actions">
          <button class="bios-modal-btn btn-help-close">Close (Esc)</button>
        </div>
      </div>
    `, { onEnter: () => this.closeModal() });
    if (!overlay) return;
    const btnClose = overlay.querySelector('.btn-help-close');
    btnClose.focus();
    btnClose.addEventListener('click', () => this.closeModal());
  }

  closeModal() {
    this.currentModal = null;
    this.modalHandlers = {};
    [this.setupScreen, this.postScreen].forEach(target => {
      if (target) target.querySelectorAll('.bios-modal-overlay').forEach(m => m.remove());
    });
  }

  handleModalKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (this.modalHandlers.onEscape) this.modalHandlers.onEscape();
      else this.closeModal();
    } else if (e.key === 'Enter' && this.modalHandlers.onEnter && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      this.modalHandlers.onEnter();
    }
  }

  cycleColorTheme() {
    const themes = ['theme-blue', 'theme-amber', 'theme-green', 'theme-mono'];
    const idx = themes.indexOf(this.settings.meta.colorTheme || 'theme-blue');
    this.settings.meta.colorTheme = themes[(idx + 1) % themes.length];
    this.applyTheme(true);
    if (window.soundSys) window.soundSys.playBiosKeyBeep();
  }
}

window.biosEngine = new BiosEngine();
