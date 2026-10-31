import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/api/v1')
  getHello(): string {
    return 'API running!';
  }
}
