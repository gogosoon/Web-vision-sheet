import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { BaseClassEntity } from './BaseClassEntity'
import { User } from './User'

@Entity('DesktopToken')
export class DesktopToken extends BaseClassEntity {
  static prefix = 'dt_'

  @Index()
  @Column({ type: 'varchar', unique: true, length: 191 })
  token: string

  @Index()
  @Column({ type: 'varchar', length: 191 })
  userId: string

  @ManyToOne(() => User, (u: User) => u.desktopTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User

  @Column({ type: 'timestamptz' })
  expires: Date

  @Column({ type: 'timestamptz', nullable: true })
  logged_in_at: Date | null
}
