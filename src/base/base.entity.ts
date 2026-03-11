import { PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { AutoMap } from '@automapper/classes'

export abstract class BaseEntity<T = number> {
  @AutoMap()
  @PrimaryGeneratedColumn()
  id!: T

  @AutoMap()
  @Column({ type: 'varchar', length: 100 })
  createdBy!: string

  @AutoMap()
  @CreateDateColumn({ type: 'timestamptz' })
  createdDateTime!: Date

  @AutoMap()
  @Column({ type: 'varchar', length: 100 })
  lastModifiedBy!: string

  @AutoMap()
  @UpdateDateColumn({ type: 'timestamptz' })
  lastModifiedDateTime!: Date
}
