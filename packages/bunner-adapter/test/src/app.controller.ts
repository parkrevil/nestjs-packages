import {
  Controller,
  Get
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Hello World 엔드포인트', description: '기본적인 Hello World 응답을 반환합니다.' })
  @ApiOkResponse({ description: '성공적으로 Hello World 메시지를 반환합니다.' })
  getHello(): string {
    return 'Hello World!';
  }
  /*
    @Get('users')
    @ApiOperation({ summary: '사용자 목록 조회', description: '페이지네이션과 검색 기능을 포함한 사용자 목록을 조회합니다.' })
    @ApiQuery({ name: 'page', required: false, description: '페이지 번호', example: 1 })
    @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수', example: 10 })
    @ApiQuery({ name: 'search', required: false, description: '검색어', example: 'john' })
    @ApiOkResponse({
      description: '사용자 목록을 성공적으로 조회했습니다.',
      schema: {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                email: { type: 'string' }
              }
            }
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              limit: { type: 'number' },
              total: { type: 'number' }
            }
          },
          search: { type: 'string' }
        }
      }
    })
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
    @ApiOperation({ summary: '특정 사용자 조회', description: 'ID로 특정 사용자의 정보를 조회합니다.' })
    @ApiParam({ name: 'id', description: '사용자 ID', example: 1 })
    @ApiHeader({ name: 'authorization', description: '인증 토큰', required: false })
    @ApiOkResponse({
      description: '사용자 정보를 성공적으로 조회했습니다.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: Object.values(UserRole) },
          auth: { type: 'string' }
        }
      }
    })
    @ApiNotFoundResponse({ description: '사용자를 찾을 수 없습니다.' })
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
    @ApiOperation({ summary: '새 사용자 생성', description: '새로운 사용자를 생성합니다.' })
    @ApiBody({ type: CreateUserDto, description: '생성할 사용자 정보' })
    @ApiCreatedResponse({
      description: '사용자가 성공적으로 생성되었습니다.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          email: { type: 'string' },
          age: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    })
    @ApiBadRequestResponse({ description: '잘못된 요청 데이터입니다.' })
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
    @ApiOperation({ summary: '사용자 정보 전체 수정', description: '특정 사용자의 정보를 전체적으로 수정합니다.' })
    @ApiParam({ name: 'id', description: '사용자 ID', example: 1 })
    @ApiBody({ type: CreateUserDto, description: '수정할 사용자 정보' })
    @ApiOkResponse({
      description: '사용자 정보가 성공적으로 수정되었습니다.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          email: { type: 'string' },
          age: { type: 'number' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    })
    @ApiBadRequestResponse({ description: '잘못된 요청 데이터입니다.' })
    @ApiNotFoundResponse({ description: '사용자를 찾을 수 없습니다.' })
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
    @ApiOperation({ summary: '사용자 정보 부분 수정', description: '특정 사용자의 정보를 부분적으로 수정합니다.' })
    @ApiParam({ name: 'id', description: '사용자 ID', example: 1 })
    @ApiBody({ type: UpdateUserDto, description: '수정할 사용자 정보 (부분)' })
    @ApiOkResponse({
      description: '사용자 정보가 성공적으로 수정되었습니다.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          email: { type: 'string' },
          age: { type: 'number' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    })
    @ApiBadRequestResponse({ description: '잘못된 요청 데이터입니다.' })
    @ApiNotFoundResponse({ description: '사용자를 찾을 수 없습니다.' })
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
    @ApiOperation({ summary: '사용자 삭제', description: '특정 사용자를 삭제합니다.' })
    @ApiParam({ name: 'id', description: '사용자 ID', example: 1 })
    @ApiNoContentResponse({ description: '사용자가 성공적으로 삭제되었습니다.' })
    @ApiNotFoundResponse({ description: '사용자를 찾을 수 없습니다.' })
    deleteUser(@Param('id', ParseIntPipe) id: number) {
      return;
    }
  
    @Head('status')
    @Header('X-Custom-Header', 'head-test')
    @ApiOperation({ summary: '상태 확인', description: 'HEAD 요청으로 서버 상태를 확인합니다.' })
    @ApiHeader({ name: 'X-Custom-Header', description: '커스텀 헤더' })
    @ApiResponse({ status: 200, description: '서버가 정상 작동 중입니다.' })
    headStatus() {
      return;
    }
  
    @Options('users')
    @Header('Allow', 'GET, POST, PUT, DELETE')
    @ApiOperation({ summary: '사용자 엔드포인트 옵션', description: '사용자 관련 엔드포인트에서 허용되는 HTTP 메서드를 확인합니다.' })
    @ApiHeader({ name: 'Allow', description: '허용되는 HTTP 메서드' })
    @ApiResponse({ status: 200, description: '허용되는 HTTP 메서드 목록을 반환합니다.' })
    optionsUsers() {
      return;
    }
  
    @Get('redirect')
    @Redirect('https://nestjs.com', 302)
    @ApiOperation({ summary: '리다이렉트 테스트', description: '외부 URL로 리다이렉트합니다.' })
    @ApiResponse({ status: 302, description: 'NestJS 공식 사이트로 리다이렉트됩니다.' })
    redirect() {
      return;
    }
  
    @Get('error/400')
    @ApiOperation({ summary: '400 에러 테스트', description: 'Bad Request 에러를 발생시킵니다.' })
    @ApiBadRequestResponse({ description: '잘못된 요청입니다.' })
    throwBadRequest() {
      throw new BadRequestException('잘못된 요청입니다');
    }
  
    @Get('error/401')
    @ApiOperation({ summary: '401 에러 테스트', description: 'Unauthorized 에러를 발생시킵니다.' })
    @ApiUnauthorizedResponse({ description: '인증이 필요합니다.' })
    throwUnauthorized() {
      throw new UnauthorizedException('인증이 필요합니다');
    }
  
    @Get('error/403')
    @ApiOperation({ summary: '403 에러 테스트', description: 'Forbidden 에러를 발생시킵니다.' })
    @ApiForbiddenResponse({ description: '접근이 거부되었습니다.' })
    throwForbidden() {
      throw new ForbiddenException('접근이 거부되었습니다');
    }
  
    @Get('error/404')
    @ApiOperation({ summary: '404 에러 테스트', description: 'Not Found 에러를 발생시킵니다.' })
    @ApiNotFoundResponse({ description: '리소스를 찾을 수 없습니다.' })
    throwNotFound() {
      throw new NotFoundException('리소스를 찾을 수 없습니다');
    }
  
    @Get('error/500')
    @ApiOperation({ summary: '500 에러 테스트', description: 'Internal Server Error를 발생시킵니다.' })
    @ApiInternalServerErrorResponse({ description: '서버 내부 오류.' })
    throwInternalError() {
      throw new InternalServerErrorException('서버 내부 오류');
    }
  
    @Get('query-test')
    @ApiOperation({ summary: '쿼리 파라미터 테스트', description: '다양한 타입의 쿼리 파라미터를 테스트합니다.' })
    @ApiQuery({ name: 'string', description: '문자열 파라미터', example: 'test' })
    @ApiQuery({ name: 'number', description: '숫자 파라미터', example: 42 })
    @ApiQuery({ name: 'boolean', description: '불린 파라미터', example: true })
    @ApiQuery({ name: 'array', description: '배열 파라미터', example: 'item1,item2,item3' })
    @ApiQuery({ name: 'enum', description: '열거형 파라미터', enum: UserRole, example: UserRole.USER })
    @ApiOkResponse({
      description: '쿼리 파라미터 테스트 결과',
      schema: {
        type: 'object',
        properties: {
          stringParam: { type: 'string' },
          numberParam: { type: 'number' },
          booleanParam: { type: 'boolean' },
          arrayParam: { type: 'array', items: { type: 'string' } },
          enumParam: { type: 'string', enum: Object.values(UserRole) }
        }
      }
    })
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
    @ApiOperation({ summary: '헤더 테스트', description: '다양한 헤더 정보를 테스트합니다.' })
    @ApiHeader({ name: 'user-agent', description: '사용자 에이전트', required: false })
    @ApiHeader({ name: 'authorization', description: '인증 토큰', required: false })
    @ApiOkResponse({
      description: '헤더 테스트 결과',
      schema: {
        type: 'object',
        properties: {
          allHeaders: { type: 'object' },
          userAgent: { type: 'string' },
          auth: { type: 'string' }
        }
      }
    })
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
    @ApiOperation({ summary: 'IP 주소 테스트', description: '클라이언트의 IP 주소를 확인합니다.' })
    @ApiOkResponse({
      description: '클라이언트 IP 주소',
      schema: {
        type: 'object',
        properties: {
          ip: { type: 'string' }
        }
      }
    })
    ipTest(@Ip() ip: string) {
      return { ip };
    }
  
    @Get('stream')
    @Header('Content-Type', 'text/plain')
    @ApiOperation({ summary: '스트림 테스트', description: '스트림 데이터를 반환합니다.' })
    @ApiHeader({ name: 'Content-Type', description: '텍스트 플레인 타입' })
    @ApiOkResponse({ description: '스트림 데이터를 성공적으로 반환합니다.' })
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
    @ApiOperation({ summary: 'JSON 테스트', description: 'JSON 데이터를 받아서 처리합니다.' })
    @ApiBody({
      description: '테스트용 JSON 데이터',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          data: { type: 'object' }
        }
      }
    })
    @ApiOkResponse({
      description: 'JSON 처리 결과',
      schema: {
        type: 'object',
        properties: {
          received: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' },
          processed: { type: 'boolean' }
        }
      }
    })
    jsonTest(@Body() body: any) {
      return {
        received: body,
        timestamp: new Date().toISOString(),
        processed: true,
      };
    }
  
    @Get('cache-test')
    @Header('Cache-Control', 'public, max-age=3600')
    @ApiOperation({ summary: '캐시 테스트', description: '캐시 헤더가 설정된 응답을 반환합니다.' })
    @ApiHeader({ name: 'Cache-Control', description: '캐시 제어 헤더' })
    @ApiOkResponse({
      description: '캐시된 데이터',
      schema: {
        type: 'object',
        properties: {
          data: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    })
    cacheTest() {
      return {
        data: '캐시된 데이터',
        timestamp: new Date().toISOString(),
      };
    }
  
    @Get('performance-test')
    @ApiOperation({ summary: '성능 테스트', description: '비동기 처리를 테스트합니다.' })
    @ApiOkResponse({
      description: '성능 테스트 완료',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    })
    async performanceTest() {
      await new Promise(resolve => setTimeout(resolve, 100));
  
      return {
        message: '성능 테스트 완료',
        timestamp: new Date().toISOString(),
      };
    }
  
    @Get('req-res-test')
    @ApiOperation({ summary: 'Request/Response 테스트', description: 'NestJS의 Request와 Response 객체를 직접 사용합니다.' })
    @ApiOkResponse({
      description: '요청 정보',
      schema: {
        type: 'object',
        properties: {
          method: { type: 'string' },
          url: { type: 'string' },
          headers: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    })
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
    @ApiOperation({ summary: 'CORS 테스트', description: 'CORS 관련 테스트를 수행합니다.' })
    @ApiBody({
      description: 'CORS 테스트 데이터',
      schema: {
        type: 'object',
        properties: {
          test: { type: 'string' }
        }
      }
    })
    @ApiOkResponse({
      description: 'CORS 테스트 성공',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          receivedData: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    })
    corsTest(@Body() body: any) {
      return {
        message: 'CORS 테스트 성공',
        receivedData: body,
        timestamp: new Date().toISOString(),
      };
    }
      */
}
