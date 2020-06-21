module.exports = {
  Poll: class Poll {
    constructor(ques, options, responses, entries) {
      this.ques = ques;
      this.options = options;
      this.responses = responses || [];
      this.entries = entries || [];
    }

    evaluate() {
      let results = {};
      let maxVote = this.responses.reduce((acc, val) => (val > acc ? val : acc), 0);
      for (let i = 0; i < this.options.length; i++) {
        results[this.options[i]] = this.responses[i] ? this.responses[i] : 0;
      }
      return { maxVote, results };
    }
  },
};
