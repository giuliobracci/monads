import { Either, isRight, Left, Right } from "./either";

type Reader<E, A> = (runtime: E) => A;

type TaskEither<L, R> = () => Promise<Either<L, R>>;

type ReaderTaskEither<E, L, R> = Reader<E, TaskEither<L, R>>;

const map =
  <E, L, R, B>(f: (r: R) => B) =>
  (
    readerTaskEither: ReaderTaskEither<E, L, R>
  ): ReaderTaskEither<E, L, B> =>
  (runtime: E) =>
  async () => {
    const result = await readerTaskEither(runtime)();
    if (isRight(result)) {
      return Right(f(result.right));
    }
    return result;
  };

const fork =
  <E, L, R>(runtime: E) =>
  (readerTaskEither: ReaderTaskEither<E, L, R>): Promise<Either<L, R>> =>
    readerTaskEither(runtime)();

const flatMap =
  <E, L, R, B>(f: (r: R) => ReaderTaskEither<E, L, B>) =>
  (
    readerTaskEither: ReaderTaskEither<E, L, R>
  ): ReaderTaskEither<E, L, B> =>
  (runtime: E) =>
  async () => {
    const computation = await readerTaskEither(runtime)();
    if (isRight(computation)) {
      return f(computation.right)(runtime)();
    }
    return computation;
  };

const from = <E, L, R>(
  f: (runtime: E) => Promise<R>
): ReaderTaskEither<E, L, R> => {
  return (runtime: E) => async () => {
    try {
      const computation = await f(runtime);
      return Right(computation);
    } catch (e) {
      return Left(e as L);
    }
  };
};

export { ReaderTaskEither, TaskEither, map, flatMap, fork, from, Reader };
