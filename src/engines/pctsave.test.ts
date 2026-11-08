import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSiliconEmpireData,
  createSiliconEmpireDemoSave,
  parseSaveBuffer,
  repackSaveData,
  applySiliconEmpirePreset,
  verifySaveIntegrity
} from './pctsave';
import { encodeTextToBytes } from './base64';

test('isSiliconEmpireData detects Silicon Empire signatures', () => {
  const demo = createSiliconEmpireDemoSave();
  assert.equal(isSiliconEmpireData(demo), true);

  const generic = { player: { name: 'Player1', level: 5 } };
  assert.equal(isSiliconEmpireData(generic), false);
});

test('parseSaveBuffer and repackSaveData round-trips JSON correctly', async () => {
  const demo = createSiliconEmpireDemoSave();
  const rawBytes = encodeTextToBytes(JSON.stringify(demo), 'utf-8');

  const parsed = await parseSaveBuffer(rawBytes, 'empire_slot1.pctsave');
  assert.equal(parsed.format.isJson, true);
  assert.equal(parsed.format.isSiliconEmpire, true);
  assert.equal(parsed.format.isPctSave, true);

  const repackedBytes = await repackSaveData(parsed.rawParsedData, parsed.format);
  const reParsed = await parseSaveBuffer(repackedBytes, 'empire_slot1.pctsave');
  assert.deepEqual(reParsed.rawParsedData, demo);
});

test('applySiliconEmpirePreset correctly boosts resources and nanobots', () => {
  const demo = createSiliconEmpireDemoSave() as Record<string, any>;
  const modified = applySiliconEmpirePreset(demo, 'max-resources') as Record<string, any>;
  assert.equal(modified.resources.credits, 999999999);
  assert.equal(modified.resources.silicon, 999999999);

  const nanobotsBoost = applySiliconEmpirePreset(demo, 'nanobots-swarm') as Record<string, any>;
  assert.equal(nanobotsBoost.resources.nanobots, 50000000);
});

test('verifySaveIntegrity reports valid round-trip match', async () => {
  const demo = createSiliconEmpireDemoSave();
  const rawBytes = encodeTextToBytes(JSON.stringify(demo), 'utf-8');
  const parsed = await parseSaveBuffer(rawBytes, 'test.pctsave');

  const verification = await verifySaveIntegrity(rawBytes, parsed.rawParsedData, parsed.format);
  assert.equal(verification.isValid, true);
  assert.equal(verification.roundTripMatch, true);
  assert.equal(verification.errors.length, 0);
});
