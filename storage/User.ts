import * as Db from "../contexts/db/index";
import * as Option from "../option";

const User = {
  db: new Map(),
  get: (id: Db.User.User["id"]): Option.Option<Db.User.User> => {
    if (!User.db.has(id)) return Option.None;
    const user = User.db.get(id);
    return Option.Some(user);
  },
};

export { User };
