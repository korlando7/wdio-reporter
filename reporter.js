const events = require('events');
const chalk = require('chalk');

const { log } = console;

class CustomReporter extends events.EventEmitter {
  constructor(baseReporter, config, options = {}) {
    super();

    this.baseReporter = baseReporter;
    this.config = config;
    this.options = options;
    this.results = {};

    this.on('runner:start', (runner) => {
      this.startTime = new Date();

      const { browserName } = runner.capabilities;
      this.results[runner.cid] = {
        browserName,
        passing: 0,
        pending: 0,
        failing: 0,
      };
    });

    this.on('suite:start', suite => suite);

    this.on('test:pending', (test) => {
      log(test);
      this.results[test.cid].pending += 1;
    });

    this.on('test:pass', (test) => {
      log(chalk.green(`${this.getSymbols().ok} ${this.getBrowserName(test.cid)}: ${test.fullTitle}`));
      this.results[test.cid].passing += 1;
    });

    this.on('test:fail', (test) => {
      this.results[test.cid].failing += 1;
      const browser = this.getBrowserName(test.cid);
      log(chalk.bgRed(`\n${this.getSymbols().error} ${browser}: ${test.fullTitle}`));
      log(chalk.red(`${test.err.type}
      ${test.err.stack}
      ${test.err.message}\n`));
    });

    this.on('runner:end', () => {
    });

    this.on('end', () => {
      this.endTime = new Date();
      log(this.getTestResults());
      log(chalk.cyan(this.getTestRunTime()));
    });
  }

  getBrowserName(cid) {
    const { browserName } = this.baseReporter.stats.runners[cid].capabilities;
    return browserName;
  }

  getTestResults() {
    let message = `${chalk.bold.underline.magenta('\nResults\n')}`;
    Object.keys(this.results).forEach((result) => {
      const browserObj = this.results[result];
      message += `\n${chalk.bgBlue(browserObj.browserName)}: 
      ${chalk.green(`${browserObj.passing} passing`)}, ${chalk.red(`${browserObj.failing} failing`)}\n`;
    });

    return message;
  }

  isFailing() {
    return Object.keys(this.results).some(result => this.results[result].failing > 0);
  }

  getSymbols() {
    return this.baseReporter.symbols;
  }

  getTestRunTime() {
    const runTime = this.endTime - this.startTime;
    const seconds = Math.round((runTime / 1000) % 60);
    const minutes = Math.round((runTime / 1000 / 60) % 60);
    return `Tests finished in ${minutes} mins and ${seconds} seconds`;
  }

  logTestSummary() {
    log(chalk.green(this.getTestRunTime()));
  }
}

module.exports = CustomReporter;
