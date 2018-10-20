module.exports = {
  type: 'object',
  properties: {
    test: { type: 'string' },
    association: {
      title: 'association',
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        isApproved: { type: 'boolean' }
      },
      required: ['id', 'name', 'isApproved']
    },
    interest: {
      title: 'interest',
      type: 'object',
      properties: {
        isAdult: { type: 'boolean' },
        lang: {
          title: 'lang',
          type: 'object',
          properties: { id: { type: 'string' }, name: { type: 'string' } },
          required: ['id', 'name']
        },
        learningLevel: {
          title: 'learningLevel',
          type: 'object',
          properties: {
            audienceFrom: { type: 'number' },
            audienceTo: { type: 'number' },
            category: {
              title: 'category',
              type: 'object',
              properties: { id: { type: 'string' }, name: { type: 'string' } },
              required: ['id', 'name']
            },
            id: { type: 'string' },
            name: { type: 'string' }
          },
          required: ['audienceFrom', 'audienceTo', 'id', 'name']
        },
        subject: {
          title: 'subject',
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            subjectGroup: {
              title: 'subjectGroup',
              type: 'object',
              properties: { id: { type: 'string' }, name: { type: 'string' } },
              required: ['id', 'name']
            }
          },
          required: ['id', 'name']
        }
      },
      required: ['isAdult']
    },
    _id: { bsonType: 'objectId' }
  },
  required: ['test']
};
