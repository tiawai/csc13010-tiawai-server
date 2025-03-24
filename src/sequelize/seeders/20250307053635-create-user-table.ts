import { QueryInterface, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';
import { Role } from '../../auth/enums/roles.enum';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Gender } from '../../auth/enums/gender.enum';

dotenv.config();

export = {
    async up(queryInterface: QueryInterface) {
        const saltRounds = process.env.SALT ? parseInt(process.env.SALT) : 10;

        const adminPassword = await bcrypt.hash(
            process.env.ADMIN_PASSWORD,
            saltRounds,
        );
        const teacherPassword = await bcrypt.hash(
            process.env.DEFAULT_TEACHER_PASSWORD,
            saltRounds,
        );
        const studentPassword = await bcrypt.hash(
            process.env.DEFAULT_STUDENT_PASSWORD,
            saltRounds,
        );

        const adminEmail = process.env.ADMIN_EMAIL;
        const teacherEmail = 'teacher@tiawai.co';
        const studentEmail = 'student@tiawai.co';

        // Check if the admin already exists
        const [existingUser] = await queryInterface.sequelize.query(
            `SELECT id FROM accounts WHERE email IN (:emails) LIMIT 1`,
            {
                replacements: {
                    emails: [adminEmail, teacherEmail, studentEmail],
                },
                type: QueryTypes.SELECT,
            },
            // Add more user objects as needed
        );

        if (!existingUser) {
            await queryInterface.bulkInsert('accounts', [
                {
                    id: crypto.randomUUID(),
                    username: process.env.ADMIN_USERNAME || 'admin01',
                    email: adminEmail,
                    password: adminPassword,
                    gender: Gender.MALE,
                    phone: '1234567890',
                    address: 'Ho Chi Minh City, Vietnam',
                    birthdate: new Date('1990-01-01'),
                    role: Role.ADMIN,
                    balance: 0,
                    profileImage: process.env.DEFAULT_PROFILE_IMAGE,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: crypto.randomUUID(),
                    username: 'teacher01',
                    email: teacherEmail,
                    password: teacherPassword,
                    gender: Gender.MALE,
                    phone: '0987654321',
                    address: 'Hanoi, Vietnam',
                    birthdate: new Date('1995-05-15'),
                    role: Role.TEACHER,
                    balance: 1000000,
                    profileImage: process.env.DEFAULT_PROFILE_IMAGE,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: crypto.randomUUID(),
                    username: 'student01',
                    email: studentEmail,
                    password: studentPassword,
                    gender: Gender.FEMALE,
                    phone: '0123456789',
                    address: 'Da Nang, Vietnam',
                    birthdate: new Date('2000-09-20'),
                    role: Role.STUDENT,
                    balance: 0,
                    profileImage: process.env.DEFAULT_PROFILE_IMAGE,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
        }
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.bulkDelete('accounts', null, {});
    },
};
