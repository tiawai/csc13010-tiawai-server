import { QueryInterface, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export = {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('accounts', {
            id: {
                primaryKey: true,
                unique: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            phone: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            address: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            birthdate: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            otp: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            otpExpiry: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            role: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            balance: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            profileImage: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: process.env.DEFAULT_PROFILE_IMAGE,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable('accounts');
    },
};
