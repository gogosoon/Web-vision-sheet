import { Entity, Column, Index } from 'typeorm'
import { BaseClassEntity } from './BaseClassEntity'

@Entity('Waitlist')
export class Waitlist extends BaseClassEntity {
  static prefix = 'wl_'

  @Index()
  @Column({ type: 'varchar', unique: true, length: 191 })
  email: string

  @Column({ type: 'varchar', length: 191, nullable: true })
  ipAddress: string | null

  @Column({ type: 'text', nullable: true })
  userAgent: string | null

}
