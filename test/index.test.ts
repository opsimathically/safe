import test from 'node:test';
import assert from 'node:assert';
import { safe } from '@src/index';

class ExpectedError extends Error {}
class UnexpectedError extends Error {}

test('safe handles async success and async throw.', async function () {
  const [success_error, success_result] = await safe(
    async (): Promise<string> => {
      return 'test_ok';
    }
  )();
  assert.ok(!success_error, 'Expected no error, but got one.');
  assert.equal(success_result, 'test_ok', 'Result expectation mismatch.');

  const [failure_error, failure_result] = await safe(
    async (): Promise<string> => {
      throw new Error('moooo');
    }
  )();
  assert.ok(failure_error, 'Expected error, but none retrieved.');
  assert.ok(!failure_result, 'Expected no result data, but got data.');
});

test('safe handles sync success and sync throw.', function () {
  const [success_error, success_result] = safe((): number => 123)();
  assert.ok(!success_error, 'Expected no error from sync success.');
  assert.equal(success_result, 123, 'Unexpected sync result value.');

  const [failure_error, failure_result] = safe((): number => {
    throw new Error('sync_fail');
  })();
  assert.ok(failure_error, 'Expected sync throw to be captured.');
  assert.ok(!failure_result, 'Expected no data for captured sync throw.');
});

test('safe forwards parameters into the wrapped action.', function () {
  const add_safe = safe((first_value: number, second_value: number): number => {
    return first_value + second_value;
  });
  const [error, result] = add_safe(2, 3);

  assert.ok(!error, 'Expected no error when adding values.');
  assert.equal(result, 5, 'Wrapped function did not receive parameters.');
});

test('safe catches only configured error types for sync functions.', function () {
  const only_expected_error_safe = safe(
    (): string => {
      throw new ExpectedError('expected');
    },
    [ExpectedError]
  );
  const [captured_error, captured_result] = only_expected_error_safe();
  assert.ok(captured_error instanceof ExpectedError);
  assert.ok(!captured_result);

  const rethrow_safe = safe(
    (): string => {
      throw new UnexpectedError('unexpected');
    },
    [ExpectedError]
  );
  assert.throws(() => rethrow_safe(), UnexpectedError);
});

test(
  'safe catches only configured error types for async functions.',
  async function () {
    const only_expected_error_safe = safe(
      async (): Promise<string> => {
        throw new ExpectedError('expected');
      },
      [ExpectedError]
    );
    const [captured_error, captured_result] = await only_expected_error_safe();
    assert.ok(captured_error instanceof ExpectedError);
    assert.ok(!captured_result);

    const rethrow_safe = safe(
      async (): Promise<string> => {
        throw new UnexpectedError('unexpected');
      },
      [ExpectedError]
    );
    await assert.rejects(() => rethrow_safe(), UnexpectedError);
  }
);

test('safe applies synchronous transformer for caught errors.', function () {
  type transformed_error_t = {
    message: string;
    code: string;
  };

  const wrapped = safe(
    (): string => {
      throw new Error('sync_transform');
    },
    [],
    (error): transformed_error_t => {
      return {
        message: error.message,
        code: 'SYNC'
      };
    }
  );

  const [transformed_error, transformed_result] = wrapped();
  assert.deepEqual(transformed_error, {
    message: 'sync_transform',
    code: 'SYNC'
  });
  assert.ok(!transformed_result);
});

test('safe applies asynchronous transformer for caught errors.', async function () {
  type transformed_error_t = {
    message: string;
    code: string;
  };

  const wrapped = safe(
    async (): Promise<string> => {
      throw new Error('async_transform');
    },
    [],
    async (error): Promise<transformed_error_t> => {
      return {
        message: error.message,
        code: 'ASYNC'
      };
    }
  );

  const [transformed_error, transformed_result] = await wrapped();
  assert.deepEqual(transformed_error, {
    message: 'async_transform',
    code: 'ASYNC'
  });
  assert.ok(!transformed_result);
});

test('safe does not bubble when nested wrappers capture inner errors.', async function () {
  const [error, result] = await safe(async (): Promise<string> => {
    await safe(async (): Promise<void> => {
      throw new Error('inner_failure');
    })();
    return 'test_skip_bubbling';
  })();

  assert.ok(!error, 'Error was bubbled when none should be present.');
  assert.equal(result, 'test_skip_bubbling', 'Mismatch on result data.');
});
