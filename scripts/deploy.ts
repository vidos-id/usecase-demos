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
	const region = getStackOutput("region") || "eu-west-1";
	const endpoint = getStackOutput("endpoint");

	const tag = getGitSha() ?? getTimestamp();
	const imageTag = `${repositoryUrl}:${tag}`;

	log(`Using image tag: ${imageTag}`);
	log("Authenticating to ECR...");
	run(
		`aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${repositoryUrl}`,
	);

	log("Building Docker image...");
	run(`docker build -f Dockerfile.server -t ${imageTag} .`);

	log("Pushing image to ECR...");
	run(`docker push ${imageTag}`);

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

	const deploymentPayload = JSON.stringify(deploymentConfig)
		.replace(/\\/g, "\\\\")
		.replace(/'/g, "\\'");

	run(
		`aws lightsail create-container-service-deployment --service-name ${serviceName} --region ${region} --cli-input-json '${deploymentPayload}'`,
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
};

try {
	main();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	process.stderr.write(`${message}\n`);
	process.exit(1);
}
