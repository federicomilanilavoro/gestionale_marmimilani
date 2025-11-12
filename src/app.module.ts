import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { CustomerModule } from './customer/customer.module'
import { MaterialModule } from './material/material.module'
import { OrderModule } from './order/order.module'
import { ResourceModule } from './resource/resource.module'



@Module({
  imports: [PrismaModule, CustomerModule, MaterialModule, OrderModule, ResourceModule],
})
export class AppModule {}
