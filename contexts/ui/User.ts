import * as UserEntity from "../../entities/User";

type WithUiFields<T extends UserEntity.User> = T & {
  displayname: `${T["firstname"]} ${T["lastname"]}`;
};

type User = WithUiFields<UserEntity.User>;

const make = (u: UserEntity.User): User => ({
  ...u,
  displayname: `${u.firstname} ${u.lastname}`,
});

export { User, make };
