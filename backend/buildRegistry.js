import fs from 'fs/promises';
import path from 'path';

const REGISTRY_FILE = path.join(process.cwd(), 'buildRegistry.json');
const BUILDS_DIR = path.join(process.cwd(), 'builds');

export async function initRegistry() {
  try {
    await fs.access(REGISTRY_FILE);
  } catch (error) {
    // File doesn't exist, create it
    await fs.writeFile(REGISTRY_FILE, JSON.stringify([], null, 2));
  }
}

export async function getGlobalRegistry() {
  const data = await fs.readFile(REGISTRY_FILE, 'utf-8');
  return JSON.parse(data);
}

export async function getIndividualConfig(owner, repoName) {
  const configPath = path.join(BUILDS_DIR, owner, repoName, 'config.json');
  const data = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(data);
}

export async function addToRegistry(buildConfig) {
  // Add to global registry
  const registry = await getGlobalRegistry();
  registry.push(buildConfig);
  await fs.writeFile(REGISTRY_FILE, JSON.stringify(registry, null, 2));

  // Add individual config file
  const configPath = path.join(BUILDS_DIR, buildConfig.owner, buildConfig.repoName, 'config.json');
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(buildConfig, null, 2));
}

export async function updateRegistry(owner, repoName, updates) {
  // Update global registry
  const registry = await getGlobalRegistry();
  const index = registry.findIndex(config => config.owner === owner && config.repoName === repoName);
  if (index !== -1) {
    registry[index] = { ...registry[index], ...updates };
    await fs.writeFile(REGISTRY_FILE, JSON.stringify(registry, null, 2));
  }

  // Update individual config file
  const configPath = path.join(BUILDS_DIR, owner, repoName, 'config.json');
  const individualConfig = await getIndividualConfig(owner, repoName);
  const updatedConfig = { ...individualConfig, ...updates };
  await fs.writeFile(configPath, JSON.stringify(updatedConfig, null, 2));
}

export async function removeFromRegistry(owner, repoName) {
  // Remove from global registry
  const registry = await getGlobalRegistry();
  const updatedRegistry = registry.filter(config => !(config.owner === owner && config.repoName === repoName));
  await fs.writeFile(REGISTRY_FILE, JSON.stringify(updatedRegistry, null, 2));

  // Remove individual config file
  const configPath = path.join(BUILDS_DIR, owner, repoName, 'config.json');
  await fs.unlink(configPath);
}

export async function incrementDeployCount(owner, repoName) {
  const registry = await getGlobalRegistry();
  const index = registry.findIndex(config => config.owner === owner && config.repoName === repoName);
  if (index !== -1) {
    registry[index].deployCount = (registry[index].deployCount || 0) + 1;
    await fs.writeFile(REGISTRY_FILE, JSON.stringify(registry, null, 2));
  }

  const configPath = path.join(BUILDS_DIR, owner, repoName, 'config.json');
  const config = await getIndividualConfig(owner, repoName);
  config.deployCount = (config.deployCount || 0) + 1;
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

export async function resetDeployCounts() {
  const registry = await getGlobalRegistry();
  registry.forEach(config => {
    config.deployCount = 0;
  });
  await fs.writeFile(REGISTRY_FILE, JSON.stringify(registry, null, 2));

  for (const config of registry) {
    const configPath = path.join(BUILDS_DIR, config.owner, config.repoName, 'config.json');
    const individualConfig = await getIndividualConfig(config.owner, config.repoName);
    individualConfig.deployCount = 0;
    await fs.writeFile(configPath, JSON.stringify(individualConfig, null, 2));
  }
}

export async function getDeployCount(owner, repoName) {
  const config = await getIndividualConfig(owner, repoName);
  return config.deployCount || 0;
}

