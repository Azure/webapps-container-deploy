import * as core from '@actions/core';
import * as crypto from "crypto";

import { AuthorizerFactory } from "azure-actions-webclient/AuthorizerFactory";
import { AzureAppService } from 'azure-actions-appservice-rest/Arm/azure-app-service';
import { AzureAppServiceUtility } from 'azure-actions-appservice-rest/Utilities/AzureAppServiceUtility';
import { ContainerDeploymentUtility } from 'azure-actions-appservice-rest/Utilities/ContainerDeploymentUtility';
import { IAuthorizer } from 'azure-actions-webclient/Authorizer/IAuthorizer';
import { KuduServiceUtility } from 'azure-actions-appservice-rest/Utilities/KuduServiceUtility';
import { TaskParameters } from './taskparameters';
import { addAnnotation } from 'azure-actions-appservice-rest/Utilities/AnnotationUtility';

var prefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";

async function main() {
    let isDeploymentSuccess: boolean = true;

    try {
        // Set user agent varable
        let usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
        let actionName = 'DeployWebAppToAzure';
        let userAgentString = (!!prefix ? `${prefix}+` : '') + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
        core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentString);
        
        let endpoint: IAuthorizer = await AuthorizerFactory.getAuthorizer();
        var taskParams = TaskParameters.getTaskParams(endpoint);
        await taskParams.getResourceDetails();

        core.debug("Predeployment Step Started");
        var appService = new AzureAppService(taskParams.endpoint, taskParams.resourceGroupName, taskParams.appName, taskParams.slotName);
        var appServiceUtility = new AzureAppServiceUtility(appService);
        
        var kuduService = await appServiceUtility.getKuduService();
        var kuduServiceUtility = new KuduServiceUtility(kuduService);

        core.debug("Deployment Step Started");
        core.debug("Performing container based deployment.");

        let containerDeploymentUtility: ContainerDeploymentUtility = new ContainerDeploymentUtility(appService);
        await containerDeploymentUtility.deployWebAppImage(taskParams.images, taskParams.multiContainerConfigFile, taskParams.isLinux, taskParams.isMultiContainer, taskParams.containerCommand);
    }
    catch (error) {
        core.debug("Deployment Failed with Error: " + error);
        isDeploymentSuccess = false;
        core.setFailed(error);
    }
    finally {
        if(!!kuduServiceUtility) {
            await addAnnotation(taskParams.endpoint, appService, isDeploymentSuccess);
            let activeDeploymentID = await kuduServiceUtility.updateDeploymentStatus(isDeploymentSuccess, null, {'type': 'Deployment', slotName: appService.getSlot()});
            core.debug('Active DeploymentId :'+ activeDeploymentID);
        }
        
        let appServiceApplicationUrl: string = await appServiceUtility.getApplicationURL();
        console.log('App Service Application URL: ' + appServiceApplicationUrl);
        core.setOutput('webapp-url', appServiceApplicationUrl);
        
        // Reset AZURE_HTTP_USER_AGENT
        core.exportVariable('AZURE_HTTP_USER_AGENT', prefix);
        core.debug(isDeploymentSuccess ? "Deployment Succeded" : "Deployment failed");
    }
}

main();