module.exports = {
  name: 'Demo',
  properties: {
    email: String,
    name: String,
    no: {
      $type: Number,
      default: 10
    },
    creationTime: Date,
    lastUpdationTime: Date,
    thumbnail: {}
  },
  topLevelRequiredFields: ['email', 'name'],
  lilACL: {
    methods: '*'
  }
};
