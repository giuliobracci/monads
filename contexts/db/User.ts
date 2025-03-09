import * as UserEntity from "../../entities/User";
import * as Db from ".";

type User = Db.WithStorageFields<UserEntity.User>;

const make = (
  user: UserEntity.User
): Db.WithStorageFields<UserEntity.User> => ({
  ...user,
  createdAt: new Date().toUTCString(),
  updatedAt: new Date().toUTCString(),
});

export { make, User };
