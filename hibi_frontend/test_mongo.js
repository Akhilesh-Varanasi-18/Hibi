const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/hrms')
  .then(async () => {
    console.log('MongoDB connected successfully!');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check if employees collection exists and has data
    const employeesCount = await mongoose.connection.db.collection('employees').countDocuments().catch(() => 0);
    console.log('Employees count:', employeesCount);
    
    // Try to find the demo2 user
    const employee = await mongoose.connection.db.collection('employees').findOne({
      $or: [
        { personalEmail: 'demo2' },
        { employeeCode: 'demo2' },
        { officeMail: 'demo2' }
      ]
    });
    console.log('Found employee:', employee ? 'YES' : 'NO');
    if (employee) {
      console.log('Employee keys:', Object.keys(employee));
    }
    
    await mongoose.disconnect();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });
