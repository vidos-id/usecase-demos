#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

type ExecOptions = {
	cwd?: string;
};

const rootDir = process.cwd();
const infrastructureDir = path.join(rootDir, "infrastructure");
const dockerfilePath = path.join(rootDir, "Dockerfile.server");
const mcpDockerfilePath = path.join(rootDir, "Dockerfile.mcp-wine-agent");
const mcpCarRentalDockerfilePath = path.join(
	rootDir,
	"Dockerfile.mcp-car-rental-agent",
);
const ticketAgentDockerfilePath = path.join(rootDir, "Dockerfile.ticket-agent");

const run = (command: string, options: ExecOptions = {}) => {
	try {
		return execSync(command, {
			stdio: "inherit",
			shell: "/bin/bash",
			...options,
		});
	} catch (error) {
		process.exitCode = 1;
		throw error;
	}
};

const runCapture = (command: string, options: ExecOptions = {}) =>
	execSync(command, {
		stdio: "pipe",
		encoding: "utf8",
		shell: "/bin/bash",
		...options,
	}).trim();

const requireTool = (tool: string) => {
	try {
		runCapture(`${tool} --version`);
	} catch {
		throw new Error(`Required tool not found: ${tool}`);
	}
};

const getGitSha = () => {
	try {
		const sha = runCapture("git rev-parse --short HEAD");
		return sha.length > 0 ? sha : null;
	} catch {
		return null;
	}
};

const getTimestamp = () => {
	const now = new Date();
	const pad = (value: number) => value.toString().padStart(2, "0");
	return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(
		now.getUTCDate(),
	)}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(
		now.getUTCSeconds(),
	)}`;
};

const getStackOutput = (name: string) =>
	runCapture(`pulumi stack output ${name}`, { cwd: infrastructureDir });

const ensurePaths = () => {
	if (!existsSync(infrastructureDir)) {
		throw new Error(
			"Missing infrastructure/ directory. Run pulumi setup first.",
		);
	}
	if (!existsSync(dockerfilePath)) {
		throw new Error("Missing Dockerfile.server in repo root.");
	}
	if (!existsSync(mcpDockerfilePath)) {
		throw new Error("Missing Dockerfile.mcp-wine-agent in repo root.");
	}
	if (!existsSync(mcpCarRentalDockerfilePath)) {
		throw new Error("Missing Dockerfile.mcp-car-rental-agent in repo root.");
	}
	if (!existsSync(ticketAgentDockerfilePath)) {
		throw new Error("Missing Dockerfile.ticket-agent in repo root.");
	}
};

const log = (message: string) => {
	process.stdout.write(`${message}\n`);
};

const main = () => {
	if (process.argv.includes("--help")) {
		log("Usage: bun scripts/deploy.ts");
		log("Builds, pushes, and deploys the backend container to Lightsail.");
		return;
	}

	requireTool("aws");
	requireTool("docker");
	requireTool("jq");
	requireTool("pulumi");

	ensurePaths();

	const repositoryUrl = getStackOutput("ecrRepositoryUrl");
	const serviceName = getStackOutput("lightsailServiceName");
	const mcpWineServiceName = getStackOutput("mcpWineLightsailServiceName");
	const mcpCarRentalServiceName = getStackOutput(
		"mcpCarRentalLightsailServiceName",
	);
	const ticketAgentServiceName = getStackOutput(
		"ticketAgentLightsailServiceName",
	);
	const region = getStackOutput("region") || "eu-west-1";
	const endpoint = getStackOutput("endpoint");
	const mcpWineEndpoint = getStackOutput("mcpWineEndpoint");
	const mcpCarRentalEndpoint = getStackOutput("mcpCarRentalEndpoint");
	const ticketAgentEndpoint = getStackOutput("ticketAgentEndpoint");

	const tag = getGitSha() ?? getTimestamp();
	const imageTag = `${repositoryUrl}:${tag}`;
	const mcpWineImageTag = `${repositoryUrl}:mcp-${tag}`;
	const mcpCarRentalImageTag = `${repositoryUrl}:mcp-car-rental-${tag}`;
	const ticketAgentImageTag = `${repositoryUrl}:ticket-agent-${tag}`;

	log(`Using image tag: ${imageTag}`);
	log(`Using wine MCP image tag: ${mcpWineImageTag}`);
	log(`Using car-rental MCP image tag: ${mcpCarRentalImageTag}`);
	log(`Using ticket-agent image tag: ${ticketAgentImageTag}`);
	log("Authenticating to ECR...");
	run(
		`aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${repositoryUrl}`,
	);

	log("Building Docker image...");
	run(`docker build -f Dockerfile.server -t ${imageTag} .`);
	log("Building MCP Wine Agent image...");
	run(`docker build -f Dockerfile.mcp-wine-agent -t ${mcpWineImageTag} .`);
	log("Building MCP Car Rental Agent image...");
	run(
		`docker build -f Dockerfile.mcp-car-rental-agent -t ${mcpCarRentalImageTag} .`,
	);
	log("Building Ticket Agent image...");
	run(`docker build -f Dockerfile.ticket-agent -t ${ticketAgentImageTag} .`);

	log("Pushing image to ECR...");
	run(`docker push ${imageTag}`);
	log("Pushing MCP image to ECR...");
	run(`docker push ${mcpWineImageTag}`);
	log("Pushing car-rental MCP image to ECR...");
	run(`docker push ${mcpCarRentalImageTag}`);
	log("Pushing ticket-agent image to ECR...");
	run(`docker push ${ticketAgentImageTag}`);

	log("Updating Lightsail service...");
	const deploymentConfig = {
		containers: {
			backend: {
				image: imageTag,
				ports: { 53913: "HTTP" },
				environment: {
					VIDOS_AUTHORIZER_URL: process.env.VIDOS_AUTHORIZER_URL ?? "",
					VIDOS_API_KEY: process.env.VIDOS_API_KEY ?? "",
				},
			},
		},
		publicEndpoint: {
			containerName: "backend",
			containerPort: 53913,
		},
	};
	const mcpWinePort = Number(process.env.MCP_WINE_PORT ?? "30123");
	const mcpCarRentalPort = Number(process.env.MCP_CAR_RENTAL_PORT ?? "30124");
	const mcpPath = process.env.MCP_PATH ?? "/mcp";
	const mcpWinePublicBaseUrl = process.env.MCP_WINE_PUBLIC_BASE_URL ?? "";
	const mcpCarRentalPublicBaseUrl =
		process.env.MCP_CAR_RENTAL_PUBLIC_BASE_URL ?? "";
	const mcpWineDeploymentConfig = {
		containers: {
			mcp: {
				image: mcpWineImageTag,
				ports: { [mcpWinePort]: "HTTP" },
				environment: {
					VIDOS_AUTHORIZER_URL: process.env.VIDOS_AUTHORIZER_URL ?? "",
					VIDOS_API_KEY: process.env.VIDOS_API_KEY ?? "",
					PORT: String(mcpWinePort),
					MCP_PATH: mcpPath,
					PUBLIC_BASE_URL: mcpWinePublicBaseUrl,
				},
			},
		},
		publicEndpoint: {
			containerName: "mcp",
			containerPort: mcpWinePort,
		},
	};
	const mcpCarRentalDeploymentConfig = {
		containers: {
			mcp: {
				image: mcpCarRentalImageTag,
				ports: { [mcpCarRentalPort]: "HTTP" },
				environment: {
					VIDOS_AUTHORIZER_URL: process.env.VIDOS_AUTHORIZER_URL ?? "",
					VIDOS_API_KEY: process.env.VIDOS_API_KEY ?? "",
					PORT: String(mcpCarRentalPort),
					MCP_PATH: mcpPath,
					PUBLIC_BASE_URL: mcpCarRentalPublicBaseUrl,
				},
			},
		},
		publicEndpoint: {
			containerName: "mcp",
			containerPort: mcpCarRentalPort,
		},
	};
	const ticketAgentDeploymentConfig = {
		containers: {
			"ticket-agent": {
				image: ticketAgentImageTag,
				ports: { 53914: "HTTP" },
				environment: {
					VIDOS_AUTHORIZER_URL: process.env.VIDOS_AUTHORIZER_URL ?? "",
					VIDOS_API_KEY: process.env.VIDOS_API_KEY ?? "",
					DATABASE_PATH: "/app/data/ticket-agent.db",
					ISSUER_PUBLIC_URL:
						process.env.TICKET_AGENT_ISSUER_PUBLIC_URL ?? ticketAgentEndpoint,
				},
			},
		},
		publicEndpoint: {
			containerName: "ticket-agent",
			containerPort: 53914,
		},
	};

	const deploymentPayload = JSON.stringify(deploymentConfig)
		.replace(/\\/g, "\\\\")
		.replace(/'/g, "\\'");
	const mcpWineDeploymentPayload = JSON.stringify(mcpWineDeploymentConfig)
		.replace(/\\/g, "\\\\")
		.replace(/'/g, "\\'");
	const mcpCarRentalDeploymentPayload = JSON.stringify(
		mcpCarRentalDeploymentConfig,
	)
		.replace(/\\/g, "\\\\")
		.replace(/'/g, "\\'");
	const ticketAgentDeploymentPayload = JSON.stringify(
		ticketAgentDeploymentConfig,
	)
		.replace(/\\/g, "\\\\")
		.replace(/'/g, "\\'");

	run(
		`aws lightsail create-container-service-deployment --service-name ${serviceName} --region ${region} --cli-input-json '${deploymentPayload}'`,
	);
	log("Updating MCP Wine Agent service...");
	run(
		`aws lightsail create-container-service-deployment --service-name ${mcpWineServiceName} --region ${region} --cli-input-json '${mcpWineDeploymentPayload}'`,
	);
	log("Updating MCP Car Rental Agent service...");
	run(
		`aws lightsail create-container-service-deployment --service-name ${mcpCarRentalServiceName} --region ${region} --cli-input-json '${mcpCarRentalDeploymentPayload}'`,
	);
	log("Updating Ticket Agent service...");
	run(
		`aws lightsail create-container-service-deployment --service-name ${ticketAgentServiceName} --region ${region} --cli-input-json '${ticketAgentDeploymentPayload}'`,
	);

	log("Waiting for deployment to complete...");
	while (true) {
		const state = runCapture(
			`aws lightsail get-container-services --service-name ${serviceName} --region ${region} | jq -r '.containerServices[0].state'`,
		);
		if (state === "RUNNING") {
			break;
		}
		log(`Current state: ${state}`);
		run("sleep 5");
	}

	log("Deployment triggered.");
	log(`Endpoint: ${endpoint}`);
	log(`Wine MCP Endpoint: ${mcpWineEndpoint}`);
	log(`Car Rental MCP Endpoint: ${mcpCarRentalEndpoint}`);
	log(`Ticket Agent Endpoint: ${ticketAgentEndpoint}`);
};

try {
	main();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	process.stderr.write(`${message}\n`);
	process.exit(1);
}
