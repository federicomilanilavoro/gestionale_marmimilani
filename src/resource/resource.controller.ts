import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common'
import { ResourceService } from './resource.service'

@Controller('resources')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get()
  findAll() {
    return this.resourceService.findAll()
  }

  @Post()
  create(@Body() data: { name: string; type: string; capacity: number }) {
    return this.resourceService.create(data)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: { name?: string; type?: string; capacity?: number },
  ) {
    return this.resourceService.update(+id, data)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resourceService.remove(+id)
  }
}
