import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import dayjs from 'dayjs'
import { calcolaFineLavoro } from '../utils/schedule'

const ORA_INIZIO = 8
const ORA_FINE = 17
const SLOT_STEP_MINUTES = 15

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  // ===============================
  // 🧱 CREA NUOVO ORDINE
  // ===============================
  async create(data: {
    title: string
    customerId: number
    materialId: number
    sqm?: number
    ml?: number
    resourceId?: number
    startDate?: Date | string
    queue?: boolean
    status?: string
  }) {
    const sqm = data.sqm ?? 0
    const ml = data.ml ?? 0

    const material = await this.prisma.material.findUnique({
      where: { id: data.materialId },
    })
    if (!material) throw new BadRequestException('Materiale non trovato')

    const coeffSqm = material.coeff_mq ?? 0.5
    const coeffMl = material.coeff_ml ?? 0.2

    let startDate: Date
    let endDate: Date

    if (data.queue || !data.startDate) {
      // 🔗 Modalità automatica (queue)
      const nextSlot = await this.findNextAvailableSlot(
        data.resourceId!,
        sqm,
        ml,
        coeffSqm,
        coeffMl
      )
      startDate = nextSlot.start
      endDate = nextSlot.end
    } else {
      // 🎯 Modalità manuale
      startDate = new Date(data.startDate)
      endDate = calcolaFineLavoro(startDate, sqm, ml, coeffSqm, coeffMl)

      const canFit = await this.checkCapacity(data.resourceId!, startDate, endDate)
      if (!canFit) {
        throw new BadRequestException(
          '❌ Capacity della risorsa superata in questo slot temporale'
        )
      }
    }

    const createData: any = {
      title: data.title,
      sqm,
      ml,
      startDate,
      endDate,
      status: data.status ?? 'in coda',
      customer: { connect: { id: Number(data.customerId) } },
      material: { connect: { id: Number(data.materialId) } },
    }

    if (data.resourceId) {
      createData.resource = { connect: { id: Number(data.resourceId) } }
    }

    const ordine = await this.prisma.order.create({
      data: createData,
      include: { customer: true, material: true, resource: true },
    })

    console.log('✅ ORDINE CREATO:', ordine)
    return ordine
  }

  // ===============================
  // ✏️ AGGIORNA ORDINE
  // ===============================
  async update(id: number, data: any) {
    const updateData: any = {
      title: data.title,
      sqm: data.sqm,
      ml: data.ml,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
    }

    if (data.customerId) {
      updateData.customer = { connect: { id: Number(data.customerId) } }
    }
    if (data.materialId) {
      updateData.material = { connect: { id: Number(data.materialId) } }
    }
    if (data.resourceId) {
      updateData.resource = { connect: { id: Number(data.resourceId) } }
    }

    return this.prisma.order.update({
      where: { id: Number(id) },
      data: updateData,
      include: { customer: true, material: true, resource: true },
    })
  }

  // ===============================
  // 📋 LEGGI TUTTI GLI ORDINI
  // ===============================
  async findAll() {
    return this.prisma.order.findMany({
      include: { customer: true, material: true, resource: true },
      orderBy: { startDate: 'asc' },
    })
  }

  // ===============================
  // 🗑️ ELIMINA ORDINE + OTTIMIZZA
  // ===============================
  async remove(id: number) {
    const order = await this.prisma.order.findUnique({ where: { id } })
    if (!order) throw new BadRequestException('Ordine non trovato')

    const resourceId = order.resourceId
    await this.prisma.order.delete({ where: { id } })

    if (resourceId) {
      await this.optimizeResourceTimeline(resourceId)
    }

    return { deleted: true, id }
  }

  // ===============================
  // 🔄 OTTIMIZZA TIMELINE RISORSA
  // ===============================
  async optimizeResourceTimeline(resourceId: number) {
    const resource = await this.prisma.resource.findUnique({ where: { id: resourceId } })
    if (!resource) return

    const orders = await this.prisma.order.findMany({
      where: { resourceId },
      include: { material: true },
      orderBy: { startDate: 'asc' },
    })

    if (orders.length === 0) return

    let currentTime = dayjs().hour(ORA_INIZIO).minute(0).second(0)

    for (const order of orders) {
      const coeffSqm = order.material?.coeff_mq ?? 0.5
      const coeffMl = order.material?.coeff_ml ?? 0.2

      const slot = await this.findFirstFreeSlot(
        resourceId,
        currentTime.toDate(),
        order.sqm ?? 0,
        order.ml ?? 0,
        coeffSqm,
        coeffMl,
        order.id
      )

      await this.prisma.order.update({
        where: { id: order.id },
        data: { startDate: slot.start, endDate: slot.end },
      })

      if ((resource.capacity ?? 1) === 1) {
        currentTime = dayjs(slot.end)
      }
    }
  }

  // ===============================
  // 🔍 TROVA PRIMO SLOT LIBERO (capacity parallela)
  // ===============================
  private async findFirstFreeSlot(
    resourceId: number,
    startFrom: Date,
    sqm: number,
    ml: number,
    coeffSqm: number,
    coeffMl: number,
    excludeOrderId?: number
  ): Promise<{ start: Date; end: Date }> {
    const resource = await this.prisma.resource.findUnique({ where: { id: resourceId } })
    const capacity = resource?.capacity ?? 1

    const orders = await this.prisma.order.findMany({
      where: {
        resourceId,
        id: excludeOrderId ? { not: excludeOrderId } : undefined,
      },
      orderBy: { startDate: 'asc' },
    })

    const durationMin = sqm * coeffSqm + ml * coeffMl
    if (!isFinite(durationMin) || durationMin <= 0)
      throw new BadRequestException('Durata calcolata non valida')

    let candidate = dayjs(startFrom)
    candidate = this.normalizeToWorkingHours(candidate)

    let attempts = 0
    while (attempts < 2000) {
      let endCandidate = this.computeEndWithinWorkingHours(candidate, durationMin)

      const overlapping = this.countOverlappingOrders(
        candidate.toDate(),
        endCandidate.toDate(),
        orders
      )

      if (overlapping < capacity) {
        return { start: candidate.toDate(), end: endCandidate.toDate() }
      }

      const blockingOrder = this.findFirstBlockingOrder(
        candidate.toDate(),
        endCandidate.toDate(),
        orders,
        capacity
      )

      if (blockingOrder) {
        candidate = dayjs(blockingOrder.endDate)
      } else {
        candidate = candidate.add(SLOT_STEP_MINUTES, 'minute')
      }

      candidate = this.normalizeToWorkingHours(candidate)
      attempts++
    }

    throw new BadRequestException('Impossibile trovare uno slot libero')
  }

  private normalizeToWorkingHours(ts: dayjs.Dayjs): dayjs.Dayjs {
    const h = ts.hour()
    if (h < ORA_INIZIO) {
      return ts.hour(ORA_INIZIO).minute(0).second(0).millisecond(0)
    }
    if (h >= ORA_FINE) {
      return ts.add(1, 'day').hour(ORA_INIZIO).minute(0).second(0).millisecond(0)
    }
    return ts
  }

  private computeEndWithinWorkingHours(startTs: dayjs.Dayjs, durationMin: number): dayjs.Dayjs {
    let remaining = durationMin
    let cursor = startTs

    while (remaining > 0) {
      const endOfDay = cursor.startOf('day').hour(ORA_FINE).minute(0).second(0)
      const availableToday = endOfDay.diff(cursor, 'minute')

      if (availableToday >= remaining) {
        cursor = cursor.add(remaining, 'minute')
        remaining = 0
      } else {
        remaining -= availableToday
        cursor = cursor
          .startOf('day')
          .add(1, 'day')
          .hour(ORA_INIZIO)
          .minute(0)
          .second(0)
      }
    }

    return cursor
  }

  private findFirstBlockingOrder(
    candidateStart: Date,
    candidateEnd: Date,
    orders: any[],
    capacity: number
  ): any | null {
    const overlappingOrders = orders.filter((o) => {
      const s1 = dayjs(o.startDate)
      const e1 = dayjs(o.endDate)
      const s2 = dayjs(candidateStart)
      const e2 = dayjs(candidateEnd)
      return s2.isBefore(e1) && e2.isAfter(s1)
    })

    if (overlappingOrders.length >= capacity) {
      overlappingOrders.sort(
        (a, b) => dayjs(a.endDate).valueOf() - dayjs(b.endDate).valueOf()
      )
      return overlappingOrders[0]
    }

    return null
  }

  private countOverlappingOrders(start: Date, end: Date, orders: any[]): number {
    return orders.filter((o) => {
      const s1 = dayjs(o.startDate)
      const e1 = dayjs(o.endDate)
      const s2 = dayjs(start)
      const e2 = dayjs(end)
      return s2.isBefore(e1) && e2.isAfter(s1)
    }).length
  }

  // ===============================
  // 🔍 TROVA PROSSIMO SLOT DISPONIBILE (NUOVO)
  // ===============================
  private async findNextAvailableSlot(
    resourceId: number,
    sqm: number,
    ml: number,
    coeffSqm: number,
    coeffMl: number
  ): Promise<{ start: Date; end: Date }> {
    let startFrom = dayjs()
    if (startFrom.hour() < ORA_INIZIO) {
      startFrom = startFrom.hour(ORA_INIZIO).minute(0).second(0).millisecond(0)
    } else if (startFrom.hour() >= ORA_FINE) {
      startFrom = startFrom
        .add(1, 'day')
        .hour(ORA_INIZIO)
        .minute(0)
        .second(0)
        .millisecond(0)
    } else {
      startFrom = startFrom.minute(startFrom.minute()).second(0).millisecond(0)
    }

    return this.findFirstFreeSlot(
      resourceId,
      startFrom.toDate(),
      sqm,
      ml,
      coeffSqm,
      coeffMl
    )
  }

  // ===============================
  // ✅ VERIFICA CAPACITY
  // ===============================
  private async checkCapacity(resourceId: number, start: Date, end: Date): Promise<boolean> {
    const resource = await this.prisma.resource.findUnique({ where: { id: resourceId } })
    const capacity = resource?.capacity ?? 1

    const orders = await this.prisma.order.findMany({ where: { resourceId } })
    const overlapping = this.countOverlappingOrders(start, end, orders)
    return overlapping < capacity
  }
}
