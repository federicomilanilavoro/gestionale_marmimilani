import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: number) {
    return this.prisma.customer.findUnique({ where: { id } })
  }

  async create(data: Prisma.CustomerCreateInput) {
    return this.prisma.customer.create({ data })
  }

  async update(id: number, data: { name?: string; email?: string; phone?: string }) {
    return this.prisma.customer.update({
      where: { id },
      data,
    })
  }

  async remove(id: number) {
    return this.prisma.customer.delete({ where: { id } })
  }
}
