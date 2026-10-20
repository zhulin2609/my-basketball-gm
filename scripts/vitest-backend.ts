import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, openSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import type { TestProject } from 'vitest/node';

export default async function setup(project: TestProject) {
  const container = 'basketball-gm-test-pg';
  const database = `stage4_frontend_${Date.now()}`;
  const directory = resolve('.cache/integration-tests', database);
  mkdirSync(directory, { recursive: true });
  mkdirSync(resolve('.cache/java-tmp'), { recursive: true });
  execFileSync('docker', ['exec', container, 'createdb', '-U', 'zhulin', database]);
  const log = openSync(`${directory}/backend.log`, 'w');
  execFileSync(
    'mvn',
    [
      '--batch-mode',
      '--no-transfer-progress',
      `-Djava.io.tmpdir=${resolve('.cache/java-tmp')}`,
      '-DskipTests',
      'package',
    ],
    {
      cwd: resolve('backend'),
      stdio: ['ignore', log, log],
    },
  );
  // D-006：仅替代外部微信；所有 /api/v1 请求均由 Spring Boot 和 PostgreSQL 处理。
  const wechat = createServer((request, response) => {
    const url = new URL(request.url!, 'http://localhost');
    response.setHeader('Content-Type', 'application/json');
    if (url.pathname === '/sns/jscode2session') {
      response.end(JSON.stringify({ openid: url.searchParams.get('js_code') }));
    } else if (url.pathname === '/cgi-bin/token') {
      response.end(
        JSON.stringify({ access_token: randomBytes(32).toString('hex'), expires_in: 7200 }),
      );
    } else if (url.pathname === '/wxa/getwxacodeunlimit') {
      response.setHeader('Content-Type', 'image/png');
      response.end(
        Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1UAAAAASUVORK5CYII=',
          'base64',
        ),
      );
    } else {
      response.statusCode = 404;
      response.end();
    }
  });
  await new Promise<void>((done) => wechat.listen(0, '127.0.0.1', done));
  const upstream = wechat.address();
  if (!upstream || typeof upstream === 'string') throw new Error('微信契约服务未启动');
  const reservation = createServer();
  await new Promise<void>((done) => reservation.listen(0, '127.0.0.1', done));
  const address = reservation.address();
  if (!address || typeof address === 'string') throw new Error('测试端口未分配');
  await new Promise<void>((done) => reservation.close(() => done()));
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
  const child = spawn(
    'java',
    [
      `-Djava.io.tmpdir=${resolve('.cache/java-tmp')}`,
      '-jar',
      'target/basketball-gm-api-0.0.1-SNAPSHOT.jar',
      `--server.port=${address.port}`,
    ],
    {
      cwd: resolve('backend'),
      stdio: ['ignore', log, log],
      env: {
        ...process.env,
        SPRING_PROFILES_ACTIVE: 'test',
        SPRING_DATASOURCE_URL: `jdbc:postgresql://127.0.0.1:5432/${database}`,
        SPRING_DATASOURCE_USERNAME: 'zhulin',
        SPRING_DATASOURCE_PASSWORD: '',
        JWT_SECRET: randomBytes(32).toString('hex'),
        LLM_CREDENTIAL_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
        WECHAT_MINI_APPID: 'integration-app',
        WECHAT_MINI_SECRET: randomBytes(32).toString('hex'),
        WECHAT_API_BASE_URL: `http://127.0.0.1:${upstream.port}`,
        WECHAT_TICKET_PER_HOUR: '2',
        WECHAT_TICKET_GLOBAL_PER_HOUR: '10000',
        WECHAT_EXCHANGE_PER_MINUTE: '10000',
      },
    },
  );
  const stop = async () => {
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      await new Promise<void>((done) => child.once('exit', () => done()));
    }
    await new Promise<void>((done) => wechat.close(() => done()));
  };
  try {
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      if (child.exitCode !== null)
        throw new Error(`Spring Boot 启动失败，见 ${directory}/backend.log`);
      ready = await fetch(`${baseUrl}/health`).then(
        (r) => r.ok,
        () => false,
      );
      if (ready) break;
      await setTimeout(500);
    }
    if (!ready) throw new Error('Spring Boot 启动超时');
    project.provide('integration', { baseUrl, database, container });
    writeFileSync(
      `${directory}/environment.json`,
      JSON.stringify({ baseUrl, database, container, pid: child.pid }, null, 2),
    );
    console.log(`真实 API 测试：${database}，证据 ${directory}`);
    return stop;
  } catch (error) {
    await stop();
    throw error;
  }
}
