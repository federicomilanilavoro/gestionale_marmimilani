import { IsString, IsInt, Min, IsOptional } from 'class-validator'

export class CreateResourceDto {
  @IsString()
  name: string

  @IsString()
  type: string

  @IsInt()
  @Min(1)
  capacity: number
}
