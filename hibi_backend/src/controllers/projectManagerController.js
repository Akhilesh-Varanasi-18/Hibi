const productManagerSchema = require("../models/productManagerSchema");
const organizationSchema = require("../models/organizationSchema.js");
const privilegeSchema = require("../models/EmployeeSchemaManagement/privilegeSchema");
const rolesSchema = require("../models/EmployeeSchemaManagement/rolesSchema");
const { getISTDateAndTime } = require("../utils/timeFunction");
const logger = require("../utils/logger");

const bcrypt = require("bcrypt");
const saltRounds = 12;

// Function to add a new product manager
const addProductManager = async (req, res) => {
  try {
    const { userName, password } = req.body;

    // Validate required fields
    if (!userName || !password) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields" });
    }

    // Check if the product manager email already exists
    const existingProductManager = await productManagerSchema.findOne({
      userName,
    });
    if (existingProductManager) {
      return res
        .status(400)
        .json({ message: "Product manager with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new product manager instance
    const productManager = new productManagerSchema({
      userName,
      password: hashedPassword,
      createdAt: getISTDateAndTime(),
      updatedAt: getISTDateAndTime(),
    });

    await productManager.save();
    logger.info(`Product manager with username '${userName}' added by user ${req.user.firstName} ${req.user.lastName}`);
    res.status(201).json({ message: "Product manager added successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add Product manager",
      error: error.message,
    });
  }
};

// Function to update a product manager
const updateProductManager = async (req, res) => {
  try {
    const { userName, password, productManagerId } = req.body;

    // Validate required fields
    if (!productManagerId) {
      return res
        .status(400)
        .json({ message: "Product Manager ID is required" });
    }

    // Check if the product manager exists
    const productManager = await productManagerSchema.findById(
      productManagerId
    );
    if (!productManager) {
      return res.status(404).json({ message: "Product manager not found" });
    }

    // Update the product manager details
    userName && (productManager.userName = userName);
    password &&
      (productManager.password = await bcrypt.hash(password, saltRounds));
    productManager.updatedAt = getISTDateAndTime();
    await productManager.save();
    logger.info(`Product manager with username '${productManager.userName}' updated by user ${req.user.firstName} ${req.user.lastName}`);
    res.status(200).json({ message: "Product manager updated successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update product manager",
      error: error.message,
    });
  }
};

// Function to get all organizations and their heads
const getAllOrganizationAndHeadData = async (req, res) => {
  console.log("Fetching all organizations and heads data");
  try {
    const organizationHeadRoleId = await rolesSchema.findOne(
      { name: "ORGANIZATIONHEAD" },
      { _id: 1 }
    );

    const organizationsWithHeads = await organizationSchema.aggregate([
      {
        $lookup: {
          from: "employees",
          localField: "orgHeadId",
          foreignField: "_id",
          as: "organizationHeads",
        },
      },
      {
        $unwind: {
          path: "$organizationHeads",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          address: 1,
          gstNumber: 1,
          status: 1,
          regDate: 1,
          organizationEmail: 1,
          "organizationHeads._id": 1,
          "organizationHeads.employeeCode": 1,
          "organizationHeads.firstName": 1,
          "organizationHeads.lastName": 1,
          "organizationHeads.personalEmail": 1,
          "organizationHeads.officeMail": 1,
          "organizationHeads.phone": 1,
          "organizationHeads.roleId": 1,
          "organizationHeads.privilegeId": 1,
          "organizationHeads.profileImage": 1
        },
      },
    ]);
    if (!organizationsWithHeads || organizationsWithHeads.length === 0) {
      return res.status(404).json({ message: "No Organizations found" });
    }

    return res.status(200).json({ organizations: organizationsWithHeads });
  } catch (error) {
    console.error(
      "Error while fetching all Organizations and Heads data: ",
      error
    );
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = {
  addProductManager,
  updateProductManager,
  getAllOrganizationAndHeadData,
};
