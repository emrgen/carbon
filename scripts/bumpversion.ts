const { zip, isEqual, sortBy } = require("lodash");
const fs = require("fs");
const path = require("path");
const { createHash } = require("crypto");
const semver = require("semver");
const commandLineArgs = require("command-line-args");
const optionDefinitions = [{ name: "write", alias: "w", type: Boolean }];
const options = commandLineArgs(optionDefinitions);

const packageVersionHashFilePath = path.resolve(
  __dirname,
  "../package-version-hash.json",
);

// get the md5 hash of all files in the src directory of each package and the current version
const getPackageVersionHash = () => {
  return fs
    .readdirSync(path.resolve(__dirname, "../packages"))
    .map((dir) => {
      const packageJsonPath = path.resolve(
        __dirname,
        `../packages/${dir}/package.json`,
      );
      const packageJson = require(packageJsonPath);

      // check if git repo
      const gitPath = path.resolve(__dirname, `../packages/${dir}/.git`);
      if (fs.existsSync(gitPath)) {
        // console.warn(`SKIPPING: ${packageJson.name} is in a git repository`);
        return;
      }

      // generate md5 hash of src files
      const srcPath = path.resolve(__dirname, `../packages/${dir}/src`);
      // stat the srcPath
      if (!fs.existsSync(srcPath)) {
        // console.warn(`SKIPPING: ${srcPath} is not a directory`);
        return;
      }

      const hash = createHash("md5");
      // walk the srcPath
      const walk = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
          const filePath = path.resolve(dir, file);
          const fileStat = fs.statSync(filePath);
          if (fileStat.isDirectory()) {
            walk(filePath);
          } else {
            hash.update(fs.readFileSync(filePath));
          }
        });
      };

      walk(srcPath);

      return {
        name: packageJson.name,
        version: packageJson.version,
        hash: hash.digest("hex"),
      };
    })
    .filter((a) => !!a);
};

const updatePackagesVersionHashFile = () => {
  const packages = sortBy(getPackageVersionHash(), "name");

  // const oldPackages = require(packageVersionHashFilePath);
  // if (JSON.stringify(packages) === JSON.stringify(oldPackages)) {
  //   console.log("No packages changed, skipping version bump");
  //   return;
  // }

  // const version = zip(oldPackages, packages)
  //   .filter(([a, b]) => !isEqual(a, b))
  //   .map(([oldPkg, newPkg]) => [newPkg.name, oldPkg.version, newPkg.version]);

  console.log("Writing new package version hash file");
  fs.writeFileSync(
    packageVersionHashFilePath,
    JSON.stringify(packages, null, 2),
  );
};

const packages = getPackageVersionHash();

const bumpPackageVersions = (writeFile = false) => {
  const oldVersions = require(packageVersionHashFilePath);

  const oldVersionMap = oldVersions
    .filter((a) => !!a)
    .reduce((acc, cur) => {
      acc[cur.name] = cur;
      return acc;
    }, {});

  const newVersions = packages.reduce((acc, cur) => {
    acc[cur.name] = cur;
    return acc;
  }, {});

  const changedPackages = packages
    .map((p) => p.name)
    .filter((name) => {
      if (!oldVersionMap[name]) {
        return true;
      }
      return oldVersionMap[name].hash != newVersions[name].hash;
    });

  if (changedPackages.length === 0) {
    console.log("No packages changed, skipping version bump");
  } else {
    console.log("--------------------");
    console.log("Changed packages:");
    console.log("--------------------");

    // write new bumped versions to package.json for each package
    const updatedPackages = changedPackages
      .map((name) => {
        const oldPkg = oldVersionMap[name];
        const pkg = newVersions[name];
        if (!pkg) {
          return {
            name,
            current: "UNKNOWN",
            next: "UNKNOWN",
          };
        }

        const packageJsonPath = path.resolve(
          __dirname,
          `../packages/${pkg.name.replace("@emrgen/", "")}/package.json`,
        );
        const packageJson = require(packageJsonPath);
        // increment patch version if the current package version is the same as the old version
        let autoBump = false;
        if (packageJson.version === oldPkg.version) {
          packageJson.version = semver.inc(packageJson.version, "patch");
          autoBump = true;
        } else {
          autoBump = false;
        }

        if (writeFile) {
          fs.writeFileSync(
            packageJsonPath,
            JSON.stringify(packageJson, null, 2),
          );
        }

        return {
          name: pkg.name,
          current: oldPkg.version,
          next: packageJson.version,
          bump: autoBump ? "AUTO" : "MANUAL",
        };
      })
      .filter((a) => !!a);

    const columnWidths = updatedPackages.reduce(
      (acc, cur) => {
        return {
          name: Math.max(acc.name, cur.name.length),
          current: Math.max(acc.current, cur.current.length),
          next: Math.max(acc.next, cur.next.length),
          bump: Math.max(acc.bump, cur.bump.length),
        };
      },
      { name: 0, current: 0, next: 0, bump: 0 },
    );

    const formattedTableData = updatedPackages.map((pkg) => {
      return {
        name: pkg.name + " ".repeat(columnWidths.name - pkg.name.length),
        current: pkg.current.padEnd(columnWidths.current),
        next: pkg.next.padEnd(columnWidths.next),
        bump: pkg.bump.padEnd(columnWidths.bump),
      };
    });

    console.table(formattedTableData);

    if (writeFile) {
      updatePackagesVersionHashFile();
    }
  }
};

// bumpPackageVersions(options.write);
updatePackagesVersionHashFile();
