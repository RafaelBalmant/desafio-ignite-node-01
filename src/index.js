const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  try {
    const username = request.headers["username"];
    const user = users.find((user) => user.username === username);
    if (!user) {
      return response.send(500);
    }
    next();
  } catch (e) {
    console.log(e);
    return response.send(500);
  }
}

app.post("/users", (request, response) => {
  try {
    const { name, username } = request.body;
    const userAlreadyExists = users.find((user) => user.username === username);
    if (userAlreadyExists) {
      return response.status(400).json({
        error: "user already exists",
      });
    }
    if (name && username) {
      const newUser = {
        id: uuidv4(),
        name,
        username,
        todos: [],
      };
      users.push(newUser);
      return response.json(newUser);
    } else {
      return response.status(400).json({
        error: "name or username not defined",
      });
    }
  } catch (e) {
    console.log(e);
    return response.send(500);
  }
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  try {
    const username = request.headers["username"];
    const user = users.find((user) => user.username === username);
    response.json(user.todos);
  } catch (e) {
    console.log(e);
    return response.send(500);
  }
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  try {
    const username = request.headers["username"];
    const { title, deadline } = request.body;
    const newTodo = {
      id: uuidv4(),
      title,
      deadline: new Date(deadline),
      done: false,
      created_at: new Date(),
    };

    users.forEach((user, index, array) => {
      if (user.username === username) {
        array[index] = {
          ...user,
          todos: [...user.todos, newTodo],
        };
      }
    });
    response.status(201).json(newTodo);
  } catch (e) {
    console.log(e);
    return response.send(500);
  }
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const username = request.headers["username"];

  const { title, deadline } = request.body;
  const updateTodo = {
    title,
    deadline: new Date(deadline),
  };

  const existTodo = users
    .find((user) => user.username === username)
    .todos.find((todo) => todo.id === request.params.id);

  if (!existTodo) {
    return response.status(404).json({
      error: "Not Found",
    });
  }
  users.forEach((user, index, array) => {
    if (user.username === username) {
      array[index] = {
        ...user,
        todos: user.todos.map((todo) => {
          if (todo.id === request.params.id) {
            return {
              ...todo,
              ...updateTodo,
            };
          }
          return todo;
        }),
      };
    }
  });
  response
    .status(201)
    .json(
      users
        .find((user) => user.username === username)
        .todos.find((todo) => todo.id === request.params.id)
    );
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const username = request.headers["username"];

  const existTodo = users
    .find((user) => user.username === username)
    .todos.find((todo) => todo.id === request.params.id);

  if (!existTodo) {
    return response.status(404).json({
      error: "Not Found",
    });
  }

  users.forEach((user, index, array) => {
    if (user.username === username) {
      array[index] = {
        ...user,
        todos: user.todos.map((todo) => {
          if (todo.id === request.params.id) {
            return {
              ...todo,
              done: true,
            };
          }
          return todo;
        }),
      };
    }
  });

  response
    .status(201)
    .json(
      users
        .find((user) => user.username === username)
        .todos.find((todo) => todo.id === request.params.id)
    );
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const username = request.headers["username"];

  const existTodo = users
    .find((user) => user.username === username)
    .todos.find((todo) => todo.id === request.params.id);

  if (!existTodo) {
    return response.status(404).json({
      error: "Not Found",
    });
  }

  users.forEach((user, index, array) => {
    if (user.username === username) {
      array[index] = {
        ...user,
        todos: user.todos
          .map((todo) => {
            if (todo.id === request.params.id) {
              return null;
            }
            return todo;
          })
          .filter((x) => x !== null),
      };
    }
  });

  response
    .status(204)
    .json(users.find((user) => user.username === username).todos);
});

module.exports = app;
