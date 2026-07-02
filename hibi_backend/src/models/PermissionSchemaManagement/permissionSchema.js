const mongoose = require('mongoose');

const routeAccessSchema = new mongoose.Schema({
  method: { 
    type: String,
    required: true
  }, // e.g., 'POST'
  path: {
    type: String,
    required: true
  }    // e.g., '/api/employees/add-new-employee'
}, { _id: false }); // _id: false prevents Mongoose from creating an _id for subdocuments

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }, // e.g., "Can Manage All Employee Data"
  description: {
    type: String
  }, // Optional: A more detailed description for the admin
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  routes: [routeAccessSchema] // Array of routes this permission grants access to
});

module.exports = mongoose.model('Permission', permissionSchema);
