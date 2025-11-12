import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ResourceService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.resource.findMany()
  }

  create(data: { name: string; type: string; capacity: number }) {
    return this.prisma.resource.create({ data })
  }

  update(id: number, data: { name?: string; type?: string; capacity?: number }) {
    return this.prisma.resource.update({
      where: { id },
      data,
    })
  }

  remove(id: number) {
    return this.prisma.resource.delete({ where: { id } })
  }
}
