import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class MaterialService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.material.findMany({ orderBy: { id: 'asc' } })
  }

  create(data: Prisma.MaterialCreateInput) {
    return this.prisma.material.create({ data })
  }
  
  async update(id: number, data: { name?: string; type?: string; coeff_mq?: number; coeff_ml?: number }) {
    return this.prisma.material.update({
      where: { id },
      data,
    })
  }

  delete(id: number) {
    return this.prisma.material.delete({ where: { id } })
  }
}



//Perfetto. Questo è il cuore pulsante del backend: il MaterialService, dove finalmente si tocca il database vero e proprio.
//
//In NestJS il “Service” è il livello che contiene la logica applicativa, cioè tutto ciò che non riguarda direttamente le richieste HTTP ma il lavoro vero: scrivere, leggere, cancellare, elaborare.
//Vediamolo in profondità.
//
//⚙️ 1. @Injectable() e il principio di iniezione
//@Injectable()
//export class MaterialService {
//  constructor(private prisma: PrismaService) {}
//
//
//Il decoratore @Injectable() dice a NestJS che questa classe può essere iniettata altrove, per esempio nel controller.
//Quando MaterialController chiede un MaterialService, NestJS lo crea e gli passa automaticamente anche il PrismaService (cioè l’oggetto che sa parlare con il database PostgreSQL).
//
//Questa catena di iniezioni fa sì che tu non debba mai fare new PrismaClient() a mano — l’app è modulare e scalabile.
//
//📚 2. Metodo findAll()
//findAll() {
//  return this.prisma.material.findMany({ orderBy: { id: 'asc' } })
//}
//
//
//Traduzione letterale:
//“chiedi al database tutti i materiali, ordinati per id crescente”.
//
//Qui Prisma è il tuo ORM (Object-Relational Mapper): un livello che ti permette di scrivere query SQL usando TypeScript tipizzato.
//prisma.material.findMany() corrisponde a qualcosa come:
//
//SELECT * FROM Material ORDER BY id ASC;
//
//
//Il risultato è un array di oggetti JSON che NestJS restituirà direttamente al frontend.
//
//🧱 3. Metodo create()
//create(data: Prisma.MaterialCreateInput) {
//  return this.prisma.material.create({ data })
//}
//
//
//Qui Prisma fa il lavoro inverso: prende i dati che arrivano dal body HTTP ({ name, type, coeff_mq, coeff_ml, ... }) e li inserisce nella tabella corrispondente.
//
//In SQL sarebbe:
//
//INSERT INTO Material (name, type, coeff_mq, coeff_ml)
//VALUES ('marmo', 'pietra', 3, 4);
//
//🗑️ 4. Metodo delete()
//delete(id: number) {
//  return this.prisma.material.delete({ where: { id } })
//}
//
//
//Questa riga cancella il materiale con l’id corrispondente, in SQL:
//
//DELETE FROM Material WHERE id = 5;
//
//🧬 5. Come tutto si incastra
//
//Hai adesso l’intero flusso completo, che funziona così:
//
//Frontend → (POST /materials)
//→ MaterialController.create()
//→ MaterialService.create()
//→ PrismaService.material.create()
//→ PostgreSQL scrive i dati
//→ risposta JSON al frontend
//
//
//E lo stesso vale per findAll() e delete().
//
//🔌 Prisma come ponte
//
//Dietro a tutto questo c’è il PrismaService, che incapsula la connessione col database e fornisce i metodi .material, .customer, .order, ecc.
//È lui che traduce le tue istruzioni in SQL.