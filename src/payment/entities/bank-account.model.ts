import {
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { User } from 'src/users/entities/user.model';

@Table({
    tableName: 'bank_accounts',
    timestamps: true,
})
export class BankAccount extends Model {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
    })
    declare id: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    userId: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    accountNumber: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    accountHolderName: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    bankName: string;
}
