// src/controllers/order.controller.ts
import { Controller, Get, Post, Body, Delete, Param, Put, BadRequestException } from '@nestjs/common'
import { OrderService } from './order.service'
import dayjs from 'dayjs'

// ✅ Funzione per calcolare i minuti LAVORATIVI tra due date (NO notti, NO weekend)
export function calculateWorkingMinutes(start: Date, end: Date, startHour = 8, endHour = 17): number {
  let current = dayjs(start)
  const target = dayjs(end)
  let totalMinutes = 0

  while (current.isBefore(target)) {
    // Salta weekend
    const dayOfWeek = current.day()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      current = current.add(1, 'day').hour(startHour).minute(0).second(0)
      continue
    }

    // Normalizza alle 8:00 se prima dell'orario lavorativo
    if (current.hour() < startHour) {
      current = current.hour(startHour).minute(0).second(0)
    }

    // Se dopo le 17:00, passa al giorno dopo
    if (current.hour() >= endHour) {
      current = current.add(1, 'day').hour(startHour).minute(0).second(0)
      continue
    }

    // Fine giornata lavorativa corrente
    const dayEnd = current.hour(endHour).minute(0).second(0)
    
    // Calcola minuti lavorativi in questa giornata
    const endOfWorkDay = target.isBefore(dayEnd) ? target : dayEnd
    const minutesInDay = endOfWorkDay.diff(current, 'minute')
    
    if (minutesInDay > 0) {
      totalMinutes += minutesInDay
    }

    // Passa al giorno successivo
    current = current.add(1, 'day').hour(startHour).minute(0).second(0)
  }

  return totalMinutes
}

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async findAll() {
    return this.orderService.findAll()
  }

  @Post()
  async create(@Body() data: any) {
    console.log('📥 POST /orders:', data)

    if (!data.title || !data.customerId || !data.materialId) {
      throw new BadRequestException('Campi obbligatori mancanti')
    }

    // ✅ Validazione durata lavorativa (max 3 giorni = 27 ore lavorative)
    if (data.startDate && data.endDate) {
      const workingMinutes = calculateWorkingMinutes(
        new Date(data.startDate), 
        new Date(data.endDate)
      )
      
      console.log(`⏱️ Durata lavorativa calcolata: ${workingMinutes} minuti`)
      
      
      
      if (workingMinutes <= 0) {
        throw new BadRequestException('La data di fine deve essere successiva alla data di inizio')
      }
    }

    return this.orderService.create(data)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    console.log(`✏️ PUT /orders/${id}:`, data)

    // ✅ Stessa validazione flessibile per update
    if (data.startDate && data.endDate) {
      const workingMinutes = calculateWorkingMinutes(
        new Date(data.startDate), 
        new Date(data.endDate)
      )
      
      console.log(`⏱️ Durata lavorativa aggiornata: ${workingMinutes} minuti`)

      
      if (workingMinutes <= 0) {
        throw new BadRequestException('La data di fine deve essere successiva alla data di inizio')
      }
    }

    return this.orderService.update(Number(id), data)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.orderService.remove(Number(id))
  }
}