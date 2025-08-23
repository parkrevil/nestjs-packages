import { INestApplication } from '@nestjs/common';
import { Bunner } from 'bunner';
import { BunnerAdapter } from './adapter';

export interface UseStaticAssetsOptions {
  prefix?: string;
  index?: string | string[] | false;
}

export interface NestBunnerApplication extends INestApplication<Bunner> {
  getHttpAdapter(): BunnerAdapter;

  test(): void;
}
