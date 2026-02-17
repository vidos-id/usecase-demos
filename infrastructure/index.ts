import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const vidosConfig = new pulumi.Config("vidos");
const vidosAuthorizerUrl = vidosConfig.requireSecret("authorizerUrl");
const vidosApiKey = vidosConfig.getSecret("apiKey") ?? pulumi.secret("");

const lightsailConfig = new pulumi.Config("lightsail");
const serviceTier = lightsailConfig.get("serviceTier") ?? "micro";
const scale = Number(lightsailConfig.get("scale") ?? "1");

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

const repositoryPolicyDocument = pulumi
	.all([repository.arn, service.privateRegistryAccess])
	.apply(([repoArn, registryAccess]) =>
		JSON.stringify({
			Version: "2012-10-17",
			Statement: [
				{
					Effect: "Allow",
					Principal: {
						AWS: registryAccess.ecrImagePullerRole?.principalArn ?? "",
					},
					Action: [
						"ecr:BatchCheckLayerAvailability",
						"ecr:BatchGetImage",
						"ecr:GetDownloadUrlForLayer",
					],
					Resource: repoArn,
				},
			],
		}),
	);

new aws.ecr.RepositoryPolicy("usecaseDemos", {
	repository: repository.name,
	policy: repositoryPolicyDocument,
});

const deployment = new aws.lightsail.ContainerServiceDeploymentVersion(
	"usecaseDemos",
	{
		serviceName: service.name,
		containers: [
			{
				containerName: "backend",
				image: repository.repositoryUrl.apply((url) => `${url}:latest`),
				ports: {
					"3000": "HTTP",
				},
				environment: {
					VIDOS_AUTHORIZER_URL: vidosAuthorizerUrl,
					VIDOS_API_KEY: vidosApiKey,
				},
			},
		],
		publicEndpoint: {
			containerName: "backend",
			containerPort: 3000,
			healthCheck: {
				path: "/",
				successCodes: "200-499",
			},
		},
	},
);

export const ecrRepositoryUrl = repository.repositoryUrl;
export const ecrRepositoryName = repository.name;
export const lightsailServiceName = service.name;
export const endpoint = service.url;
export const region = aws.config.region ?? "eu-west-1";
