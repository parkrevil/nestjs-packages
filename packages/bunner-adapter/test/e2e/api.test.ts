import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { BunnerAdapter } from '../../src/adapter';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: any;
  const port = 3030;
  const baseUrl = `http://localhost:${port}`;

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, new BunnerAdapter());
    app.enableCors({
      origin: `http://localhost:${port}`,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });
    app.useGlobalPipes(
      // new LoggingPipe(),
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }));
    await app.listen(port, '0.0.0.0');
  });

  afterAll(async () => {
    await app.close();
  });

  it('사용자 목록 조회 - 잘못된 페이지 번호', async () => {
    const response = await fetch(`${baseUrl}/users?page=invalid`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.page).toBe(1)
  });

  describe('기본 API 테스트', () => {
    it('GET / - 기본 Hello World 응답', async () => {
      const response = await fetch(`${baseUrl}/`);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('Hello World!');
    });

    it('GET / - 응답 타입이 text/plain인지 확인', async () => {
      const response = await fetch(`${baseUrl}/`);
      expect(response.headers.get('content-type')).toContain('text/plain');
    });
  });

  describe('사용자 관리 API 테스트', () => {
    describe('GET /users', () => {
      it('사용자 목록 조회 - 기본 파라미터', async () => {
        const response = await fetch(`${baseUrl}/users`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('users');
        expect(data).toHaveProperty('pagination');
        expect(data.pagination.page).toBe(1);
        expect(data.pagination.limit).toBe(10);
        expect(Array.isArray(data.users)).toBe(true);
      });

      it('사용자 목록 조회 - 커스텀 페이지네이션', async () => {
        const response = await fetch(`${baseUrl}/users?page=2&limit=5`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.pagination.page).toBe(2);
        expect(data.pagination.limit).toBe(5);
      });

      it('사용자 목록 조회 - 검색 파라미터', async () => {
        const response = await fetch(`${baseUrl}/users?search=john`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.search).toBe('john');
      });

      /*       it('사용자 목록 조회 - 잘못된 페이지 번호', async () => {
              const response = await fetch(`${baseUrl}/users?page=invalid`);
              expect(response.status).toBe(400);
            }); */
    });

    describe('GET /users/:id', () => {
      it('특정 사용자 조회 - 유효한 ID', async () => {
        const response = await fetch(`${baseUrl}/users/1`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.id).toBe(1);
        expect(data.name).toBe('John Doe');
        expect(data.email).toBe('john@example.com');
        expect(data.role).toBe('user');
      });

      it('특정 사용자 조회 - 존재하지 않는 ID', async () => {
        const response = await fetch(`${baseUrl}/users/999`);
        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data.message).toBe('사용자를 찾을 수 없습니다');
      });

      it('특정 사용자 조회 - 잘못된 ID 형식', async () => {
        const response = await fetch(`${baseUrl}/users/invalid`);
        expect(response.status).toBe(400);
      });

      it('특정 사용자 조회 - 인증 헤더 포함', async () => {
        const response = await fetch(`${baseUrl}/users/1`, {
          headers: {
            'Authorization': 'Bearer token123'
          }
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.auth).toBe('Bearer token123');
      });
    });

    describe('POST /users', () => {
      it('사용자 생성 - 유효한 데이터', async () => {
        const userData = {
          name: 'Test User',
          email: 'test@example.com',
          age: 25,
          role: 'user'
        };

        const response = await fetch(`${baseUrl}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data).toHaveProperty('id');
        expect(data.name).toBe(userData.name);
        expect(data.email).toBe(userData.email);
        expect(data.age).toBe(userData.age);
        expect(data.role).toBe(userData.role);
        expect(data).toHaveProperty('createdAt');
      });

      it('사용자 생성 - 잘못된 데이터 (나이 누락)', async () => {
        const userData = {
          name: 'Test User',
          email: 'test@example.com',
          role: 'user'
        };

        const response = await fetch(`${baseUrl}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
        expect(response.status).toBe(400);
      });

      it('사용자 생성 - 잘못된 역할', async () => {
        const userData = {
          name: 'Test User',
          email: 'test@example.com',
          age: 25,
          role: 'invalid_role'
        };

        const response = await fetch(`${baseUrl}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
        expect(response.status).toBe(400);
      });
    });
    describe('PUT /users/:id', () => {
      it('사용자 전체 수정 - 유효한 데이터', async () => {
        const userData = {
          name: 'Updated User',
          email: 'updated@example.com',
          age: 30,
          role: 'admin'
        };

        const response = await fetch(`${baseUrl}/users/1`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.id).toBe(1);
        expect(data.name).toBe(userData.name);
        expect(data.email).toBe(userData.email);
        expect(data.age).toBe(userData.age);
        expect(data.role).toBe(userData.role);
        expect(data).toHaveProperty('updatedAt');
      });
    });

    describe('PATCH /users/:id', () => {
      it('사용자 부분 수정 - 이름만 변경', async () => {
        const updateData = {
          name: 'Patched User'
        };

        const response = await fetch(`${baseUrl}/users/1`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.id).toBe(1);
        expect(data.name).toBe(updateData.name);
        expect(data).toHaveProperty('updatedAt');
      });

      it('사용자 부분 수정 - 여러 필드 변경', async () => {
        const updateData = {
          name: 'Multi Patched User',
          age: 35,
          role: 'guest'
        };

        const response = await fetch(`${baseUrl}/users/1`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.name).toBe(updateData.name);
        expect(data.age).toBe(updateData.age);
        expect(data.role).toBe(updateData.role);
      });
    });

    describe('DELETE /users/:id', () => {
      it('사용자 삭제 - 유효한 ID', async () => {
        const response = await fetch(`${baseUrl}/users/1`, {
          method: 'DELETE'
        });
        expect(response.status).toBe(204);
      });

      it('사용자 삭제 - 잘못된 ID 형식', async () => {
        const response = await fetch(`${baseUrl}/users/invalid`, {
          method: 'DELETE'
        });
        expect(response.status).toBe(400);
      });
    });
  });
  describe('HTTP 메서드 테스트', () => {
    it('HEAD /status - 헤더만 확인', async () => {
      const response = await fetch(`${baseUrl}/status`, {
        method: 'HEAD'
      });
      expect(response.status).toBe(200);
      expect(response.headers.get('x-custom-header')).toBe('head-test');
    });

    it('OPTIONS /users - 허용된 메서드 확인', async () => {
      const response = await fetch(`${baseUrl}/users`, {
        method: 'OPTIONS'
      });
      expect(response.status).toBe(200);
      expect(response.headers.get('allow')).toBe('GET, POST, PUT, DELETE');
    });
  });

  describe('리다이렉트 테스트', () => {
    it('GET /redirect - 리다이렉트 응답', async () => {
      const response = await fetch(`${baseUrl}/redirect`, {
        redirect: 'manual'
      });
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('https://nestjs.com');
    });
  });

  describe('에러 처리 테스트', () => {
    it('GET /error/400 - Bad Request 에러', async () => {
      const response = await fetch(`${baseUrl}/error/400`);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('잘못된 요청입니다');
    });

    it('GET /error/401 - Unauthorized 에러', async () => {
      const response = await fetch(`${baseUrl}/error/401`);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe('인증이 필요합니다');
    });

    it('GET /error/403 - Forbidden 에러', async () => {
      const response = await fetch(`${baseUrl}/error/403`);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.message).toBe('접근이 거부되었습니다');
    });

    it('GET /error/404 - Not Found 에러', async () => {
      const response = await fetch(`${baseUrl}/error/404`);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe('리소스를 찾을 수 없습니다');
    });

    it('GET /error/500 - Internal Server Error', async () => {
      const response = await fetch(`${baseUrl}/error/500`);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe('서버 내부 오류');
    });
  });

  describe('쿼리 파라미터 테스트', () => {
    it('GET /query-test - 모든 파라미터 타입', async () => {
      const response = await fetch(`${baseUrl}/query-test?string=test&number=123&boolean=true&array=item1,item2,item3&enum=admin`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.stringParam).toBe('test');
      expect(data.numberParam).toBe(123);
      expect(data.booleanParam).toBe(true);
      expect(data.arrayParam).toEqual(['item1', 'item2', 'item3']);
      expect(data.enumParam).toBe('admin');
    });

    it('GET /query-test - 잘못된 숫자 파라미터', async () => {
      const response = await fetch(`${baseUrl}/query-test?string=test&number=invalid&boolean=true&array=item1&enum=user`);
      expect(response.status).toBe(400);
    });

    it('GET /query-test - 잘못된 enum 파라미터', async () => {
      const response = await fetch(`${baseUrl}/query-test?string=test&number=123&boolean=true&array=item1&enum=invalid`);
      expect(response.status).toBe(400);
    });
  });

  describe('헤더 테스트', () => {
    it('GET /headers-test - 모든 헤더 확인', async () => {
      const response = await fetch(`${baseUrl}/headers-test`, {
        headers: {
          'X-Custom-Header': 'test-value',
          'User-Agent': 'test-agent',
          'Authorization': 'Bearer token123'
        }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.allHeaders).toHaveProperty('x-custom-header');
      expect(data.allHeaders['x-custom-header']).toBe('test-value');
      expect(data.userAgent).toBe('test-agent');
      expect(data.auth).toBe('Bearer token123');
    });
  });

  describe('IP 주소 테스트', () => {
    it('GET /ip-test - IP 주소 확인', async () => {
      const response = await fetch(`${baseUrl}/ip-test`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('ip');
      expect(typeof data.ip).toBe('string');
    });
  });

  describe('JSON 요청/응답 테스트', () => {
    it('POST /json-test - 복잡한 JSON 데이터', async () => {
      const jsonData = {
        name: 'Test User',
        age: 25,
        active: true,
        tags: ['tag1', 'tag2', 'tag3']
      };

      const response = await fetch(`${baseUrl}/json-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
      });
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.received).toEqual(jsonData);
      expect(data.processed).toBe(true);
      expect(data).toHaveProperty('timestamp');
    });

    it('POST /json-test - 빈 객체', async () => {
      const response = await fetch(`${baseUrl}/json-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.received).toEqual({});
      expect(data.processed).toBe(true);
    });
  });

  describe('캐시 테스트', () => {
    it('GET /cache-test - 캐시 헤더 확인', async () => {
      const response = await fetch(`${baseUrl}/cache-test`);
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('public, max-age=3600');
      const data = await response.json();
      expect(data.data).toBe('캐시된 데이터');
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('성능 테스트', () => {
    it('GET /performance-test - 비동기 응답', async () => {
      const startTime = Date.now();

      const response = await fetch(`${baseUrl}/performance-test`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('성능 테스트 완료');
      expect(data).toHaveProperty('timestamp');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 최소 100ms 이상 걸려야 함 (인위적인 지연)
      expect(duration).toBeGreaterThanOrEqual(100);
    });
  });

  describe('존재하지 않는 엔드포인트 테스트', () => {
    it('GET /nonexistent - 404 응답', async () => {
      const response = await fetch(`${baseUrl}/nonexistent`);
      expect(response.status).toBe(404);
    });

    it('POST /nonexistent - 404 응답', async () => {
      const response = await fetch(`${baseUrl}/nonexistent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      expect(response.status).toBe(404);
    });
  });

  describe('잘못된 HTTP 메서드 테스트', () => {
    it('POST / - 존재하지 않는 POST 메서드', async () => {
      const response = await fetch(`${baseUrl}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      expect(response.status).toBe(404);
    });

    it('PUT / - 존재하지 않는 PUT 메서드', async () => {
      const response = await fetch(`${baseUrl}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      expect(response.status).toBe(404);
    });
  });

  describe('Content-Type 테스트', () => {
    it('POST /users - JSON Content-Type 자동 설정', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        age: 25,
        role: 'user'
      };

      const response = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('GET / - text/plain Content-Type', async () => {
      const response = await fetch(`${baseUrl}/`);
      expect(response.headers.get('content-type')).toContain('text/plain');
    });
  });

  describe('응답 시간 테스트', () => {
    it('GET / - 빠른 응답 시간', async () => {
      const startTime = Date.now();

      const response = await fetch(`${baseUrl}/`);
      expect(response.status).toBe(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 일반적인 API 응답은 100ms 이내여야 함
      expect(duration).toBeLessThan(100);
    });
  });

  describe('동시 요청 테스트', () => {
    it('여러 동시 요청 처리', async () => {
      const requests = Array.from({ length: 5 }, () =>
        fetch(`${baseUrl}/`)
      );

      const responses = await Promise.all(requests);

      for (const response of responses) {
        expect(response.status).toBe(200);
        const text = await response.text();
        expect(text).toBe('Hello World!');
      }
    });
  });

  describe('@Req, @Res 데코레이터 테스트', () => {
    it('GET /req-res-test - Request/Response 객체 직접 사용', async () => {
      const response = await fetch(`${baseUrl}/req-res-test`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('method');
      expect(data).toHaveProperty('url');
      expect(data).toHaveProperty('headers');
      expect(data).toHaveProperty('timestamp');
      expect(data.method).toBe('GET');
      expect(data.url).toContain('/req-res-test');
    });
  });

  describe('CORS 테스트', () => {
    it('POST /cors-test - 허용된 Origin으로 CORS 요청 처리', async () => {
      const testData = {
        name: 'CORS Test',
        value: 123
      };

      const response = await fetch(`${baseUrl}/cors-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': `http://localhost:${port}`
        },
        body: JSON.stringify(testData)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('CORS 테스트 성공');
      expect(data.receivedData).toEqual(testData);
      expect(data).toHaveProperty('timestamp');
    });

    it('POST /cors-test - 거부된 Origin으로 CORS 요청 처리', async () => {
      const testData = {
        name: 'CORS Test',
        value: 123
      };

      const response = await fetch(`${baseUrl}/cors-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://malicious-site.com'
        },
        body: JSON.stringify(testData)
      });

      if (response.status !== 200) {
        expect(response.status).toBeGreaterThanOrEqual(400);
      } else {
        const corsOrigin = response.headers.get('access-control-allow-origin');
        expect(corsOrigin).not.toBe('https://malicious-site.com');
      }
    });

    it('OPTIONS /cors-test - 허용된 Origin으로 CORS Preflight 요청', async () => {
      const response = await fetch(`${baseUrl}/cors-test`, {
        method: 'OPTIONS',
        headers: {
          'Origin': `http://localhost:${port}`,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      expect([200, 204]).toContain(response.status);

      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-methods',
        'access-control-allow-headers'
      ];

      corsHeaders.forEach(header => {
        expect(response.headers.has(header)).toBe(true);
      });
    });

    it('OPTIONS /cors-test - 거부된 Origin으로 CORS Preflight 요청', async () => {
      const response = await fetch(`${baseUrl}/cors-test`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://malicious-site.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      const corsOrigin = response.headers.get('access-control-allow-origin');
      expect(corsOrigin).not.toBe('https://malicious-site.com');
    });

    it('OPTIONS /cors-test - 허용되지 않은 HTTP 메소드로 Preflight 요청', async () => {
      const response = await fetch(`${baseUrl}/cors-test`, {
        method: 'OPTIONS',
        headers: {
          'Origin': `http://localhost:${port}`,
          'Access-Control-Request-Method': 'PATCH',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      const allowedMethods = response.headers.get('access-control-allow-methods');
      expect(allowedMethods).not.toContain('PATCH');
    });

    it('OPTIONS /cors-test - 허용되지 않은 헤더로 Preflight 요청', async () => {
      const response = await fetch(`${baseUrl}/cors-test`, {
        method: 'OPTIONS',
        headers: {
          'Origin': `http://localhost:${port}`,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'X-Custom-Header'
        }
      });

      const allowedHeaders = response.headers.get('access-control-allow-headers');
      expect(allowedHeaders).not.toContain('X-Custom-Header');
    });

    it('POST /cors-test - Credentials 포함 요청 (허용된 Origin)', async () => {
      const testData = {
        name: 'CORS Credentials Test',
        value: 456
      };

      const response = await fetch(`${baseUrl}/cors-test`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Origin': `http://localhost:${port}`
        },
        body: JSON.stringify(testData)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('CORS 테스트 성공');
      expect(data.receivedData).toEqual(testData);
    });
    it('OPTIONS /cors-test - Credentials 포함 Preflight 요청', async () => {
      const response = await fetch(`${baseUrl}/cors-test`, {
        method: 'OPTIONS',
        credentials: 'include',
        headers: {
          'Origin': `http://localhost:${port}`,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      const allowCredentials = response.headers.get('access-control-allow-credentials');
      expect(allowCredentials).toBe('true');
    });
    it('POST /cors-test - Credentials 포함 요청 (거부된 Origin)', async () => {
      const testData = {
        name: 'CORS Credentials Test',
        value: 789
      };

      const response = await fetch(`${baseUrl}/cors-test`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://malicious-site.com'
        },
        body: JSON.stringify(testData)
      });

      if (response.status !== 200) {
        expect(response.status).toBeGreaterThanOrEqual(400);
      } else {
        const corsOrigin = response.headers.get('access-control-allow-origin');

        expect(corsOrigin).not.toBe('*');
        expect(corsOrigin).not.toBe('https://malicious-site.com');
      }
    });
  });
});