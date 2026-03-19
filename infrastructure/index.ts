import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const vidosConfig = new pulumi.Config("vidos");
const vidosAuthorizerUrl = vidosConfig.requireSecret("authorizerUrl");
const vidosApiKey = vidosConfig.getSecret("apiKey") ?? pulumi.secret("");
const databasePath = "/app/data/vidos-demo.db";
const mcpWinePublicBaseUrl = vidosConfig.get("mcpWinePublicBaseUrl") ?? "";
const mcpCarRentalPublicBaseUrl =
	vidosConfig.get("mcpCarRentalPublicBaseUrl") ?? "";
const mcpWinePort = Number(vidosConfig.get("mcpWinePort") ?? "30123");
const mcpCarRentalPort = Number(vidosConfig.get("mcpCarRentalPort") ?? "30124");
const mcpPath = vidosConfig.get("mcpPath") ?? "/mcp";

const lightsailConfig = new pulumi.Config("lightsail");
const serviceTier = lightsailConfig.get("serviceTier") ?? "micro";
const scale = Number(lightsailConfig.get("scale") ?? "1");
const deployEnabled = lightsailConfig.getBoolean("deploy") ?? true;
const backendImageTag = lightsailConfig.get("backendImageTag") ?? "latest";
const mcpWineImageTag =
	lightsailConfig.get("mcpWineImageTag") ?? "mcp-wine-latest";
const mcpCarRentalImageTag =
	lightsailConfig.get("mcpCarRentalImageTag") ?? "mcp-car-rental-latest";
const mcpWinePublicDomainName =
	lightsailConfig.get("mcpWinePublicDomainName") ?? "";
const mcpWineCertificateName =
	lightsailConfig.get("mcpWineCertificateName") ?? "";
const mcpCarRentalPublicDomainName =
	lightsailConfig.get("mcpCarRentalPublicDomainName") ?? "";
const mcpCarRentalCertificateName =
	lightsailConfig.get("mcpCarRentalCertificateName") ?? "";

const tags = {
	Project: "usecase-demos",
	ManagedBy: "Pulumi",
	Environment: "dev",
};

const repository = new aws.ecr.Repository("usecaseDemos", {
	name: pulumi.interpolate`usecase-demos-${pulumi.getStack()}`,
	imageTagMutability: "MUTABLE",
	tags,
});

new aws.ecr.LifecyclePolicy("usecaseDemos", {
	repository: repository.name,
	policy: JSON.stringify({
		rules: [
			{
				rulePriority: 1,
				description: "Retain last 5 images",
				selection: {
					tagStatus: "any",
					countType: "imageCountMoreThan",
					countNumber: 5,
				},
				action: {
					type: "expire",
				},
			},
		],
	}),
});

const service = new aws.lightsail.ContainerService("usecaseDemos", {
	name: pulumi.interpolate`usecase-demos-${pulumi.getStack()}`,
	power: serviceTier,
	scale,
	privateRegistryAccess: {
		ecrImagePullerRole: {
			isActive: true,
		},
	},
	tags,
});

function createPublicDomainNames(
	publicDomainName: string,
	certificateName: string,
) {
	if (!publicDomainName || !certificateName) {
		return undefined;
	}

	return {
		certificates: [
			{
				certificateName,
				domainNames: [publicDomainName],
			},
		],
	} as aws.types.input.lightsail.ContainerServicePublicDomainNames;
}

const mcpWinePublicDomainNames = createPublicDomainNames(
	mcpWinePublicDomainName,
	mcpWineCertificateName,
);

const mcpCarRentalPublicDomainNames = createPublicDomainNames(
	mcpCarRentalPublicDomainName,
	mcpCarRentalCertificateName,
);

const mcpService = new aws.lightsail.ContainerService("mcpWineAgent", {
	name: pulumi.interpolate`mcp-wine-agent-${pulumi.getStack()}`,
	power: serviceTier,
	scale,
	privateRegistryAccess: {
		ecrImagePullerRole: {
			isActive: true,
		},
	},
	publicDomainNames: mcpWinePublicDomainNames,
	tags,
});

const mcpCarRentalService = new aws.lightsail.ContainerService(
	"mcpCarRentalAgent",
	{
		name: pulumi.interpolate`mcp-car-rental-agent-${pulumi.getStack()}`,
		power: serviceTier,
		scale,
		privateRegistryAccess: {
			ecrImagePullerRole: {
				isActive: true,
			},
		},
		publicDomainNames: mcpCarRentalPublicDomainNames,
		tags,
	},
);

const ecrPullerPrincipalArn = service.privateRegistryAccess.apply(
	(registryAccess) => {
		const principalArn = registryAccess?.ecrImagePullerRole?.principalArn;
		if (!principalArn || principalArn.trim().length === 0) {
			throw new Error("Lightsail ECR puller role not ready");
		}
		return principalArn;
	},
);

const mcpEcrPullerPrincipalArn = mcpService.privateRegistryAccess.apply(
	(registryAccess) => {
		const principalArn = registryAccess?.ecrImagePullerRole?.principalArn;
		if (!principalArn || principalArn.trim().length === 0) {
			throw new Error("MCP Lightsail ECR puller role not ready");
		}
		return principalArn;
	},
);

const mcpCarRentalEcrPullerPrincipalArn =
	mcpCarRentalService.privateRegistryAccess.apply((registryAccess) => {
		const principalArn = registryAccess?.ecrImagePullerRole?.principalArn;
		if (!principalArn || principalArn.trim().length === 0) {
			throw new Error("Car rental MCP Lightsail ECR puller role not ready");
		}
		return principalArn;
	});

const repositoryPolicyDocument = pulumi
	.all([
		ecrPullerPrincipalArn,
		mcpEcrPullerPrincipalArn,
		mcpCarRentalEcrPullerPrincipalArn,
	])
	.apply(([usecaseArn, mcpArn, mcpCarRentalArn]) =>
		JSON.stringify({
			Version: "2012-10-17",
			Statement: [
				{
					Sid: "AllowLightsailPull",
					Effect: "Allow",
					Principal: {
						AWS: [usecaseArn, mcpArn, mcpCarRentalArn],
					},
					Action: [
						"ecr:BatchCheckLayerAvailability",
						"ecr:BatchGetImage",
						"ecr:GetDownloadUrlForLayer",
					],
				},
			],
		}),
	);

new aws.ecr.RepositoryPolicy(
	"usecaseDemos",
	{
		repository: repository.name,
		policy: repositoryPolicyDocument,
	},
	{
		dependsOn: [service, mcpService, mcpCarRentalService],
	},
);

if (deployEnabled) {
	new aws.lightsail.ContainerServiceDeploymentVersion(
		"usecaseDemos",
		{
			serviceName: service.name,
			containers: [
				{
					containerName: "backend",
					image: repository.repositoryUrl.apply(
						(url) => `${url}:${backendImageTag}`,
					),
					ports: {
						"53913": "HTTP",
					},
					environment: {
						VIDOS_AUTHORIZER_URL: vidosAuthorizerUrl,
						VIDOS_API_KEY: vidosApiKey,
						DATABASE_PATH: databasePath,
					},
				},
			],
			publicEndpoint: {
				containerName: "backend",
				containerPort: 53913,
				healthCheck: {
					path: "/",
					successCodes: "200-499",
				},
			},
		},
		{
			deleteBeforeReplace: true,
			replaceOnChanges: ["*"],
		},
	);

	new aws.lightsail.ContainerServiceDeploymentVersion(
		"mcpWineAgent",
		{
			serviceName: mcpService.name,
			containers: [
				{
					containerName: "mcp",
					image: repository.repositoryUrl.apply(
						(url) => `${url}:${mcpWineImageTag}`,
					),
					ports: {
						[mcpWinePort.toString()]: "HTTP",
					},
					environment: {
						VIDOS_AUTHORIZER_URL: vidosAuthorizerUrl,
						VIDOS_API_KEY: vidosApiKey,
						PORT: mcpWinePort.toString(),
						MCP_PATH: mcpPath,
						PUBLIC_BASE_URL: mcpWinePublicBaseUrl,
					},
				},
			],
			publicEndpoint: {
				containerName: "mcp",
				containerPort: mcpWinePort,
				healthCheck: {
					path: "/health",
					successCodes: "200-499",
				},
			},
		},
		{
			deleteBeforeReplace: true,
			replaceOnChanges: ["*"],
		},
	);

	new aws.lightsail.ContainerServiceDeploymentVersion(
		"mcpCarRentalAgent",
		{
			serviceName: mcpCarRentalService.name,
			containers: [
				{
					containerName: "mcp",
					image: repository.repositoryUrl.apply(
						(url) => `${url}:${mcpCarRentalImageTag}`,
					),
					ports: {
						[mcpCarRentalPort.toString()]: "HTTP",
					},
					environment: {
						VIDOS_AUTHORIZER_URL: vidosAuthorizerUrl,
						VIDOS_API_KEY: vidosApiKey,
						PORT: mcpCarRentalPort.toString(),
						MCP_PATH: mcpPath,
						PUBLIC_BASE_URL: mcpCarRentalPublicBaseUrl,
					},
				},
			],
			publicEndpoint: {
				containerName: "mcp",
				containerPort: mcpCarRentalPort,
				healthCheck: {
					path: "/health",
					successCodes: "200-499",
				},
			},
		},
		{
			deleteBeforeReplace: true,
			replaceOnChanges: ["*"],
		},
	);
}

export const ecrRepositoryUrl = repository.repositoryUrl;
export const ecrRepositoryName = repository.name;
export const lightsailServiceName = service.name;
export const endpoint = service.url;
export const mcpWineLightsailServiceName = mcpService.name;
export const mcpWineEndpoint = mcpService.url;
export const mcpCarRentalLightsailServiceName = mcpCarRentalService.name;
export const mcpCarRentalEndpoint = mcpCarRentalService.url;
export const region = aws.config.region ?? "eu-west-1";
