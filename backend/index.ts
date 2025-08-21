import { Elysia } from 'elysia';

const app = new Elysia()
  .get('/', () => 'Hello from ElysiaJS Backend!')
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
