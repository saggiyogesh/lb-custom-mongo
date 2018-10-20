module.exports = {
  properties: {
    aboutMe: String,
    address: String,
    association: {
      id: { required: true, $type: String },
      name: { required: true, $type: String },
      isApproved: { required: true, $type: Boolean }
    },
    auth0UserId: String,
    branchId: String,
    businessName: String,
    city: String,
    coOrdinatedGroups: String,
    country: String,
    creationTime: Date,
    departmentId: String,
    designationId: String,
    dob: Date,
    doj: Date,
    email: String,
    firstName: String,
    fullName: String,
    gender: String,
    interest: {
      isAdult: Boolean,
      lang: {
        id: String,
        name: String
      },
      learningLevel: {
        audienceFrom: Number,
        audienceTo: Number,
        category: {
          id: String,
          name: String
        },
        id: String,
        name: String
      },
      subject: {
        id: String,
        name: String,
        subjectGroup: {
          id: String,
          name: String
        }
      }
    },
    lastName: String,
    lastUpdatedBy: String,
    lastUpdationTime: Date,
    location: {
      city: String,
      country: {
        id: String,
        name: String
      },
      pincode: Number,
      state: {
        name: String
      }
    },
    maritalStatus: Boolean,
    memberGroups: [String],
    middleName: String,
    mobile: String,
    mobileAlternate: String,
    moderatedGroups: String,
    providers: String,
    publishList: {
      count: Number,
      id: String,
      name: String
    },
    role: {
      id: String,
      name: String
    },
    spouseName: String,
    spouseProfession: String,
    totalPublishCount: Number,
    userThumbnail: {
      bytes: Number,
      createdBy: String,
      creationTime: Date,
      format: String,
      height: Number,
      id: String,
      lastUpdatedBy: String,
      lastUpdationTime: Date,
      original_filename: String,
      private_id: String,
      resource_type: String,
      secure_url: String,
      thumb: String,
      thumbXL: String,
      type: String,
      url: String,
      version: Number,
      width: Number
    },
    userType: String
  }
};
