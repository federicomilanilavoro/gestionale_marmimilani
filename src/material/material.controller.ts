import { Controller, Get, Post, Body, Delete, Param, Put} from '@nestjs/common'
import { MaterialService } from './material.service'

@Controller('materials')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Get()
  findAll() {
    return this.materialService.findAll()
  }

  @Post()
  create(@Body() data: any) {
    return this.materialService.create(data)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.materialService.update(Number(id), data)
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.materialService.delete(Number(id))
  }
}


//Perfetto. Questo file — material.controller.ts — è il volante con cui il tuo backend risponde alle richieste del mondo esterno.
//Quando il frontend chiama un’API come GET /materials, questa è la classe che prende in mano la situazione.
//
//Vediamolo nel dettaglio, riga per riga, così capisci come scorre il sangue dentro NestJS.
//
//🧭 1. Il decoratore @Controller('materials')
//@Controller('materials')
//export class MaterialController {
//
//
//Significa che tutti gli endpoint dentro questa classe iniziano con /materials.
//
//Esempio pratico:
//
//GET /materials → chiama findAll()
//
//POST /materials → chiama create()
//
//DELETE /materials/:id → chiama delete()
//
//Questo mapping è automatico: NestJS costruisce per te la rotta e gestisce parametri, body, ecc.
//
//🧱 2. Iniezione del servizio (MaterialService)
//constructor(private readonly materialService: MaterialService) {}
//
//
//Questa riga dice: “voglio usare un oggetto MaterialService, creato e gestito dal sistema NestJS”.
//
//Non lo crei tu a mano — viene iniettato automaticamente grazie alla Dependency Injection.
//Il MaterialService contiene tutta la logica del database (lo vedremo subito dopo).
//
//🔍 3. Endpoint: GET /materials
//@Get()
//findAll() {
//  return this.materialService.findAll()
//}
//
//
//Quando arriva una richiesta HTTP GET /materials, NestJS chiama findAll().
//Dentro, tu a tua volta chiami materialService.findAll() → che interroga Prisma → che pesca i dati dal database PostgreSQL → e li restituisce al frontend in formato JSON.
//
//🪄 4. Endpoint: POST /materials
//@Post()
//create(@Body() data: any) {
//  return this.materialService.create(data)
//}
//
//
//Questo riceve i dati di un nuovo materiale nel body della richiesta (in JSON).
//NestJS, grazie al decoratore @Body(), fa automaticamente il parsing del corpo HTTP.
//Il MaterialService.create() scrive poi nel DB il nuovo record.
//
//🧨 5. Endpoint: DELETE /materials/:id
//@Delete(':id')
//delete(@Param('id') id: string) {
//  return this.materialService.delete(Number(id))
//}
//
//
//Qui invece catturi un parametro dinamico (:id) dell’URL.
//Esempio: se fai una richiesta DELETE /materials/5, id sarà "5".
//Lo converti in numero e lo passi al service per cancellare quel record.
//
//In sostanza:
//
//Metodo HTTP	URL	Funzione chiamata	Cosa fa
//GET	/materials	findAll()	Legge tutti i materiali
//POST	/materials	create()	Aggiunge un nuovo materiale
//DELETE	/materials/:id	delete()	Cancella un materiale