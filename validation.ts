import * as Either from "./either";

interface ValidationError {
  path?: string[]; // Location in the data where the error occurred
  code: string; // Error code (e.g., "invalid_type", "required")
  message: string; // Human-readable error message
  input: unknown; // The value that failed validation
}

// Core types
type Validation<A> = Either.Either<ReadonlyArray<ValidationError>, A>;
type Guard<T> = (a: unknown) => a is T;
type Refinement<T> = (a: T) => boolean;
type Decoded<T extends Schema<any, any>> = T["Decoded"];
type Encoded<T extends Schema<any, any>> = T["Encoded"];

/**
 * Enhanced Schema interface with encoding support and structured errors
 */
interface Schema<I, O> {
  // Type markers for TypeScript
  readonly Encoded: I; // Input type (what it encodes to)
  readonly Decoded: O; // Output type (what it decodes to)

  // Decoding (validation)
  decode: (data: unknown) => Validation<O>;

  // Encoding (serialization)
  encode: (value: O) => I;

  // Convenient parsing with exception handling
  make: (data: I) => O;
}

/**
 * Creates a primitive schema with encoding support
 */
const makePrimitive = <T>(
  guard: Guard<T>,
  typeName: string,
  encoder: (value: T) => T = (x) => x
): Schema<T, T> => {
  return {
    Encoded: null as unknown as T,
    Decoded: null as unknown as T,

    decode: (data: unknown): Validation<T> => {
      if (guard(data)) {
        return Either.Right(data);
      }
      return Either.Left([
        {
          code: "invalid_type",
          message: `Expected ${typeName}, received ${typeof data}`,
          input: data,
        },
      ]);
    },

    encode: encoder,

    make: (data: unknown): T => {
      const result = guard(data);
      if (!result) {
        throw new Error(
          `Validation failed: Expected ${typeName}, received ${typeof data}`
        );
      }
      return data;
    },
  };
};

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type InferEncodedStruct<T extends Record<string, Schema<any, any>>> =
  Expand<{
    [K in keyof T]: T[K]["Encoded"];
  }>;

type InferDecodedStruct<T extends Record<string, Schema<any, any>>> =
  Expand<{
    [K in keyof T]: T[K]["Decoded"];
  }>;

const Struct = <T extends Record<string, Schema<any, any>>>(
  validators: T
): Schema<InferEncodedStruct<T>, InferDecodedStruct<T>> => {
  const decode = (data: unknown): Validation<InferDecodedStruct<T>> => {
    if (typeof data !== "object" || data === null) {
      return Either.Left([
        {
          code: "invalid_type",
          message: `Expected object, received ${
            data === null ? "null" : typeof data
          }`,
          input: data,
        },
      ]);
    }

    const obj = data as Record<string, unknown>;
    const result: Record<string, any> = {};
    const errors: ValidationError[] = [];

    for (const key in validators) {
      if (Object.prototype.hasOwnProperty.call(validators, key)) {
        const validator = validators[key];
        const value = obj[key];

        if (value === undefined) {
          errors.push({
            path: [key],
            code: "required",
            message: `Required field ${key} is missing`,
            input: undefined,
          });
          continue;
        }

        const validation = validator.decode(value);

        if (Either.isRight(validation)) {
          result[key] = validation.right;
        } else {
          // Add the current key to the path of nested errors
          errors.push(
            ...validation.left.map((err) => ({
              ...err,
              path: [key, ...(err.path || [])],
            }))
          );
        }
      }
    }

    if (errors.length > 0) {
      return Either.Left(errors);
    }

    return Either.Right(result as InferDecodedStruct<T>);
  };

  const encode = (value: InferDecodedStruct<T>): InferEncodedStruct<T> => {
    const result: Partial<Record<string, any>> = {};

    const keys = Object.keys(validators) as Array<keyof T>;

    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const validator = validators[key];
        const propertyValue = value[key as keyof typeof value];

        if (propertyValue !== undefined) {
          result[key as string] = validator.encode(propertyValue);
        }
      }
    }

    return result as InferEncodedStruct<T>;
  };

  return {
    Encoded: null as unknown as InferEncodedStruct<T>,
    Decoded: null as unknown as InferDecodedStruct<T>,

    decode,
    encode,

    make: (data: unknown): InferDecodedStruct<T> => {
      const result = decode(data);
      if (Either.isLeft(result)) {
        const errorsFormatted = result.left
          .map((err) => {
            const pathStr = err.path ? err.path.join(".") : "";
            return `${pathStr ? pathStr + ": " : ""}${err.message}`;
          })
          .join(", ");
        throw new Error(`Validation failed: ${errorsFormatted}`);
      }
      return result.right;
    },
  };
};

/**
 * Create primitive schema types with encoding support
 */
const String = makePrimitive<string>(
  (a: unknown): a is string => typeof a === "string",
  "string"
);

const Number = makePrimitive<number>(
  (a: unknown): a is number => typeof a === "number",
  "number"
);

const Boolean = makePrimitive<boolean>(
  (a: unknown): a is boolean => typeof a === "boolean",
  "boolean"
);

const True = makePrimitive<true>(
  (a: unknown): a is true => typeof a === "boolean" && a === true,
  "true"
);

const False = makePrimitive<false>(
  (a: unknown): a is false => typeof a === "boolean" && a === false,
  "boolean"
);

const Null = makePrimitive<null>(
  (a: unknown): a is null => a === null,
  "null"
);

const Undefined = makePrimitive<undefined>(
  (a: unknown): a is undefined => a === undefined,
  "undefined"
);

const Literal = <const T>(literal: T): Schema<T, T> => {
  return {
    Encoded: literal,
    Decoded: literal,

    decode: (data: unknown): Validation<T> => {
      if (data === literal) {
        return Either.Right(literal);
      }

      return Either.Left([
        {
          code: "invalid_literal",
          message: `Expected ${JSON.stringify(
            literal
          )}, received ${JSON.stringify(data)}`,
          input: data,
        },
      ]);
    },

    encode: (value: T): T => {
      if (value !== literal) {
        throw new Error(
          `Cannot encode: Expected ${JSON.stringify(
            literal
          )}, received ${JSON.stringify(value)}`
        );
      }
      return value;
    },

    make: (data: unknown): T => {
      if (data !== literal) {
        throw new Error(
          `Validation failed: Expected ${JSON.stringify(
            literal
          )}, received ${JSON.stringify(data)}`
        );
      }
      return literal;
    },
  };
};

/**
 * Creates a schema that transforms the output of another schema
 */
const transform = <I, A, B>(
  schema: Schema<I, A>,
  transformer: (a: A) => B,
  reverseTransformer: (b: B) => A
): Schema<I, B> => {
  const decode = (data: unknown): Validation<B> => {
    const result = schema.decode(data);

    if (Either.isLeft(result)) {
      return result as Validation<B>;
    }

    try {
      return Either.Right(transformer(result.right));
    } catch (error: unknown) {
      return Either.Left([
        {
          code: "transform_error",
          message: `Transformation error: ${(error as Error).message}`,
          input: result.right,
        },
      ]);
    }
  };

  return {
    Encoded: schema.Encoded,
    Decoded: null as unknown as B,

    decode,

    encode: (value: B): I => {
      try {
        return schema.encode(reverseTransformer(value));
      } catch (error: unknown) {
        throw new Error(`Encoding error: ${(error as Error).message}`);
      }
    },

    make: (data: unknown): B => {
      const result = decode(data);
      if (Either.isLeft(result)) {
        const errorMessage = result.left
          .map((err) => err.message)
          .join(", ");
        throw new Error(`Validation failed: ${errorMessage}`);
      }
      return result.right;
    },
  };
};

/**
 * Creates a schema for validating arrays where each element
 * conforms to the item schema
 */
const List = <I, O>(itemSchema: Schema<I, O>): Schema<I[], O[]> => {
  const decode = (data: unknown): Validation<O[]> => {
    if (!Array.isArray(data)) {
      return Either.Left([
        {
          code: "invalid_type",
          message: `Expected array, received ${typeof data}`,
          input: data,
        },
      ]);
    }

    const results: O[] = [];
    const errors: ValidationError[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const validation = itemSchema.decode(item);

      if (Either.isRight(validation)) {
        results.push(validation.right);
      } else {
        // Add array index to error path
        errors.push(
          ...validation.left.map((err) => ({
            ...err,
            path: [`${i}`, ...(err.path || [])],
          }))
        );
      }
    }

    if (errors.length > 0) {
      return Either.Left(errors);
    }

    return Either.Right(results);
  };

  return {
    Encoded: [] as I[],
    Decoded: [] as O[],

    decode,

    encode: (value: O[]): I[] => {
      return value.map((item) => itemSchema.encode(item));
    },

    make: (data: unknown): O[] => {
      const result = decode(data);
      if (Either.isLeft(result)) {
        const errorMessage = result.left
          .map((err) => {
            const pathStr = err.path ? err.path.join(".") : "";
            return `${pathStr ? pathStr + ": " : ""}${err.message}`;
          })
          .join(", ");

        throw new Error(`Validation failed: ${errorMessage}`);
      }
      return result.right;
    },
  };
};

type U = typeof User.Decoded;

const User = Struct({
  id: String,
  name: String,
  isEmployed: True,
  permissions: Struct({
    roles: List(Literal("admin")),
  }),
});

const newUser = User.decode({
  id: "123",
  name: "John Doe",
  permissions: {
    roles: ["admin", "user"],
  },
});

const newUser2: U = User.make({
  id: "123",
  name: "John Doe",
  isEmployed: true,
  permissions: {
    roles: ["admin"],
  },
});

if (Either.isLeft(newUser)) {
  console.error("Validation failed:", newUser.left);
}
export {
  ValidationError,
  Schema,
  Validation,
  Guard,
  Refinement,
  InferEncodedStruct,
  InferDecodedStruct,
  Decoded,
  Encoded,
  makePrimitive as createPrimitive,
  Struct,
  String,
  Number,
  Boolean,
  Null,
  Undefined,
  Literal,
  transform,
  List,
};
