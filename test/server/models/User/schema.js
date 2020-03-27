module.exports = {
  name: 'User',
  properties: {
    _id: String,
    email: {
      type: String
    },
    userName: {
      type: String
    },
    createdAt: {
      type: Date
    },
    lastModifiedAt: {
      type: Date
    },
    thumbnail: {
      type: Object
    }
  },
  lilACL: {
    methods: '*'
  },
  indexes: {
    emailId: {fields: 'email'},
    name: {fields: 'name'},
    nameEmail: {fields: ['name', 'email']}
  }
};
