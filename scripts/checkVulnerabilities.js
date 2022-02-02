const chalk = require('chalk');
const { execSync } = require('child_process');

/**
 * Any whitelisted advisories that should be ignored during the
 * vulnerability check should be added here. Make sure the
 * "github_advisory_id" is provided as the whitelist value. These
 * values can be found when running `npm audit --json` under the
 * "advisories" sub key.
 *
 * Ex: "GHSA-jg8v-48h5-wgxg"
 */
const ADVISORY_WHITELIST = [];

/**
 * Runs `npm audit` and checks the output for vulnerabilities. Currently
 * any detected vulnerabilities with severety "moderate" and over are
 * considered as issues that need to be taken care of.
 */
function checkForVulnerabilities() {
  try {
    const stdout = execSync('npm audit --production --json || true');
    const vulnerabilityReportJson = JSON.parse(stdout.toString());
    const vulnerabilityData = vulnerabilityReportJson['advisories'];
    let shouldFail = false;
    let skippedChecks = 0;
    Object.keys(vulnerabilityData).forEach((advisoryKey) => {
      let advisory = vulnerabilityData[advisoryKey];

      if (['moderate', 'high', 'critical'].includes(advisory['severity'])) {
        if (!ADVISORY_WHITELIST.includes(advisory['github_advisory_id'])) {
          console.log(
            chalk.redBright(
              `Security vulnerability found on "${advisory['module_name']}" with [${advisory['severity']}] severity!`
            )
          );
          shouldFail = true;
        } else {
          skippedChecks += 1;
        }
      }
    });
    if (shouldFail) {
      console.log(chalk.redBright(`\nPlease make sure to fix the above vulnerabilities!`));
      console.log(chalk.blueBright('Try `npm audit --fix` for potential fixes.\n'));
      process.exit(1);
    } else {
      console.log(chalk.greenBright('No dependency vulnerabilities found!'));
      if (skippedChecks > 0) {
        console.log(
          chalk.yellowBright(`!!NOTE!! ${skippedChecks} whitelisted advisories detected.`)
        );
      }
    }
  } catch (e) {
    console.error('Unable to parse npm audit output!');
    console.error(e.stdout.toString());
    process.exit(1);
  }
}

checkForVulnerabilities();
