import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTradingState, stateFingerprint } from '../src/storage/stateCompatibility.js';

const initialState = {
  settings: { fx: 5, traderName: 'Trader', motto: 'Plano' },
  workspaces: [{ id: 'base' }, { id: 'lucid' }],
  accounts: [{ id: 'default' }],
  operations: [],
  sessions: [],
  activeSession: null,
  updatedAt: 'initial'
};

test('preserva arrays e campos desconhecidos do documento legado', () => {
  const legacy = {
    settings: { fx: 6 },
    workspaces: [{ id: 'base' }, { id: 'lucid' }],
    accounts: [{ id: 'existing' }],
    operations: [{ id: 'op-1' }],
    sessions: [{ id: 'session-1' }],
    customFutureField: { enabled: true }
  };
  const normalized = normalizeTradingState(legacy, initialState);

  assert.deepEqual(normalized.accounts, legacy.accounts);
  assert.deepEqual(normalized.operations, legacy.operations);
  assert.deepEqual(normalized.sessions, legacy.sessions);
  assert.deepEqual(normalized.customFutureField, legacy.customFutureField);
  assert.deepEqual(normalized.settings, { fx: 6, traderName: 'Trader', motto: 'Plano' });
});

test('mantém a compatibilidade histórica adicionando o workspace Lucid ausente', () => {
  const normalized = normalizeTradingState({ workspaces: [{ id: 'base' }] }, initialState);
  assert.deepEqual(normalized.workspaces.map(item => item.id), ['base', 'lucid']);
});

test('normaliza coleções inválidas sem alterar o formato persistido', () => {
  const normalized = normalizeTradingState({ accounts: null, operations: 'invalid' }, initialState);
  assert.deepEqual(normalized.accounts, []);
  assert.deepEqual(normalized.operations, []);
  assert.equal(normalized.activeSession, null);
});

test('fingerprint é estável para o mesmo estado', () => {
  assert.equal(stateFingerprint(initialState), stateFingerprint(initialState));
});
