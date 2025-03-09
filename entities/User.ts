type Id = { id: string };

type Person = {
  firstname: string;
  lastname: string;
  birthdate?: Date;
};

type User = Person & Id;

const make = (
  id: User["id"],
  firstname: User["firstname"],
  lastname: User["lastname"]
) => ({
  id,
  firstname,
  lastname,
});

export { User, make };
