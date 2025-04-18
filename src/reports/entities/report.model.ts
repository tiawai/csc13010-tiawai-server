import { IsEmail, IsString } from 'class-validator';
import {
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { User } from 'src/users/entities/user.model';

export enum ReportStatus {
    PENDING = 'Pending',
    IN_PROGRESS = 'In Progress',
    RESOLVED = 'Resolved',
}

@Table({
    tableName: 'reports',
    timestamps: true,
})
export class Report extends Model {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
    })
    @IsString()
    declare id: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    @IsString()
    fullname: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    @IsEmail()
    email: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    phone: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    @IsString()
    content: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        defaultValue: ReportStatus.PENDING,
    })
    status: ReportStatus;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    @IsString()
    manageBy: string;
}
