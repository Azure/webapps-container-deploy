# GitHub Action for deploying to Azure Web App for Containers

[GitHub Actions](https://help.github.com/en/articles/about-github-actions) gives you the flexibility to build an automated software development lifecycle workflow. 

You can automate your workflows to deploy [Azure Web Apps for Containers](https://azure.microsoft.com/en-us/services/app-service/containers/) using GitHub Actions.

Get started today with a [free Azure account](https://azure.com/free/open-source)!

This repository contains [GitHub Action for Azure WebApp for containers](https://github.com/Azure/webapps-container-deploy/blob/master/action.yml) to deploy to Azure WebApp for Containers. Supports deploying a single container image or multiple containers.

If you are looking for a Github Action to deploy to an Azure WebApp (Windows or Linux), consider using [Azure WebApp](https://github.com/Azure/webapps-deploy/blob/master/action.yml) action.

The definition of this Github Action is in [action.yml](https://github.com/Azure/webapps-container-deploy/blob/master/action.yml).

# End-to-End Sample Workflows

## Dependencies on other Github Actions
* [Checkout](https://github.com/actions/checkout) Checkout your Git repository content into Github Actions agent.
* [Azure Login](https://github.com/Azure/actions) Login with your Azure credentials for Web app deployment authentication. Once login is done, the next set of Azure actions in the workflow can re-use the same session within the job.
* [docker-login](https://github.com/Azure/docker-login) : Actions to [log in to a private container registry](https://docs.docker.com/engine/reference/commandline/login/) such as [Azure Container registry](https://azure.microsoft.com/en-us/services/container-registry/). Once login is done, the next set of Actions in the workflow can perform tasks such as building, tagging and pushing containers.

## Azure Service Principle for RBAC
You may want to create an [Azure Service Principal for RBAC](https://docs.microsoft.com/en-us/azure/role-based-access-control/overview) and add them as a Github Secret in your repository.
1. Download Azure CLI from [here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest), run `az login` to login with your Azure credentials.
2. Run Azure CLI command
```bash  

   az ad sp create-for-rbac --name "myApp" --role contributor \
                            --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
                            --sdk-auth
                            
  # Replace {subscription-id}, {resource-group} with the subscription, resource group details of the WebApp
```
  * You can further scope down the Azure Credentials to the Web App using scope attribute. For example, 
  ```
   az ad sp create-for-rbac --name "myApp" --role contributor \
                            --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Web/sites/{app-name} \
                            --sdk-auth

  # Replace {subscription-id}, {resource-group}, and {app-name} with the names of your subscription, resource group, and Azure Web App.
```
3. Paste the json response from above Azure CLI to your Github Repository > Settings > Secrets > Add a new secret > **AZURE_CREDENTIALS**
4. Now in the workflow file in your branch: `.github/workflows/workflow.yml` replace the secret in Azure login action with your secret (Refer to the example below)

## Build and deploy a Node.js app to Azure WebApp Container

```yaml

on: [push]

name: Linux_Container_Node_Workflow

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    # checkout the repo
    - name: 'Checkout Github Action' 
      uses: actions/checkout@master
    
    - name: 'Login via Azure CLI'
      uses: azure/actions/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - uses: azure/docker-login@v1
      with:
        login-server: contoso.azurecr.io
        username: ${{ secrets.REGISTRY_USERNAME }}
        password: ${{ secrets.REGISTRY_PASSWORD }}
    
    - run: |
        docker build . -t contoso.azurecr.io/nodejssampleapp:${{ github.sha }}
        docker push contoso.azurecr.io/nodejssampleapp:${{ github.sha }} 
      
    - uses: azure/webapps-container-deploy@v1
      with:
        app-name: 'node-rnc'
        images: 'contoso.azurecr.io/nodejssampleapp:${{ github.sha }}'
    
    - name: Azure logout
      run: |
        az logout
```

# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
