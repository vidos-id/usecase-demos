import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const vidosConfig = new pulumi.Config("vidos");
const vidosAuthorizerUrl = vidosConfig.requireSecret("authorizerUrl");
const vidosApiKey = vidosConfig.getSecret("apiKey") ?? pulumi.secret("");
const databasePath = "/app/data/vidos-demo.db";
const mcpPort = Number(vidosConfig.get("mcpPort") ?? "30123");
const mcpPath = vidosConfig.get("mcpPath") ?? "/mcp";
const mcpWidgetDomain = vidosConfig.get("mcpWidgetDomain") ?? "";

const lightsailConfig = new pulumi.Config("lightsail");
const serviceTier = lightsailConfig.get("serviceTier") ?? "micro";
const scale = Number(lightsailConfig.get("scale") ?? "1");
const deployEnabled = lightsailConfig.getBoolean("deploy") ?? true;
const backendImageTag = lightsailConfig.get("backendImageTag") ?? "latest";
const mcpImageTag = lightsailConfig.get("mcpImageTag") ?? "mcp-latest";

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

const mcpService = new aws.lightsail.ContainerService("mcpWineAgent", {
	name: pulumi.interpolate`mcp-wine-agent-${pulumi.getStack()}`,
	power: serviceTier,
	scale,
	privateRegistryAccess: {
		ecrImagePullerRole: {
			isActive: true,
		},
	},
	tags,
});

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

const repositoryPolicyDocument = pulumi
	.all([ecrPullerPrincipalArn, mcpEcrPullerPrincipalArn])
	.apply(([usecaseArn, mcpArn]) =>
		JSON.stringify({
			Version: "2012-10-17",
			Statement: [
				{
					Sid: "AllowLightsailPull",
					Effect: "Allow",
					Principal: {
						AWS: [usecaseArn, mcpArn],
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
		dependsOn: [service, mcpService],
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
						(url) => `${url}:${mcpImageTag}`,
					),
					ports: {
						[mcpPort.toString()]: "HTTP",
					},
					environment: {
						VIDOS_AUTHORIZER_URL: vidosAuthorizerUrl,
						VIDOS_API_KEY: vidosApiKey,
						PORT: mcpPort.toString(),
						MCP_PATH: mcpPath,
						WIDGET_DOMAIN: mcpWidgetDomain,
					},
				},
			],
			publicEndpoint: {
				containerName: "mcp",
				containerPort: mcpPort,
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
export const mcpLightsailServiceName = mcpService.name;
export const mcpEndpoint = mcpService.url;
export const region = aws.config.region ?? "eu-west-1";
