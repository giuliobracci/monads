import * as User from "./User";

type WithStorageFields<T extends object> = T & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export { WithStorageFields, User };
