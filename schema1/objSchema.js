module.exports = {
  properties: {
    association: {
      id: { required: true, $type: String },
      name: { required: true, $type: String },
      isApproved: { required: true, $type: Boolean }
    },
    branchId: { required: true, $type: String },
    email: { required: true, $type: String },
    favouriteCourses: { required: true, $type: [String] },
    firstName: { required: true, $type: String },
    lastName: { required: true, $type: String },
    password: { required: true, $type: String }
  },
  topLevelRequiredFields: ['association']
};
