import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  ForbiddenException,
  Get,
  Head,
  Header,
  Headers,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Ip,
  NotFoundException,
  Options,
  Param,
  ParseArrayPipe,
  ParseBoolPipe,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Redirect,
  Req,
  Res,
  UnauthorizedException
} from '@nestjs/common';
import { BunnerRequest, BunnerResponse } from 'bunner';
import { CreateUserDto, UpdateUserDto } from './dtos';
import { UserRole } from './enums';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('users')
  getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    console.log(page);
    return {
      users: [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      ],
      pagination: { page, limit, total: 2 },
      search,
    };
  }

  @Get('users/:id')
  getUser(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') auth?: string,
  ) {
    if (id === 999) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return {
      id,
      name: 'John Doe',
      email: 'john@example.com',
      role: UserRole.USER,
      auth,
    };
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  createUser(
    @Body() createUserDto: CreateUserDto,
  ) {
    return {
      id: Math.floor(Math.random() * 1000),
      ...createUserDto,
      createdAt: new Date(),
    };
  }

  @Put('users/:id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: CreateUserDto,
  ) {
    return {
      id,
      ...updateUserDto,
      updatedAt: new Date(),
    };
  }

  @Patch('users/:id')
  patchUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return {
      id,
      ...updateUserDto,
      updatedAt: new Date(),
    };
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return;
  }

  @Head('status')
  @Header('X-Custom-Header', 'head-test')
  headStatus() {
    return;
  }

  @Options('users')
  @Header('Allow', 'GET, POST, PUT, DELETE')
  optionsUsers() {
    return;
  }

  @Get('redirect')
  @Redirect('https://nestjs.com', 302)
  redirect() {
    return;
  }

  @Get('error/400')
  throwBadRequest() {
    throw new BadRequestException('잘못된 요청입니다');
  }

  @Get('error/401')
  throwUnauthorized() {
    throw new UnauthorizedException('인증이 필요합니다');
  }

  @Get('error/403')
  throwForbidden() {
    throw new ForbiddenException('접근이 거부되었습니다');
  }

  @Get('error/404')
  throwNotFound() {
    throw new NotFoundException('리소스를 찾을 수 없습니다');
  }

  @Get('error/500')
  throwInternalError() {
    throw new InternalServerErrorException('서버 내부 오류');
  }

  @Get('query-test')
  queryTest(
    @Query('string') stringParam: string,
    @Query('number', ParseIntPipe) numberParam: number,
    @Query('boolean', ParseBoolPipe) booleanParam: boolean,
    @Query('array', new ParseArrayPipe({ items: String, separator: ',' })) arrayParam: string[],
    @Query('enum', new ParseEnumPipe(UserRole)) enumParam: UserRole,
  ) {
    return {
      stringParam,
      numberParam,
      booleanParam,
      arrayParam,
      enumParam,
    };
  }

  @Get('headers-test')
  headersTest(
    @Headers() headers: Record<string, string>,
    @Headers('user-agent') userAgent: string,
    @Headers('authorization') auth: string,
  ) {
    return {
      allHeaders: headers,
      userAgent,
      auth,
    };
  }

  @Get('ip-test')
  ipTest(@Ip() ip: string) {
    return { ip };
  }

  @Get('stream')
  @Header('Content-Type', 'text/plain')
  stream() {
    const stream = new ReadableStream({
      start(controller) {
        const data = [
          '스트림 데이터\n',
          '두 번째 줄\n',
          '세 번째 줄\n',
          '네 번째 줄\n',
          '다섯 번째 줄\n'
        ];

        let index = 0;
        const interval = setInterval(() => {
          if (index < data.length) {
            controller.enqueue(new TextEncoder().encode(data[index]));
            index++;
          } else {
            controller.close();
            clearInterval(interval);
          }
        }, 100);
      }
    });

    return new Response(stream);
  }

  @Post('json-test')
  jsonTest(@Body() body: any) {
    return {
      received: body,
      timestamp: new Date().toISOString(),
      processed: true,
    };
  }

  @Get('cache-test')
  @Header('Cache-Control', 'public, max-age=3600')
  cacheTest() {
    return {
      data: '캐시된 데이터',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('performance-test')
  async performanceTest() {
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      message: '성능 테스트 완료',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('req-res-test')
  reqResTest(@Req() req: BunnerRequest, @Res() res: BunnerResponse) {
    res.setStatus(200).end({
      method: req.method,
      url: req.url,
      headers: req.headers,
      timestamp: new Date().toISOString(),
    });
  }

  @Post('cors-test')
  @HttpCode(HttpStatus.OK)
  corsTest(@Body() body: any) {
    return {
      message: 'CORS 테스트 성공',
      receivedData: body,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test1')
  async test1() {
    const res = await fetch('http://localhost:10001/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john.doe@example.com',
        age: 25,
      }),
    });
    return res.json();
  }
}
