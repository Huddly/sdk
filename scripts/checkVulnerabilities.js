const chalk = require('chalk');
const { execSync } = require("child_process");

/**
 * Runs `npm audit` and checks the output for vulnerabilities. Currently
 * any detected vulnerabilities with severety "moderate" and over are
 * considered as issues that need to be taken care of.
 */
function checkForVulnerabilities() {
  try {
    const stdout = execSync(`npm audit --production --json`);
    const vulnerabilityReportJson = JSON.parse(stdout.toString());
    const vulnerabilityData = vulnerabilityReportJson['metadata']['vulnerabilities'];
    let shouldFail = false;
    Object.keys(vulnerabilityData).forEach((severity) => {
      if (['moderate', 'high', 'critical'].includes(severity) && vulnerabilityData[severity] > 0) {
        console.log(chalk.redBright(`Npm found ${vulnerabilityData[severity]} ${severity} vulnerabilities.`));
        shouldFail = true;
      }
    });
    if (shouldFail) {
      console.log(chalk.redBright(`Please make sure to fix the above vulnerabilities!`));
      process.exit(1)
    } else {
      console.log(chalk.greenBright('No dependency vulnerabilities found!'));
    }
  } catch (e) {
    console.error('Unable to parse npm audit output!');
    if (e.stdout !== undefined) {
        console.error(e.stdout.toString())
    }
    console.error(e)
    process.exit(1)
  }
}

checkForVulnerabilities();
