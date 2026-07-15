# bleed-believer cli
A `ts-node` replacement with path alias resolution, using TSC under the hood.

## Basic usage
-   Install the package:
    ```shell
    npm i --save-dev @bleed-believer/cli typescript
    ```

-   Next, launch your application:
    ```shell
    ## Using the shortest executable name:
    npx bleed start ./src/index.ts

    ## ...or if you want the full executable name:
    npx @bleed-believer/cli start ./src/index.ts

    ## ...or in case do you want to execute as a loader:
    node --import @bleed-believer/cli ./src/index.ts
    ```

## CLI Commands
-   `npx bleed start [target]`  
    Run a TypeScript file using the custom ESM loader.
    -   `[target]`: The file do you want to execute.
    -   `--config` _(optional)_: Sets a custom tsconfig JSON file.
    -   `--watch` _(optional)_: Execute as watch mode.
    -   `--` _(optional)_: Pass arguments to the typescript file.

-   `npx bleed build`  
    Transpile all files to JavaScript.
    -   `--config` _(optional)_: Sets a custom tsconfig JSON file.