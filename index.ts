import * as Option from "./option";
import * as Either from "./either";
import * as User from "./entities/User";
import * as Db from "./contexts/db";

import { pipe } from "./utils/pipe";

const fakeUser: User.User = User.make("test-id", "John", "Doe");

const getUserRandomly = (): User.User | null =>
  Math.random() <= 0.5 ? fakeUser : null;

const getUserEither = (): Either.Either<string, User.User> =>
  Math.random() >= 0.5
    ? Either.Left("An error as occurred while getting the User")
    : Either.Right(fakeUser);

/**
 * Option.map example.
 */
const dbUserOption: Option.Option<Db.User.User> = pipe(
  Option.fromNullable(getUserRandomly()),
  Option.map(({ firstname, lastname, ...rest }) =>
    Db.User.make({
      ...rest,
      firstname: firstname.trim(),
      lastname: lastname.trim(),
    })
  )
);

/**
 * Option.flatMap example.
 */
const userBirthdateOption = pipe(
  Option.fromNullable(getUserRandomly()),
  Option.flatMap((u) => Option.fromNullable(u.birthdate))
);

/**
 * Either example.
 */
const eitherUserId = pipe(
  getUserEither(),
  Either.map((u) => +u.firstname),
  Either.mapLeft((u) => u.toUpperCase())
);
