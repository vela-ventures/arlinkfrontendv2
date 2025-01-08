## Checks these

# {BUILDER_BACKEND}/DEPLOY
Visit the configuring-deployment.tsx there check the
`deploy` function

I want you to check few things here

-   I have no idea why we are using finalArnsProcess, I mean I know what it does but we are not even passing
-   currently I am passing customArnsName undername as the value for the repo name
-   If the user has selected his own domain how is that getting sent to the backend? here we are only passing custom arns undername in the body

# OBJECT OBJECT BUG AS DEPLOYMENT ID
You mentioned that you had a bug from your end, but I guess there is none

-   but still check

```
hey listen I just really want you to pay attention the deploy functions of both
although I am sure they will work well, but you know more about what each value does
so please I hight request you to check just the deploy function.
```

# WHY DO UPDATE WHEN WE CAN ALREADY INSERT IT THE VALUE AFTER THE TABLE HAS BEEN ALTERED
  look

  ````ts
      // we altered the table and added the undername
      const alter = await runLua(
            `local res = db:exec[[ ALTER TABLE Deployments ADD COLUMN UnderName TEXT ]]`,
            mgProcess,
        );
        console.log("tablealtered", alter);

        const query = `local res = db:exec[[                                                             // let's add this field here then
            INSERT INTO Deployments (Name, RepoUrl, Branch, InstallCMD, BuildCMD, OutputDIR, ArnsProcess, UnderName) VALUES
                ('${projectName}',
                '${repoUrl}',
                '${selectedBranch}',
                '${buildSettings.installCommand.value}',
                '${buildSettings.buildCommand.value}',
                '${buildSettings.outPutDir.value}',
                '${finalArnsProcess}')
                'AND UNDERNAME VALUE'
            ]]`;
        console.log("manager process ", mgProcess);

        const res = await runLua(query, mgProcess);
        const updres = await runLua(
            `db:exec[[UPDATE Deployments SET DeploymentId='${response.data}' WHERE Name='${projectName}']]`,
            mgProcess,
        );
        console.log("result of update id ", updres);

        // NO NEED TO RUN THIS RIGHT? !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // const undaname = await runLua(
        //     `local res = db:exec[[
        //         UPDATE Deployments
        //         SET UnderName = '${response.data.finalUnderName}'
        //         WHERE Name = '${projectName}'
        //     ]]`,
        //     mgProcess,
        // );
        // console.log("addedundername", undaname);
    ```
  ````
  I did the same algo for the protocol land deployment kindly check it 


# API LIMIT IN ANALYZE REPO STRUCTURE [utils.ts]
  - Just check the analayzeRepoStructure fn okie
