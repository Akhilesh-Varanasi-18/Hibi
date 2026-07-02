const permissionTypeSchema = require("../../models/PermissionSchemaManagement/permissionTypesSchema");
const { getISTDateAndTime } = require("../../utils/timeFunction");
const { productDefinedPermissionTypes } = require("../../config/productDefined"); // Add this import
const logger = require("../../utils/logger");

const mongoose = require("mongoose");

const addPermissionType = async (req, res) => {
  try {
    const { permissionType } = req.body;
    const employeeId = req?.user?._id;


    // Validate input
    if (!permissionType || typeof permissionType !== "string" || permissionType.trim() === ""){
      return res.status(400).json({ error: "Invalid permission type", data: "Permission type is required and must be a non-empty string",});
    }

    // Check if the permission type already exists
    const existingPermissionType = await permissionTypeSchema.findOne({ permissionType: permissionType.toUpperCase().trim(), orgId: req?.user?.orgId });
    if (existingPermissionType) {
      return res.status(400).json({ error: "Permission type already exists", data: "This Permission type already exists" });
    }


    // Create new Permission type
    const newPermissionType = new permissionTypeSchema({
      permissionType: permissionType.toUpperCase().trim(),
      createdBy: employeeId,
      updatedBy: employeeId,
      createdAt: getISTDateAndTime(),
      updatedAt: getISTDateAndTime(),
      orgId: req?.user?.orgId
    });
    await newPermissionType.save();

    logger.info(`Permission type '${permissionType}' added by user ${req.user.firstName} ${req.user.lastName}`);
    res.status(201).json({ message: "Permission type added successfully" });
  } 
  catch (error) {
    console.error("Error while adding Permission type:", error);
    res
      .status(500)
      .json({
        error: "Internal server error",
        data: "Error while adding Permission type",
      });
  }
};


const updatePermissionType = async (req, res) => {
    try {
        const { permissionType, permissionTypeId } = req.body;
        const employeeId = req?.user?._id;

        // Validate input
        if (!permissionType || typeof permissionType !== "string" || permissionType.trim() === "")
            return res.status(400).json({ error: "Invalid permission type", data: "Permission type is required and must be a non-empty string" });


        if (!permissionTypeId || !mongoose.Types.ObjectId.isValid(permissionTypeId))
            return res.status(400).json({ error: "Invalid permission type ID", data: "Permission type ID is required and must be a valid ObjectId" });

        const existingPermissionType = await permissionTypeSchema.findOne({ _id: permissionTypeId });
        if (!existingPermissionType)
            return res.status(404).json({ error: "Permission type not found", data: "No Permission type found with the provided ID" });

        if (productDefinedPermissionTypes.includes(existingPermissionType.permissionType)) {
            return res.status(403).json({ message: "This is a product defined permission type and cannot be updated." });
        }

        // Find and update Permission type
        const updatedPermissionType = await permissionTypeSchema.findByIdAndUpdate(
            permissionTypeId,
            {
                permissionType: permissionType.toUpperCase().trim(),
                updatedBy: employeeId,
                updatedAt: getISTDateAndTime(),
            },
            { new: true }
        );

        if (!updatedPermissionType)
            return res.status(404).json({ error: "Permission type not found", data: "No Permission type found with the provided ID" });

        logger.info(`Permission type '${existingPermissionType.permissionType}' updated to '${permissionType}' by user ${req.user.firstName} ${req.user.lastName}`);
        res.status(200).json({ message: "Permission type updated successfully" });
    }
    catch (error) {
        console.error("Error while updating Permission type:", error);
        res.status(500).json({ error: "Internal server error", data: "Error while updating Permission type" });
    }
}


const deletePermissionType = async (req, res) => {
    try {
        const { permissionTypeId } = req.params;
        console.log("This is Permission Type:", permissionTypeId);

        // Validate input
        if (!permissionTypeId || !mongoose.Types.ObjectId.isValid(permissionTypeId))
            return res.status(400).json({ error: "Invalid permission type ID", data: "Permission type ID is required and must be a valid ObjectId" });
        
        // Find permission type
        const permissionTypeDoc = await permissionTypeSchema.findById(permissionTypeId);
        if (!permissionTypeDoc)
            return res.status(404).json({ error: "Permission type not found", data: "No Permission type found with the provided ID" });

        // Restrict deletion if product defined
        if (productDefinedPermissionTypes.includes(permissionTypeDoc.permissionType)) {
            return res.status(403).json({ message: "This is a product defined permission type and cannot be deleted." });
        }

        // Delete permission type
        await permissionTypeSchema.findByIdAndDelete(permissionTypeId);

        logger.info(`Permission type '${permissionTypeDoc.permissionType}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
        res.status(200).json({ message: "Permission type deleted successfully" });
    } 
    catch (error) {
        console.error("Error while deleting Permission type:", error);
        res.status(500).json({ error: "Internal server error", data: "Error while deleting Permission type" });
    }
};


const getPermissionTypes = async (req, res) => {
  try {
    const permissionTypes = await permissionTypeSchema.find({orgId: req?.user?.orgId},{permissionType: 1});
    if (permissionTypes.length === 0) {
      return res.status(404).json({ message: "No permission types found" });
    }
    res.status(200).json(permissionTypes);
  }
    catch (error) {
        console.error("Error while fetching permission types:", error);
        res.status(500).json({ error: "Internal server error", data: "Error while fetching permission types" });
    }
}



// const addOrgIdToPermissionTypes = async (orgId) => {
//   try {
//     // Update all permission types to include orgId
//     await permissionTypeSchema.updateMany(
//       {},
//       { $set: { orgId: orgId } }
//     );
//     console.log("Organization ID added to all permission types successfully");
//   } catch (error) {
//     console.error("Error while adding organization ID to permission types:", error);
//   }
// };


// setTimeout(async () => {
//   await addOrgIdToPermissionTypes("68a5eea64c4a3070733ceeac");
// }, 1000);

module.exports = {
  addPermissionType,
  updatePermissionType,
  deletePermissionType,
  getPermissionTypes,
};
