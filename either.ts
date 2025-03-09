/**
 * @description `Either` Sum Type
 */
type Either<L, R> = Left<L> | Right<R>;

/**
 * @description `Left<L>` interface. The Left constructor is used to provide an error feedback about the computation.
 * If we return a `Left<L>` from a computation that `may` fail, we will comunicate to the consumer that the computation did not happen successfully.
 */
interface Left<L> {
  readonly _tag: "Left";
  readonly left: L;
}

/**
 * @description `Right<R>` interface. The Right constructor is used to provide a success feedback about the computation.
 * If we return a `Right<R>` from a computation that `may` fail, we will comunicate to the consumer that the computation did happen successfully.
 */
interface Right<R> {
  readonly _tag: "Right";
  readonly right: R;
}

/**
 * @description The `Right<R>` constructor.
 * @category Constructors
 */
const Right = <R>(v: R): Right<R> => ({
  _tag: "Right",
  right: v,
});

/**
 * @description The `Left<L>` constructor.
 * @category Constructors
 */
const Left = <L>(v: L): Left<L> => ({
  _tag: "Left",
  left: v,
});

/**
 * @description Predicate to check wheter the current Either is a Right
 * @category Predicates
 */
const isRight = <L, R>(e: Either<L, R>): e is Right<R> => e._tag === "Right";

/**
 * @description Predicate to check wheter the current Either is a Left
 * @category Predicates
 */
const isLeft = <L, R>(e: Either<L, R>): e is Left<L> => e._tag === "Left";

/**
 * @description Curried implementation of map. Maps the `Right<R>` channel with a given function.
 * @category Transformations
 */
const map =
  <L, R, R1>(fn: (e: R) => R1) =>
  (e: Either<L, R>): Either<L, R1> => {
    if (isLeft(e)) return e;
    const computation = fn(e.right);
    return Right(computation);
  };

/**
 * @description Curried implementation of mapLeft. Maps the `Left<L>` channel with a given function.
 * @category Transformations
 */
const mapLeft =
  <L, R, L1>(fn: (e: L) => L1) =>
  (e: Either<L, R>): Either<L1, R> => {
    if (isRight(e)) return e;
    const computation = fn(e.left);
    return Left(computation);
  };

/**
 * @description Curried implementation of flatMap. Maps the `Right<R>` channel with a given function that returns an Either.
 * @category Transformations
 */
const flatMap =
  <L, R, R1>(fn: (e: R) => Either<L, R1>) =>
  (either: Either<L, R>) => {
    if (isLeft(either)) return either;
    return fn(either.right);
  };

export { Either, Right, Left, isLeft, isRight, map, mapLeft, flatMap };
