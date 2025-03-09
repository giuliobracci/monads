type NonNullable<A> = Exclude<A, null | undefined>;

/**
 * @description `Option` Sum Type
 */
type Option<A> = Some<A> | None;

/**
 * @description `Some<A>` represents presence of a value.
 */
interface Some<A> {
  readonly _tag: "Some";
  readonly value: NonNullable<A>;
}

/**
 * @description `None` represents absence of value.
 */
interface None {
  readonly _tag: "None";
  readonly value: undefined;
}

/**
 * @description `None` singleton.
 * @category Constructors
 */
const None: None = {
  _tag: "None",
  value: undefined,
};

/**
 * @description Some constructor. Constructs a `Some<A>`
 * @category Constructors
 */
const Some = <A>(value: Exclude<A, null | undefined>): Some<A> => ({
  _tag: "Some",
  value,
});

/**
 * @description constructs an `Option<A>` from a nullable value.
 * @category Constructors
 */
const fromNullable = <A>(value: A | null | undefined): Option<A> => {
  return value == null ? None : Some(value);
};

/**
 * @description Checks if an Option<A> is a `Some<A>`
 * @category Predicates
 */
const isSome = <A>(option: Option<A>): option is Some<A> =>
  option._tag === "Some";

/**
 * @description Checks if an Option<A> is a `None`
 * @category Predicates
 */
const isNone = <A>(option: Option<A>): option is None => option._tag === "None";

/**
 * @description A `map` implementation with arity of `2`
 * @category Transformations
 */
const bimap = <A, B>(option: Option<A>, fn: (a: A) => B): Option<B> => {
  if (isNone(option)) return option;
  const b = fn(option.value);
  if (b == null) return None;
  return Some(b);
};

/**
 * @description The default exposed curried `map` implementation.
 * @category Transformations
 */
const map =
  <A, B>(fn: (a: A) => B) =>
  (o: Option<A>) =>
    bimap(o, fn);

/**
 * @description The curried flatMap implementation.
 * @category Transformations
 */
const flatMap =
  <A, B>(fn: (a: A) => Option<B>) =>
  (o: Option<A>) =>
    isSome(o) ? fn(o.value) : o;

/**
 * @description Get the internal value from the `Option<A>` or execute a fallback function in case of a `None`.
 * @category Unwrappers
 */
const getOrElse = <A, B>(a: Option<A>, orElse: () => B) => {
  if (isNone(a)) return orElse();
  return a.value;
};

export {
  Option,
  Some,
  None,
  isNone,
  isSome,
  flatMap,
  map,
  getOrElse,
  fromNullable,
};
