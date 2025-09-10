import {
  Column,
  Entity,
  OneToMany
} from 'typeorm'
import { BaseClassEntity } from './BaseClassEntity'
import type { CreditTransaction } from './CreditTransaction'
import type { DesktopToken } from './DesktopToken'

@Entity('User')
export class User extends BaseClassEntity {
  static prefix = 'u_'

  @Column({ nullable: true })
  name: string | null

  @Column({ unique: true, nullable: true, type: 'varchar' })
  email: string | null

  @Column({ type: 'timestamptz', nullable: true })
  emailVerified: Date | null

  @Column({ nullable: true, type: 'varchar' })
  image: string | null

  @Column({ nullable: true, type: 'text' })
  bio: string | null

  @Column({ type: 'integer', default: 50 })
  credits: number

  @OneToMany(
    () => require('./CreditTransaction').CreditTransaction,
    (ct: CreditTransaction) => ct.user
  )
  creditTransactions: CreditTransaction[]

  @OneToMany(() => require('./DesktopToken').DesktopToken, (dt: DesktopToken) => dt.user)
  desktopTokens!: DesktopToken[]
}
