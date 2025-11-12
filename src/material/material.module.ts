import { Module } from '@nestjs/common'
import { MaterialController } from './material.controller'
import { MaterialService } from './material.service'

@Module({
  controllers: [MaterialController],
  providers: [MaterialService],
})
export class MaterialModule {}

//Il file material.module.ts è un intermediario tecnico, non logico: serve solo a dichiarare a NestJS che esistono un controller e un service da mettere in comunicazione.
//Non contiene logica di business e puoi quasi sempre ignorarlo (tranne quando aggiungi o esporti servizi ad altri moduli).