// backend/src/main.ts
import { NestFactory } from '@nestjs/core'  //NestFactory è la fabbrica che costruisce l’intera applicazione NestJS.
//Quando la usi, crei un server HTTP interno (usando Express o Fastify, ma per default è Express).


import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)   //NestFactory.create(AppModule) inizializza tutti i moduli e servizi definiti nel progetto.

//AppModule è il “modulo radice” che contiene tutti gli altri (Customer, Material, Order…).

  app.enableCors({
    origin: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  })
  await app.listen(process.env.PORT || 3000, '0.0.0.0')//app.listen(3000) avvia il server HTTP sulla porta 3000 (quella a cui il frontend React farà richieste).

  // log opzionale:
  const addr = await app.getUrl()
  console.log(`✅ Backend pronto su ${addr}`)
}
bootstrap()
