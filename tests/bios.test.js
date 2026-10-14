const assert = require('assert');
const fs = require('fs');
const path = require('path');

const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.window = {
  soundSys: {
    playPostBeep: () => {},
    playBiosKeyBeep: () => {},
    playBiosErrorBeep: () => {},
    playFloppySeekSound: () => {},
    playSystemHaltedBeep: () => {}
  }
};
global.localStorage = mockLocalStorage;
global.document = {
  getElementById: () => null,
  addEventListener: () => {},
  removeEventListener: () => {}
};

const biosCode = fs.readFileSync(path.join(__dirname, '../js/bios.js'), 'utf8');
eval(biosCode);

const bios = window.biosEngine;
const resetBios = () => {
  mockLocalStorage.clear();
  bios.settings = bios.clone(bios.defaultSettings);
  bios.accessLevel = 'supervisor';
  bios.activeSubmenu = null;
  bios.submenuRowIndex = 0;
};

let passed = 0;
const test = (name, fn) => {
  resetBios();
  fn();
  passed++;
  console.log(`PASS ${passed}. ${name}`);
};

console.log('--- Testing Award Modular BIOS v4.51PG Engine ---');

test('Defaults are configured', () => {
  assert.strictEqual(bios.settings.standard.floppyA, '1.44M, 3.5 in.');
  assert.strictEqual(bios.settings.features.quickPost, 'Enabled');
  assert.strictEqual(bios.settings.chipset.cpuHostClock, '100 MHz');
  assert.strictEqual(bios.settings.peripherals.onboardAudio, 'Enabled');
  assert.strictEqual(bios.settings.standard.priMaster.type, 'Auto');
});

test('CMOS settings persist to localStorage', () => {
  bios.settings.chipset.cpuHostClock = '133 MHz';
  bios.settings.features.bootSequence = 'CDROM, C, A';
  bios.saveSettings();
  const parsed = JSON.parse(mockLocalStorage.getItem('win98_bios_settings'));
  assert.strictEqual(parsed.chipset.cpuHostClock, '133 MHz');
  const reloaded = bios.loadSettings();
  assert.strictEqual(reloaded.chipset.cpuHostClock, '133 MHz');
  assert.strictEqual(reloaded.features.bootSequence, 'CDROM, C, A');
});

test('Legacy stored drive objects merge with new defaults', () => {
  mockLocalStorage.setItem('win98_bios_settings', JSON.stringify({
    standard: { dateOverride: null, priMaster: { type: 'None', size: 0, cyl: 0 } },
    features: { quickPost: 'Disabled' }
  }));
  const loaded = bios.loadSettings();
  assert.strictEqual(loaded.standard.priMaster.type, 'None');
  assert.strictEqual(loaded.standard.secMaster.type, 'CD-ROM');
  assert.strictEqual(loaded.features.quickPost, 'Disabled');
  assert.strictEqual(loaded.features.bootSequence, 'A, C, SCSI');
});

test('CPU frequency follows FSB and multiplier', () => {
  let cpu = bios.getEffectiveCpuSpecs();
  assert.strictEqual(cpu.frequency, 450);
  assert.strictEqual(cpu.pciClock, 33);
  bios.settings.chipset.cpuHostClock = '112 MHz';
  cpu = bios.getEffectiveCpuSpecs();
  assert.strictEqual(cpu.frequency, 504);
  assert(cpu.name.includes('Overclocked'));
  bios.settings.chipset.cpuHostClock = '133 MHz';
  cpu = bios.getEffectiveCpuSpecs();
  assert.strictEqual(cpu.frequency, 600);
  assert(cpu.name.includes('Pentium(R) III'));
  assert.strictEqual(cpu.pciClock, 44);
  bios.settings.chipset.cpuHostClock = '66 MHz';
  cpu = bios.getEffectiveCpuSpecs();
  assert(cpu.name.includes('Celeron'));
  assert.strictEqual(cpu.pciClock, 33);
});

test('Every submenu schema is complete', () => {
  ['standard', ...bios.featurePages].forEach(page => {
    const schema = bios.schemas[page];
    assert(Array.isArray(schema) && schema.length > 4, `${page} must have options`);
    schema.forEach(opt => {
      assert.strictEqual(typeof opt.label, 'string');
      assert.strictEqual(typeof opt.desc, 'string');
      if (opt.readOnly) return;
      assert(opt.options.length >= 2, `${opt.key} needs choices`);
      assert(opt.options.includes(bios.getOptionValue(page, opt)), `${page}.${opt.key} default must be a listed option`);
      if (opt.requires) assert(bios.findOption(opt.requires.page, opt.requires.key), `${opt.key} depends on a known option`);
    });
  });
});

test('Option cycling wraps in both directions', () => {
  bios.activeSubmenu = 'features';
  bios.submenuRowIndex = 0;
  bios.cycleCurrentOption(1);
  assert.strictEqual(bios.settings.features.virusWarning, 'Enabled');
  bios.cycleCurrentOption(1);
  assert.strictEqual(bios.settings.features.virusWarning, 'Disabled');
  bios.cycleCurrentOption(-1);
  assert.strictEqual(bios.settings.features.virusWarning, 'Enabled');
});

test('Standard CMOS drive type cycles through the schema', () => {
  bios.activeSubmenu = 'standard';
  bios.submenuRowIndex = bios.schemas.standard.findIndex(o => o.key === 'priMaster');
  bios.cycleCurrentOption(1);
  assert.strictEqual(bios.settings.standard.priMaster.type, 'User');
  bios.cycleCurrentOption(1);
  assert.strictEqual(bios.settings.standard.priMaster.type, 'None');
  bios.submenuRowIndex = 0;
  const before = JSON.stringify(bios.settings);
  bios.cycleCurrentOption(1);
  assert.strictEqual(JSON.stringify(bios.settings), before, 'date row is read only');
});

test('Dependent options are locked until the parent enables them', () => {
  bios.activeSubmenu = 'features';
  bios.submenuRowIndex = bios.schemas.features.findIndex(o => o.key === 'typematicRate');
  const rateOpt = bios.schemas.features[bios.submenuRowIndex];
  assert(bios.getLockReason(rateOpt).includes('Typematic Rate Setting'));
  bios.cycleCurrentOption(1);
  assert.strictEqual(bios.settings.features.typematicRate, '30');
  bios.settings.features.typematicRateSetting = 'Enabled';
  assert.strictEqual(bios.getLockReason(rateOpt), null);
  bios.cycleCurrentOption(1);
  assert.strictEqual(bios.settings.features.typematicRate, '6');
  const lptMode = bios.findOption('peripherals', 'parallelPortMode');
  bios.settings.peripherals.parallelPort = 'Disabled';
  assert(bios.getLockReason(lptMode).includes('not Disabled'));
});

test('Onboard audio flag drives Win 98 sound and the PCI list', () => {
  assert.strictEqual(bios.isAudioEnabled(), true);
  assert(bios.getPciDevices().some(d => d.cls === 'Multimedia Device'));
  bios.settings.peripherals.onboardAudio = 'Disabled';
  assert.strictEqual(bios.isAudioEnabled(), false);
  assert(!bios.getPciDevices().some(d => d.cls === 'Multimedia Device'));
  bios.settings.pnpPci.assignIrqVga = 'Disabled';
  assert.strictEqual(bios.getPciDevices().find(d => d.cls === 'Display Controller').irq, 'NA');
});

test('Boot device resolution follows drives, IDE and boot sequence', () => {
  assert.strictEqual(bios.resolveBootDevice().device, 'C');
  bios.settings.features.bootSequence = 'CDROM, C, A';
  let boot = bios.resolveBootDevice();
  assert.strictEqual(boot.device, 'C');
  assert.strictEqual(boot.attempts.length, 1);
  bios.settings.standard.priMaster.type = 'None';
  assert.strictEqual(bios.resolveBootDevice().device, null);
  bios.settings.standard.priSlave.type = 'Auto';
  assert.strictEqual(bios.resolveBootDevice().device, 'C');
  bios.settings.peripherals.onChipPrimaryIde = 'Disabled';
  assert.strictEqual(bios.resolveBootDevice().device, null);
  bios.settings.peripherals.onChipPrimaryIde = 'Enabled';
  bios.settings.peripherals.onChipSecondaryIde = 'Disabled';
  boot = bios.resolveBootDevice();
  assert.strictEqual(boot.attempts.length, 0, 'CD-ROM on disabled channel is not tried');
});

test('Password access levels', () => {
  assert.strictEqual(bios.hasAnyPassword(), false);
  bios.settings.security.userPassword = 'GUEST';
  assert.strictEqual(bios.hasAnyPassword(), true, 'user password alone must be enforced');
  assert.strictEqual(bios.getPasswordAccess('GUEST'), 'supervisor', 'without supervisor the user password gives full access');
  bios.settings.security.supervisorPassword = 'AWARD';
  assert.strictEqual(bios.getPasswordAccess('AWARD'), 'supervisor');
  assert.strictEqual(bios.getPasswordAccess('GUEST'), 'user');
  assert.strictEqual(bios.getPasswordAccess('WRONG'), null);
  bios.accessLevel = 'user';
  assert.strictEqual(bios.isMainItemLocked('chipset'), true);
  assert.strictEqual(bios.isMainItemLocked('userPass'), false);
  bios.activateMainMenuItem('chipset');
  assert.strictEqual(bios.activeSubmenu, null, 'user level cannot open feature pages');
});

test('Loading defaults keeps passwords, theme and drives', () => {
  bios.settings.security.supervisorPassword = 'AWARD';
  bios.settings.meta.colorTheme = 'theme-green';
  bios.settings.standard.priSlave.type = 'Auto';
  bios.settings.chipset.cpuHostClock = '150 MHz';
  bios.applyDefaults('SETUP');
  assert.strictEqual(bios.settings.security.supervisorPassword, 'AWARD');
  assert.strictEqual(bios.settings.meta.colorTheme, 'theme-green');
  assert.strictEqual(bios.settings.standard.priSlave.type, 'Auto');
  assert.strictEqual(bios.settings.chipset.cpuHostClock, '100 MHz');
});

test('BIOS defaults are fail-safe and differ from setup defaults', () => {
  bios.applyDefaults('BIOS');
  assert.strictEqual(bios.settings.features.quickPost, 'Disabled');
  assert.strictEqual(bios.settings.chipset.sdramCasLatency, '3');
  bios.applyDefaults('SETUP', 'chipset');
  assert.strictEqual(bios.settings.chipset.sdramCasLatency, '2');
  assert.strictEqual(bios.settings.features.quickPost, 'Disabled', 'page defaults touch only that page');
});

test('Old values restore only the current page', () => {
  bios.saveSettings();
  bios.settings.chipset.cpuHostClock = '133 MHz';
  bios.settings.power.dozeMode = '1 Min';
  bios.restorePageFromCmos('chipset');
  assert.strictEqual(bios.settings.chipset.cpuHostClock, '100 MHz');
  assert.strictEqual(bios.settings.power.dozeMode, '1 Min');
});

test('Unsaved change counter', () => {
  bios.saveSettings();
  assert.strictEqual(bios.countUnsavedChanges(), 0);
  bios.settings.chipset.cpuHostClock = '133 MHz';
  bios.settings.standard.priMaster.type = 'None';
  assert.strictEqual(bios.countUnsavedChanges(), 2);
  bios.saveSettings();
  assert.strictEqual(bios.countUnsavedChanges(), 0);
});

test('Clear CMOS wipes passwords', () => {
  bios.settings.security.supervisorPassword = 'AWARD';
  bios.saveSettings();
  bios.clearCmos();
  assert.strictEqual(bios.loadSettings().security.supervisorPassword, '');
});

console.log(`ALL ${passed} AWARD BIOS TESTS PASSED!`);
