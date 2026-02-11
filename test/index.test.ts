import test from 'node:test';
import assert from 'node:assert';
import { safe } from '@src/index';
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%% Test Definitions %%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

test('Error handling tests.', async function () {
  const [error, result] = await safe(async (): Promise<string> => {
    return 'test_ok';
  })();
  assert.ok(!error, 'Expected no error, but got one.');
  assert.ok(result === 'test_ok', 'Result expectation mismatch.');

  const [error2, result2] = await safe(async (): Promise<string> => {
    throw Error('moooo');
    return 'test_fail';
  })();
  assert.ok(error2, 'Expected error, but none retrieved.');
  assert.ok(!result2, 'Expected no result data, but got data.');
});
