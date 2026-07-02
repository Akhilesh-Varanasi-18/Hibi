const mongoose = require('mongoose');
require('dotenv').config();

// We load the schemas directly from your actual backend codebase
const employeeSchema = require('./src/models/EmployeeSchemaManagement/employeeSchema');
const departmentSchema = require('./src/models/EmployeeSchemaManagement/departmentSchema');
const designationSchema = require('./src/models/EmployeeSchemaManagement/designationSchema');
const teamSchema = require('./src/models/teamSchema');

// Update this if you use a different login email!
const YOUR_EMAIL = 'babji@toriiminds.com'; // Replace with the admin email you use to login

async function setupOrganizationData() {
    try {
        console.log("Connecting to Database (this might take a few seconds)...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB natively!");

        console.log(`[1] Looking up your Admin profile for email: ${YOUR_EMAIL}`);
        const employee = await employeeSchema.findOne({
            $or: [
                { personalEmail: YOUR_EMAIL },
                { officeMail: YOUR_EMAIL }
            ]
        });

        if (!employee) {
            throw new Error(`Could not find an employee with email ${YOUR_EMAIL}`);
        }

        const adminId = employee._id;
        const orgId = employee.orgId;
        console.log(`✅ Found you! Admin ID: ${adminId} | Org ID: ${orgId}`);

        console.log(`[2] Creating Department 'IT'...`);
        const existingDept = await departmentSchema.findOne({ name: 'IT', orgId });
        if (!existingDept) {
            const newDepartment = new departmentSchema({
                name: 'IT',
                managerId: adminId,
                createdBy: adminId,
                updatedBy: adminId,
                orgId: orgId
            });
            await newDepartment.save();
            console.log(`✅ Department IT Created!`);
        } else {
            console.log(`⚠️ Department IT already exists. Skipping.`);
        }

        console.log(`[3] Creating Designation 'Developer'...`);
        const existingDesig = await designationSchema.findOne({ title: 'Developer', orgId });
        if (!existingDesig) {
            const newDesignation = new designationSchema({
                title: 'Developer',
                roles: 'Standard Employee',
                responsibilities: 'General tasks',
                createdBy: adminId,
                updatedBy: adminId,
                orgId: orgId
            });
            await newDesignation.save();
            console.log(`✅ Designation Developer Created!`);
        } else {
            console.log(`⚠️ Designation Developer already exists. Skipping.`);
        }

        console.log(`[4] Creating Team 'Torii'...`);
        const existingTeam = await teamSchema.findOne({ teamName: 'Torii', orgId });
        if (!existingTeam) {
            const newTeam = new teamSchema({
                orgId: orgId,
                teamName: 'Torii',
                managerIds: [adminId],
                teamLeadIds: [],
                createdBy: adminId,
                updatedBy: adminId
            });
            await newTeam.save();

            // Finally, map your CEO to the team
            await employeeSchema.updateOne(
                { _id: adminId },
                { $set: { teamId: newTeam._id } }
            );

            console.log(`✅ Team Torii Created and mapped to you!`);
        } else {
            console.log(`⚠️ Team Torii already exists. Skipping.`);
        }

        console.log("🎉 All configurations successfully injected into DB!");
        process.exit(0);
        
    } catch (error) {
        console.error("❌ Fatal Error:", error.message);
        process.exit(1);
    }
}

setupOrganizationData();
