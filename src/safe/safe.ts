// Tuple-style result used throughout this wrapper:
// [error, data] where exactly one entry is non-null.
type Result<ResponseType, ErrorType> = [ErrorType, null] | [null, ResponseType];

// Conditional helper that preserves whether the wrapped action is sync or async.
// - sync action => returns Result directly
// - async action => returns Promise<Result>
type Safe<
  ActionType extends (...args: unknown[]) => unknown,
  ErrorType = Error
> =
  ReturnType<ActionType> extends Promise<infer ResponseType>
    ? (
        ...args: Parameters<ActionType>
      ) => Promise<Result<ResponseType, ErrorType>>
    : (
        ...args: Parameters<ActionType>
      ) => Result<ReturnType<ActionType>, ErrorType>;

// Used for runtime instanceof checks when deciding which errors to catch.
type ErrorConstructor = new (...args: any[]) => Error;

// Normalizes output to the [error, data] tuple.
const response = <ResponseType, ErrorType = Error>({
  error,
  data
}: {
  error?: ErrorType;
  data?: ResponseType;
}): Result<ResponseType, ErrorType> =>
  error ? [error as ErrorType, null] : [null, data as ResponseType];

// Detects true Promises and Promise-like values ("thenables").
const promised = <PromiseType>(
  result: PromiseType | PromiseLike<PromiseType>
): result is Promise<PromiseType> =>
  result instanceof Promise ||
  (result !== null &&
    typeof result === 'object' &&
    'then' in result &&
    typeof result.then === 'function');

// Applies an optional error transformer and wraps transformed output as [error, null].
// Supports transformers that are sync or async.
const transform =
  <TransformedErrorType = Error>(
    transformer: (
      error: Error
    ) => Promise<TransformedErrorType> | TransformedErrorType
  ) =>
  (
    error: Error
  ):
    | Promise<Result<null, TransformedErrorType>>
    | Result<null, TransformedErrorType> => {
    const transformed = transformer(error);

    if (promised(transformed)) {
      // If transform is async, wait and then normalize.
      return transformed.then((value) => response({ error: value }));
    }

    return response({ error: transformed });
  };

// Centralized error handling:
// - catches all errors when no types are provided
// - catches only matching error types when provided
// - optionally transforms caught errors
// - rethrows non-matching errors
const caught = <ErrorType = Error>(
  error: Error,
  types: ErrorConstructor[] = [],
  transformer?: (error: Error) => Promise<ErrorType> | ErrorType
): Promise<Result<null, ErrorType>> | Result<null, ErrorType> => {
  const returnable =
    !types.length ||
    types.some((type: ErrorConstructor) => error instanceof type);
  // Transformer is optional and only used when callable.
  const transformable =
    transformer !== undefined && typeof transformer === 'function';

  if (returnable) {
    return transformable
      ? transform(transformer)(error)
      : response({ error: error as ErrorType });
  }

  throw error;
};

// Main wrapper:
// executes an action and always returns [error, data] for caught errors,
// while preserving original parameter and return types.
const safe = <ActionType extends (...args: any[]) => any, ErrorType = Error>(
  action: ActionType,
  types: ErrorConstructor[] = [],
  transformer?: (error: Error) => Promise<ErrorType> | ErrorType
): Safe<ActionType, ErrorType> =>
  ((...args: Parameters<ActionType>) => {
    try {
      const result = action(...args);

      // For async actions, convert resolved values and caught rejections
      // to the same tuple format.
      if (promised(result)) {
        return result
          .then(
            (
              data: ReturnType<ActionType>
            ): Result<ReturnType<ActionType>, Error> => response({ data })
          )
          .catch((error: Error) => caught(error, types, transformer));
      }

      return response({ data: result });
    } catch (error) {
      // Handles synchronous throws from action invocation.
      return caught(error as Error, types, transformer);
    }
  }) as Safe<ActionType, ErrorType>;

export { safe };
