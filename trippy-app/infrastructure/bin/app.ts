#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TrippyBackendStack } from '../lib/backend-stack';
import { TrippyDatabaseStack } from '../lib/database-stack';
import { TrippyAuthStack } from '../lib/auth-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
};

const authStack = new TrippyAuthStack(app, 'TrippyAuthStack', { env });

const databaseStack = new TrippyDatabaseStack(app, 'TrippyDatabaseStack', { env });

new TrippyBackendStack(app, 'TrippyBackendStack', {
  tables: databaseStack.tables,
  userPool: authStack.userPool,
  env
});
