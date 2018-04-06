module.exports = {
  name: 'User',
  properties: {
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
  }
};
