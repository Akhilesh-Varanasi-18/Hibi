const Permission = require('../../models/PermissionSchemaManagement/permissionSchema');
const Organization = require('../../models/organizationSchema');
const { getISTDateAndTime } = require('../../utils/timeFunction');
const logger = require('../../utils/logger');

// Create a new Permission
exports.createPermission = async (req, res) => {
  try {
    const { name, description, routes } = req.body;
    const organizationId = req.user.organizationId; // Assuming organizationId is available from auth middleware

    if (!name || !routes || routes.length === 0) {
      return res.status(400).json({ success: false, message: 'Permission name and at least one route are required.' });
    }

    // Check if a permission with the same name already exists for this organization
    const existingPermission = await Permission.findOne({ name, organizationId });
    if (existingPermission) {
      return res.status(409).json({ success: false, message: 'A permission with this name already exists for your organization.' });
    }

    const newPermission = new Permission({
      name,
      description,
      organizationId,
      routes,
    });

    await newPermission.save();
    logger.info(`Permission '${name}' created by user ${req.user.firstName} ${req.user.lastName}`);
    res.status(201).json({ success: true, message: 'Permission created successfully.', data: newPermission });
  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all Permissions for an organization
exports.getAllPermissions = async (req, res) => {
  try {
    const organizationId = req.user.organizationId; // Assuming organizationId is available from auth middleware
    const permissions = await Permission.find({ organizationId });
    res.status(200).json({ success: true, message: 'Permissions fetched successfully.', data: permissions });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update a Permission
exports.updatePermission = async (req, res) => {
  try {
    const { id } = req.params; // Permission ID from URL
    const { name, description, routes } = req.body;
    const organizationId = req.user.organizationId; // Assuming organizationId is available from auth middleware

    if (!name || !routes || routes.length === 0) {
      return res.status(400).json({ success: false, message: 'Permission name and at least one route are required.' });
    }

    // Ensure the permission belongs to the organization
    const permission = await Permission.findOne({ _id: id, organizationId });
    if (!permission) {
      return res.status(404).json({ success: false, message: 'Permission not found or you do not have access.' });
    }

    // Check for duplicate name if name is being changed
    if (name !== permission.name) {
      const existingPermission = await Permission.findOne({ name, organizationId });
      if (existingPermission) {
        return res.status(409).json({ success: false, message: 'A permission with this name already exists for your organization.' });
      }
    }

    permission.name = name;
    permission.description = description;
    permission.routes = routes;
    // Update updatedAt timestamp if you have one in your schema
    // permission.updatedAt = getISTDateAndTime();

    await permission.save();
    logger.info(`Permission '${name}' updated by user ${req.user.firstName} ${req.user.lastName}`);
    res.status(200).json({ success: true, message: 'Permission updated successfully.', data: permission });
  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete a Permission
exports.deletePermission = async (req, res) => {
  try {
    const { id } = req.params; // Permission ID from URL
    const organizationId = req.user.organizationId; // Assuming organizationId is available from auth middleware

    // Ensure the permission belongs to the organization before deleting
    const result = await Permission.deleteOne({ _id: id, organizationId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Permission not found or you do not have access.' });
    }

    logger.info(`Permission with ID '${id}' deleted by user ${req.user.firstName} ${req.user.lastName}`);
    res.status(200).json({ success: true, message: 'Permission deleted successfully.' });
  } catch (error) {
    console.error('Error deleting permission:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};


