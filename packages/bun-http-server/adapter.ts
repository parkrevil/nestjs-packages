import { HttpStatus, RequestMethod, VersioningOptions } from '@nestjs/common';
import { VersionValue } from '@nestjs/common/interfaces';
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface';
import { AbstractHttpAdapter } from '@nestjs/core/adapters/http-adapter';

export class BunHttpAdapter extends AbstractHttpAdapter<Bun.Server, Bun.BunRequest, Response> {
  private server: Bun.Server | null = null;
  private routes: Map<string, Map<string, (req: Bun.BunRequest, res: Response) => Response | Promise<Response>>> = new Map();
  private middleware: Array<(req: Bun.BunRequest, res: Response, next: () => void) => void> = [];
  private errorHandler?: (error: Error, req: Bun.BunRequest, res: Response) => Response | Promise<Response>;
  private notFoundHandler?: (req: Bun.BunRequest, res: Response) => Response | Promise<Response>;
  private corsOptions?: any;

  constructor() {
    super();
  }


  async close() {
    if (!this.server) {
      return;
    }

    await this.server.stop(true);
    this.server.unref();

    return;
  }

  initHttpServer(options: NestApplicationOptions): any {
    const serverOptions: Bun.ServeOptions = {
      port: (options as any).port || 3000,
      fetch: this.handleRequest.bind(this),
      error: this.handleError.bind(this),
      ...options,
    };

    this.server = Bun.serve(serverOptions);
    return this.server;
  }

  useStaticAssets(...args: any[]): any {
    const path = args[0];
    const options = args[1] || {};

    this.use(async (req: Bun.BunRequest, res: Response, next: () => void) => {
      const url = new URL(req.url);
      if (url.pathname.startsWith(path)) {
        try {
          const filePath = url.pathname.replace(path, '');
          const file = Bun.file(filePath);
          if (await file.exists()) {
            return new Response(file, {
              headers: { 'content-type': file.type },
            });
          }
        } catch (error) {
          // 파일을 찾을 수 없는 경우 다음 미들웨어로
        }
      }
      next();
    });

    return this;
  }

  setViewEngine(engine: string) {
    return this;
  }

  getRequestHostname(request: Bun.BunRequest): any {
    return request.headers.get('host')?.split(':')[0] || 'localhost';
  }

  getRequestMethod(request: Bun.BunRequest): any {
    return request.method;
  }

  getRequestUrl(request: Bun.BunRequest): any {
    return request.url;
  }

  status(response: any, statusCode: number): any {
    return new Response(response, { status: statusCode });
  }

  reply(response: any, body: any, statusCode?: number): any {
    const options: ResponseInit = {};
    if (statusCode) {
      options.status = statusCode;
    }
    if (typeof body === 'object') {
      return new Response(JSON.stringify(body), {
        ...options,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(body, options);
  }

  end(response: any, message?: string): any {
    return new Response(message || '', response);
  }

  render(response: any, view: string, options: any): any {
    // 뷰 렌더링 구현 (필요시 확장)
    return new Response(JSON.stringify({ view, options }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  redirect(response: any, statusCode: number, url: string): any {
    return new Response(null, {
      status: statusCode,
      headers: { 'location': url },
    });
  }

  setErrorHandler(handler: Function, prefix?: string): any {
    this.errorHandler = handler as (error: Error, req: Bun.BunRequest, res: Response) => Response | Promise<Response>;
    return this;
  }

  setNotFoundHandler(handler: Function, prefix?: string): any {
    this.notFoundHandler = handler as (req: Bun.BunRequest, res: Response) => Response | Promise<Response>;
    return this;
  }

  isHeadersSent(response: any): any {
    // Bun에서는 응답이 이미 전송되었는지 확인하는 방법이 다름
    return false;
  }

  getHeader(response: any, name: string): any {
    return response.headers.get(name);
  }

  setHeader(response: any, name: string, value: string): any {
    const newHeaders = new Headers(response.headers);
    newHeaders.set(name, value);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  appendHeader(response: any, name: string, value: string): any {
    const newHeaders = new Headers(response.headers);
    const existing = newHeaders.get(name);
    if (existing) {
      newHeaders.set(name, `${existing}, ${value}`);
    } else {
      newHeaders.set(name, value);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  registerParserMiddleware(prefix?: string, rawBody?: boolean): any {
    // 파서 미들웨어 등록 (이미 handleRequest에서 구현됨)
    return this;
  }

  enableCors(options?: any, prefix?: string): any {
    this.use(async (req: Bun.BunRequest, res: Response, next: () => void) => {
      const origin = req.headers.get('origin');
      const method = req.method;

      const corsHeaders = new Headers();

      if (options?.origin) {
        corsHeaders.set('Access-Control-Allow-Origin', options.origin);
      } else if (origin) {
        corsHeaders.set('Access-Control-Allow-Origin', origin);
      }

      if (options?.methods) {
        corsHeaders.set('Access-Control-Allow-Methods', options.methods.join(', '));
      } else {
        corsHeaders.set('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
      }

      if (options?.allowedHeaders) {
        corsHeaders.set('Access-Control-Allow-Headers', options.allowedHeaders.join(', '));
      } else {
        corsHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }

      if (options?.credentials) {
        corsHeaders.set('Access-Control-Allow-Credentials', 'true');
      }

      if (method === 'OPTIONS') {
        return new Response(null, {
          status: HttpStatus.NO_CONTENT,
          headers: corsHeaders,
        });
      }

      next();
    });

    return this;
  }

  async createMiddlewareFactory(requestMethod: RequestMethod): Promise<(path: string, callback: Function) => any> {
    return (path: string, callback: Function) => {
      this.use(async (req: Bun.BunRequest, res: Response, next: () => void) => {
        const url = new URL(req.url);
        if (req.method === requestMethod.toString() && url.pathname === path) {
          return await callback(req, res, next);
        }
        next();
      });
      return this;
    };
  }

  getType(): string {
    return 'bun';
  }

  applyVersionFilter(handler: Function, version: VersionValue, versioningOptions: VersioningOptions): (req: Bun.BunRequest, res: Response, next: () => void) => Function {
    return (req: Bun.BunRequest, res: Response, next: () => void) => {
      // 버전 필터링 로직 구현 (필요시 확장)
      return handler;
    };
  }

  // Bun HTTP 서버를 위한 핸들러들

  private async handleRequest(request: Bun.BunRequest): Promise<Response> {
    try {
      // 미들웨어 체인 실행
      await this.executeMiddleware(request);

      // 라우트 핸들러 찾기 및 실행
      const handler = this.findRouteHandler(request.method, new URL(request.url).pathname);
      if (handler) {
        return await handler(request, new Response());
      }

      // 404 처리
      if (this.notFoundHandler) {
        return await this.notFoundHandler(request, new Response());
      }

      return new Response('Not Found', { status: HttpStatus.NOT_FOUND });
    } catch (error) {
      // 에러 핸들러 실행
      if (this.errorHandler) {
        return await this.errorHandler(error as Error, request, new Response());
      }
      return new Response('Internal Server Error', { status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  private async handleError(error: Error): Promise<Response> {
    console.error('Bun server error:', error);

    return new Response(`Internal Server Error: ${error.message}`, { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }

  private async executeMiddleware(req: Bun.BunRequest): Promise<void> {
    return new Promise((resolve) => {
      let index = 0;
      const next = () => {
        if (index >= this.middleware.length) {
          resolve();
          return;
        }
        const middleware = this.middleware[index++];
        middleware(req, new Response(), next);
      };
      next();
    });
  }

  private findRouteHandler(method: string, path: string): ((req: Bun.BunRequest, res: Response) => Response | Promise<Response>) | null {
    const methodRoutes = this.routes.get(method);
    if (!methodRoutes) return null;

    // 정확한 경로 매칭
    if (methodRoutes.has(path)) {
      return methodRoutes.get(path)!;
    }

    // 파라미터 경로 매칭 (간단한 구현)
    for (const [routePath, handler] of methodRoutes) {
      if (this.matchRoute(routePath, path)) {
        return handler;
      }
    }

    return null;
  }

  private matchRoute(routePath: string, requestPath: string): boolean {
    // 간단한 파라미터 매칭 구현
    const routeParts = routePath.split('/');
    const requestParts = requestPath.split('/');

    if (routeParts.length !== requestParts.length) return false;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) continue;
      if (routeParts[i] !== requestParts[i]) return false;
    }

    return true;
  }

  // HTTP 메서드별 라우트 등록 메서드들

  get(handler: any): any;
  get(path: any, handler: any): any;
  get(pathOrHandler: any, handler?: any): any {
    const path = typeof pathOrHandler === 'string' ? pathOrHandler : '/';
    const routeHandler = handler || pathOrHandler;
    this.addRoute('GET', path, routeHandler);
    return this;
  }

  post(handler: any): any;
  post(path: any, handler: any): any;
  post(pathOrHandler: any, handler?: any): any {
    const path = typeof pathOrHandler === 'string' ? pathOrHandler : '/';
    const routeHandler = handler || pathOrHandler;
    this.addRoute('POST', path, routeHandler);
    return this;
  }

  put(handler: any): any;
  put(path: any, handler: any): any;
  put(pathOrHandler: any, handler?: any): any {
    const path = typeof pathOrHandler === 'string' ? pathOrHandler : '/';
    const routeHandler = handler || pathOrHandler;
    this.addRoute('PUT', path, routeHandler);
    return this;
  }

  delete(handler: any): any;
  delete(path: any, handler: any): any;
  delete(pathOrHandler: any, handler?: any): any {
    const path = typeof pathOrHandler === 'string' ? pathOrHandler : '/';
    const routeHandler = handler || pathOrHandler;
    this.addRoute('DELETE', path, routeHandler);
    return this;
  }

  patch(handler: any): any;
  patch(path: any, handler: any): any;
  patch(pathOrHandler: any, handler?: any): any {
    const path = typeof pathOrHandler === 'string' ? pathOrHandler : '/';
    const routeHandler = handler || pathOrHandler;
    this.addRoute('PATCH', path, routeHandler);
    return this;
  }

  head(handler: any): any;
  head(path: any, handler: any): any;
  head(pathOrHandler: any, handler?: any): any {
    const path = typeof pathOrHandler === 'string' ? pathOrHandler : '/';
    const routeHandler = handler || pathOrHandler;
    this.addRoute('HEAD', path, routeHandler);
    return this;
  }

  options(handler: any): any;
  options(path: any, handler: any): any;
  options(pathOrHandler: any, handler?: any): any {
    const path = typeof pathOrHandler === 'string' ? pathOrHandler : '/';
    const routeHandler = handler || pathOrHandler;
    this.addRoute('OPTIONS', path, routeHandler);
    return this;
  }

  all(handler: any): any;
  all(path: any, handler: any): any;
  all(pathOrHandler: any, handler?: any): any {
    const path = typeof pathOrHandler === 'string' ? pathOrHandler : '/';
    const routeHandler = handler || pathOrHandler;
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].forEach(method => {
      this.addRoute(method, path, routeHandler);
    });
    return this;
  }

  use(...args: any[]): any {
    if (typeof args[0] === 'function') {
      this.middleware.push(args[0]);
    } else if (typeof args[0] === 'string' && typeof args[1] === 'function') {
      const path = args[0];
      const middleware = args[1];
      this.middleware.push((req, res, next) => {
        if (req.url.startsWith(path)) {
          middleware(req, res, next);
        } else {
          next();
        }
      });
    }
    return this;
  }

  private addRoute(method: string, path: string, handler: (req: Bun.BunRequest, res: Response) => Response | Promise<Response>): void {
    if (!this.routes.has(method)) {
      this.routes.set(method, new Map());
    }
    this.routes.get(method)!.set(path, handler);
  }
}
