import {
    BaseEntity,
    BeforeInsert,
    CreateDateColumn,
    DeleteDateColumn,
    PrimaryColumn,
    UpdateDateColumn
} from 'typeorm'
import { v7 as uuidv7 } from 'uuid'

export class BaseClassEntity extends BaseEntity {
  static prefix = ''

  @PrimaryColumn({ type: 'varchar', length: 191 })
  id: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      const prefix = (this.constructor as any).prefix || ''

      console.log('prefix', prefix)
      console.log('this.constructor.name', this.constructor.name)

      // Validation: Warn if no prefix is set for non-base entities
      if (!prefix && this.constructor.name !== 'BaseClassEntity') {
        console.warn(`Warning: Entity ${this.constructor.name} has no prefix defined`)
      }

      this.id = prefix + uuidv7()
    }
  }
}
