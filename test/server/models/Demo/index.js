const { BaseModel, loadMixin } = require('../../../../src/lb-mongo-rest');

class Demo extends BaseModel {
  static async greet() {
    const demo = await this.findOne();
    console.log('getName instance method', await demo.getName());

    const mixinMethodCount = await this.mixinStaticMethod();
    console.log('mixinMethodCount', mixinMethodCount, await this.findL());

    await this.upsert({
      a: 1
    });
    const r = await this.find();
    // console.log('find--', r);
    return demo;
  }

  static native() {
    return this.findOneN();
  }

  static async beforeCreate() {
    console.log('demo before create....');
  }

  getName() {
    return this.constructor.findOne();
  }
}

loadMixin(Demo, 'mixin');

module.exports = Demo;
