module.exports = {
  name: 'Demo',
  properties: {
    email: {
      $type: String
    },
    name: {
      $type: String
    },
    no: {
      $type: Number,
      default: 10
    },
    creationTime: {
      $type: Date
    },
    lastUpdationTime: {
      $type: Date
    },
    thumbnail: {
      $type: Object
    }
  },
  lilACL: {
    methods: '*'
  },
  indexes: {
    emailId: {fields: 'email'},
    name: {fields: 'name'},
    num: {fields: 'no', unique: true}
  }
};
