import { HttpStatus, RequestMethod, VersioningOptions } from '@nestjs/common';
import { VersionValue } from '@nestjs/common/interfaces';
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface';
import { AbstractHttpAdapter } from '@nestjs/core/adapters/http-adapter';
import { Bunner, BunnerRequest, BunnerResponse, BunnerServerOptions } from 'bunner';

export class BunHttpAdapter extends AbstractHttpAdapter<Bunner, BunnerRequest, BunnerResponse> {
  constructor(options?: BunnerServerOptions) {
    const bunner = new Bunner(options);

    super(bunner);
  }

  /**
   * Get the bunner instance
   * @returns Bunner
   */
  getHttpServer() {
    return this.instance;
  }

  listen(port: string | number, callback?: () => void): Bunner;
  listen(port: string | number, hostname: string, callback?: () => void): Bunner;
  listen(port: string | number, hostnameOrCallback?: string | (() => void), callback?: () => void): Bunner {
    const hostname = typeof hostnameOrCallback === 'string' ? hostnameOrCallback : undefined;
    const cb = typeof hostnameOrCallback === 'function' ? hostnameOrCallback : callback;

    this.instance.listen(hostname, Number(port));

    if (cb) {
      cb();
    }

    return this.instance;
  }

  /**
   * Close the server
   * @returns Promise<void>
   */
  close() {
    return this.instance.close();
  }

  /**
   * Ignore this method
   * @param options 
   */
  initHttpServer(options: NestApplicationOptions) { }

  useStaticAssets(...args: any[]): any {
    const path = args[0];
    const options = args[1] || {};

    this.use(async (req: Request, res: Response, next: () => void) => {
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

  getRequestHostname(req: BunnerRequest) {
    return req.headers.get('host')?.split(':')[0] || 'localhost';
  }

  getRequestMethod(req: BunnerRequest) {
    return req.method;
  }

  getRequestUrl(req: BunnerRequest) {
    return req.url;
  }

  status(res: BunnerResponse, statusCode: number) {
    res.setStatus(statusCode);

    return res;
  }

  reply(res: BunnerResponse, data: any, statusCode?: number): any {
    if (statusCode) {
      this.status(res, statusCode);
    }

    return res.send(data);
  }

  end(res: BunnerResponse, data?: any) {
    return res.end(data);
  }

  render(res: BunnerResponse, view: string, options: any) {
  }

  redirect(res: BunnerResponse, statusCode: number, url: string) {
    return res.redirect(url);
  }

  setErrorHandler(handler: Function, prefix?: string): any {
    return this;
  }

  setNotFoundHandler(handler: Function, prefix?: string): any {
    return this;
  }

  isHeadersSent(res: Response): any {
    return false;
  }

  getHeader(res: BunnerResponse, name: string) {
    return res.getHeader(name);
  }

  setHeader(res: BunnerResponse, name: string, value: string) {
    return res.setHeader(name, value);
  }

  appendHeader(res: BunnerResponse, name: string, value: string) {
    return res.appendHeader(name, value);
  }

  registerParserMiddleware(prefix?: string, rawBody?: boolean): any {
    return this;
  }

  enableCors(options?: any, prefix?: string): any {
    this.use(async (req: Request, res: Response, next: () => void) => {
      const origin = req.headers.get('origin');
      const method = req.method;

      if (method === 'OPTIONS') {
        return new Response(null, {
          status: HttpStatus.NO_CONTENT,
          headers: {
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }

      next();
    });

    return this;
  }

  async createMiddlewareFactory(requestMethod: RequestMethod): Promise<(path: string, callback: Function) => any> {
    return (path: string, callback: Function) => {
      this.use(async (req: Request, res: Response, next: () => void) => {
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

  applyVersionFilter(handler: Function, version: VersionValue, versioningOptions: VersioningOptions): (req: BunnerRequest, res: BunnerResponse, next: () => void) => Function {
    return (req: BunnerRequest, res: BunnerResponse, next: () => void) => {
      return handler;
    };
  }

  // 기본 요청 핸들러
  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 기본 라우팅 처리
    if (url.pathname === '/') {
      return new Response('Hello from Bun!', {
        headers: { 'content-type': 'text/plain' },
      });
    }

    return new Response('Not Found', { status: HttpStatus.NOT_FOUND });
  }
}
