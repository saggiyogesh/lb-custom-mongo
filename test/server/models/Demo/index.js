const { BaseModel, loadMixin } = require('../../../../src/lb-mongo-rest');

class Demo extends BaseModel {
  static async greet() {
    const demo = await this.findOne();
    console.log('getName instance method', await demo.getName());

    const mixinMethodCount = await this.mixinStaticMethod();
    console.log('mixinMethodCount', mixinMethodCount, await this.findL());
    console.log('native mongo', await this.models.User.findN());

    await this.upsert({
      a: 1
    });
    const r = await this.find();
    // console.log('find--', r);
    return demo;
  }

  static async beforeCreate() {
    console.log('demo before create....');
  }

  getName() {
    return this.constructor.findOne();
  }
};

loadMixin(Demo, 'mixin');

module.exports = Demo;
