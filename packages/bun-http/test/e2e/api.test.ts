import { NestFactory } from "@nestjs/core";
import { beforeAll, describe, expect, it } from "bun:test";
import { BunHttpAdapter } from "../../src/adapter";
import { AppModule } from "../src/app.module";

beforeAll(async () => {
  const app = await NestFactory.create(AppModule, new BunHttpAdapter());

  await app.listen(8080);
});

describe('API', () => {
  it('should be get string "Hello World"', async () => {
    const response = await fetch('http://localhost:8080');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Hello World');
  });
});
