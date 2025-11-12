// src/prisma/prisma.service.ts
import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // 👇 forza il tipo solo qui, senza toccare il resto
    (this as any).$on('beforeExit', async () => {
      await app.close();
    });
  }
}

//Hai qui un’implementazione molto pulita e classica.
//
//1️⃣ Estende PrismaClient
//export class PrismaService extends PrismaClient implements OnModuleInit
//
//
//Vuol dire che eredita tutti i metodi standard di Prisma:
//
//this.material.findMany()
//
//this.customer.create()
//
//this.order.delete()
//…e così via per ogni tabella.
//
//2️⃣ Connessione automatica al DB
//async onModuleInit() {
//  await this.$connect();
//}
//
//
//Appena NestJS accende l’app, Prisma apre la connessione con il database PostgreSQL (usando la variabile DATABASE_URL che sta nel file .env).
//
//3️⃣ Chiusura pulita all’arresto
//async enableShutdownHooks(app: INestApplication) {
//  (this as any).$on('beforeExit', async () => {
//    await app.close();
//  });
//}
//
//
//Questa è una chicca elegante: serve per chiudere in modo sicuro la connessione quando l’app Nest si spegne (ad esempio quando Docker ferma il container).
//Senza questo hook, Prisma potrebbe lasciare connessioni pendenti.
//
//Riassumendo il backend
//
//Ora hai compreso il ciclo vitale completo:
//
//main.ts          → accende AppModule
//AppModule        → registra Prisma + Material + Customer + Order
//MaterialController → riceve richieste HTTP
//MaterialService   → chiama PrismaService
//PrismaService     → parla col DB PostgreSQL
//
//
//Ogni modulo segue esattamente lo stesso schema (Customer, Order, ecc.).
//Hai un backend pulito, scalabile e facile da estendere.