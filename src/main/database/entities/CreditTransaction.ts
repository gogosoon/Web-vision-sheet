import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { BaseClassEntity } from './BaseClassEntity'
import { User } from './User'

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT'
}

@Entity('CreditTransaction')
export class CreditTransaction extends BaseClassEntity {
  static prefix = 'ct_'

  @Index()
  @Column({ type: 'varchar', length: 191 })
  userId: string

  @ManyToOne(() => User, (u: User) => u.creditTransactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User

  @Column({ type: 'integer' })
  creditAmount: number

  @Column({ type: 'varchar' })
  type: TransactionType

  @Column({ type: 'text', nullable: true })
  usageDetailsComments: string | null

  @Column({ type: 'text', nullable: true })
  usageDetailsJsonDump: string | null
}


