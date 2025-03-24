import { Column, Model, Table } from 'sequelize-typescript';
import { Role } from '../../auth/enums/roles.enum';
import { DataTypes } from 'sequelize';
import { Gender } from '../../auth/enums/gender.enum';

@Table({
    tableName: 'accounts',
    timestamps: true,
})
export class User extends Model {
    // Basic info
    @Column({
        primaryKey: true,
        unique: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
    })
    declare id: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    username: string;

    @Column({
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    })
    email: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    password: string;

    @Column({
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    })
    phone: string;

    @Column({
        type: DataTypes.DATE,
        allowNull: false,
    })
    birthdate: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    gender: Gender;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    address: string;

    @Column({
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    })
    declare createdAt: Date;

    @Column({
        type: DataTypes.DATE,
        allowNull: true,
    })
    declare updatedAt: Date;

    @Column({
        type: DataTypes.STRING,
        allowNull: true,
    })
    otp: string;

    @Column({
        type: DataTypes.DATE,
        allowNull: true,
    })
    otpExpiry: Date;

    @Column({
        type: DataTypes.STRING,
    })
    role: Role;

    @Column({
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: process.env.DEFAULT_PROFILE_IMAGE,
    })
    profileImage: string;

    // For student
    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    balance: number;
}
