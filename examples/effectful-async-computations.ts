import * as Task from "../task";
import * as Either from "../either";
import * as Schema from "../validation";
import { pipe } from "../utils/pipe";

type Runtime = {
  dependencies: Dependencies;
};

type Dependencies = {
  logger: {
    info: (msg: any) => void;
    log: (msg: any) => void;
    debug: (msg: any) => void;
    error: (msg: any, error: unknown) => void;
  };
};

type NotFound = Error & { status: 404 };
type ParseError = Error & { status: 400 };
type HttpError = Error & { status: 500 };
type TodoError = Error | NotFound | ParseError;

type Todo = Schema.Decoded<typeof Todo>;
type EncodedTodo = Schema.Encoded<typeof Todo>;

const Todo = Schema.Struct({
  userId: Schema.Number,
  id: Schema.Number,
  title: Schema.String,
  completed: Schema.Boolean,
});

const MyTodo: Todo = Todo.make({
  userId: 1,
  id: 2,
  title: "My Todo",
  completed: false,
});

const dependencies: Dependencies = {
  logger: {
    info: (msg: string) => {
      console.info(`[INFO]: ${msg}`);
    },
    log: (msg: string) => {
      console.log(`[LOG]: ${msg}`);
    },
    debug: (msg: string) => {
      console.debug(`[DEBUG]: ${msg}`);
    },
    error: (msg: string, error: unknown) => {
      console.error(`[ERROR]: ${msg}`, error);
    },
  },
};

const getTodo = (identity: `${number}`) =>
  Task.from<Dependencies, TodoError, Todo>(async () => {
    const res = await fetch(
      `https://jsonplaceholder.typicode.com/todos/${identity}`
    );
    return res.json();
  });

const App = async ({ dependencies }: Runtime) => {
  const { logger } = dependencies;
  const todo = await pipe(
    getTodo("10"),
    Task.map(Todo.decode),
    Task.fork(dependencies)
  );
  logger.info(JSON.stringify(todo));
};

App({ dependencies });
