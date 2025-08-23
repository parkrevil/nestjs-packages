import { RequestMethod, VersioningOptions } from '@nestjs/common';
import { VersionValue } from '@nestjs/common/interfaces';
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface';
import { AbstractHttpAdapter } from '@nestjs/core/adapters/http-adapter';
import { Bunner, BunnerRequest, BunnerResponse, BunnerServerOptions, CorsOptions } from 'bunner';
import { UseStaticAssetsOptions } from './interfaces';

export class BunnerAdapter extends AbstractHttpAdapter<Bunner, BunnerRequest, BunnerResponse> {
  protected instance: Bunner;

  constructor(options?: BunnerServerOptions) {
    const bunner = new Bunner(options);

    super(bunner);

    this.instance = bunner;
  }

  test() {
    console.log('ddddd');
  }

  /**
   * Get the bunner instance
   * @returns Bunner
   */
  getHttpServer() {
    return this.instance;
  }

  listen(port: string | number, callback?: () => void);
  listen(port: string | number, hostname: string, callback?: () => void);
  listen(port: string | number, hostnameOrCallback?: string | (() => void), callback?: () => void) {
    const hostname = typeof hostnameOrCallback === 'string' ? hostnameOrCallback : undefined;
    const cb = typeof hostnameOrCallback === 'function' ? hostnameOrCallback : callback;

    this.instance.listen(hostname || '0.0.0.0', Number(port), cb);
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

  useStaticAssets(path: string, { prefix, ...options }: UseStaticAssetsOptions) {
    this.instance.static(prefix, path, options);

    return this;
  }

  /**
   * Not used
   */
  setViewEngine(engine: string) {
    return this;
  }

  /**
   * Get request hostname
   * @param req - Request
   * @returns hostname
   */
  getRequestHostname(req: BunnerRequest) {
    return req.hostname;
  }

  /**
   * Get request method
   * @param req - Request
   * @returns method
   */
  getRequestMethod(req: BunnerRequest) {
    return req.method;
  }

  /**
   * Get request url
   * @param req - Request
   * @returns url
   */
  getRequestUrl(req: BunnerRequest) {
    return req.url;
  }

  /**
   * Set status code
   * @param res - Response
   * @param statusCode - Status code
   * @returns response
   */
  status(res: BunnerResponse, statusCode: number) {
    res.setStatus(statusCode);

    return res;
  }

  /**
   * Reply to the request
   * @param res - Response
   * @param data - Data
   * @param statusCode - Status code
   * @returns response
   */
  reply(res: BunnerResponse, data: any, statusCode?: number): any {
    if (statusCode) {
      this.status(res, statusCode);
    }

    return res.send(data);
  }

  /**
   * End the response
   * @param res - Response
   * @param data - Data
   * @returns response
   */
  end(res: BunnerResponse, data?: any) {
    return res.end(data);
  }

  render(res: BunnerResponse, view: string, options: any) {
  }

  /**
   * Redirect to the url
   * @param res - Response
   * @param statusCode - Status code
   * @param url - Url
   * @returns response
   */
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

  /**
   * Enable CORS
   * @param options - CORS options
   * @param prefix - Prefix
   * @returns this
   */
  // TODO: prefix
  enableCors(options?: CorsOptions, prefix?: string): any {
    this.instance.cors(options || {});

    return this;
  }

  async createMiddlewareFactory(requestMethod: RequestMethod): Promise<(path: string, callback: Function) => any> {
    console.log('createMiddlewareFactory');
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
}
