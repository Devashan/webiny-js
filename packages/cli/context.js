const fs = require("fs");
const path = require("path");
const { green } = require("chalk");
const { GetEnvVars } = require("env-cmd");
const findUp = require("find-up");
const { PluginsContainer } = require("@webiny/plugins");
const debug = require("debug")("webiny");

const webinyRootPath = findUp.sync("webiny.root.js");
if (!webinyRootPath) {
    console.log(
        `Couldn't locate "webiny.root.js"! Webiny CLI can only be used from within a Webiny project.`
    );
    process.exit(1);
}
const projectRoot = path.dirname(webinyRootPath);

class Context {
    constructor() {
        this.paths = {
            projectRoot,
            packagesPath: this.resolve("packages")
        };

        this.config = require(path.join(projectRoot, "webiny.root.js"));
        this.projectName = this.config.projectName;
        this.plugins = new PluginsContainer();
    }

    loadUserPlugins() {
        if (this.config.cli) {
            const plugins = this.config.cli.plugins || [];
            this.plugins.register(
                ...plugins.map(plugin => {
                    if (typeof plugin === "string") {
                        let loadedPlugin;
                        try {
                            loadedPlugin = require(path.join(this.paths.projectRoot, plugin)); // Try loading the package from the project's root
                        } catch {
                            // If it fails, perhaps the user still has the package installed somewhere locally...
                            loadedPlugin = require(plugin);
                        }
                        return loadedPlugin;
                    }
                    return plugin;
                })
            );
        }
    }

    log(...args) {
        debug(...args);
    }

    info(...args) {
        debug(...args);
    }

    debug(...args) {
        debug(...args);
    }

    error(...args) {
        debug(...args);
    }

    resolve(...dir) {
        return path.resolve(projectRoot, ...dir);
    }

    replaceProjectRoot(path) {
        return path.replace(projectRoot, "<projectRoot>").replace(/\\/g, "/");
    }

    async loadEnv(envPath, env, { debug = false }) {
        if (fs.existsSync(envPath)) {
            const consoleError = console.error;
            const envFile = this.replaceProjectRoot(envPath);
            try {
                // We need to disable console.error because `env-cmd` is printing some ugly errors we don't want in our output.
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                console.error = () => {};
                const envConfig = await GetEnvVars({
                    rc: {
                        environments: ["default", env],
                        filePath: envPath
                    }
                });

                Object.assign(process.env, envConfig);
                if (debug) {
                    console.log(`💡 Loaded ${green(env)} environment from ${green(envFile)}.`);
                }
            } catch (err) {
                if (debug) {
                    console.log(`💡 No environments were found in ${green(envFile)}. Skipping.`);
                }
            } finally {
                console.error = consoleError;
            }
        }
    }
}

module.exports = new Context();
