import { exist, TaskParameters } from "../taskparameters";
import { AzureResourceFilterUtility } from "azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility";
import { IAuthorizer } from "azure-actions-webclient/Authorizer/IAuthorizer";

import chai = require('chai');
import sinon = require("sinon");

var expect = chai.expect;

describe('Test task parameter functions', () => {

    beforeEach(function() {
        sinon.stub(AzureResourceFilterUtility, 'getAppDetails');
    });

    afterEach(function() {
        (AzureResourceFilterUtility.getAppDetails as sinon.SinonStub).restore();
    });

    it("Test app-name is required input", () => {        
        let mockEndpoint: IAuthorizer;
        expect(() => TaskParameters.getTaskParams(mockEndpoint)).to.throw();
    });

    it("Test taskparamters for multi container with no config file", () => {
        process.env['INPUT_APP-NAME'] = 'testAppName';
        process.env['INPUT_IMAGES'] = 'testImage\ntestImage2';
        
        let mockEndpoint: IAuthorizer;
        expect(() => TaskParameters.getTaskParams(mockEndpoint)).to.throw(Error, "Multiple images indicate multi-container deployment type, but Docker-compose file is absent.");
    });

    it("Test taskparamters for single container", async () => {
        let expectedAppDetails = {
            "resourceGroupName" : "MockResourceGroupName",
            "kind" : "MockKind"
        };
        (AzureResourceFilterUtility.getAppDetails as sinon.SinonStub).resolves(expectedAppDetails);

        process.env['INPUT_APP-NAME'] = 'testAppName';
        process.env['INPUT_IMAGES'] = 'testImage';

        let mockEndpoint: IAuthorizer;
        let taskparams: TaskParameters = TaskParameters.getTaskParams(mockEndpoint);

        expect(taskparams.appName).to.equal('testAppName');
        expect(taskparams.images).to.equal('testImage');
        expect(taskparams.isMultiContainer).to.be.false;

        await taskparams.getResourceDetails();

        expect(taskparams.resourceGroupName).to.equal('MockResourceGroupName');
        expect(taskparams.isLinux).to.be.false;
    });

    it("Test exist function works correctly", () => {
        let correctPathExists = exist("src");
        expect(correctPathExists).to.be.true;

        let wrongPathExists = exist("wrongPath");
        expect(wrongPathExists).to.be.false;
    });
});