#!/usr/bin/env node
import 'source-map-support/register';
import { App, Stack } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { FrontendStaticSiteStack } from '../lib/frontend-static-site-stack';

const app = new App();

const environmentName = process.env.ENVIRONMENT?.replace(/_/g, '-') ?? 'preview';

// Determine domain based on environment
const isProduction = environmentName === 'main';
const domainName = isProduction 
  ? 'dragondemadera.com'
  : `${environmentName}.dragondemadera.com`;
const wwwDomainName = `www.${domainName}`;

const hostedZoneId = 'Z1UQ3WS25MPB2D';

//Certificate stack in us-east-1 (required by CloudFront)
const certStack = new Stack(app, `ddm-web-cert-${environmentName}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  crossRegionReferences: true,
});

const hostedZone = route53.HostedZone.fromHostedZoneAttributes(certStack, 'HostedZone', {
  hostedZoneId: hostedZoneId,
  zoneName: 'dragondemadera.com',
});

const certificate = new acm.Certificate(certStack, 'Certificate', {
  domainName: domainName,
  subjectAlternativeNames: [wwwDomainName],
  validation: acm.CertificateValidation.fromDns(hostedZone),
});

// Main frontend stack
new FrontendStaticSiteStack(app, `ddm-web-${environmentName}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'eu-west-1',
  },
  crossRegionReferences: true,
  environmentName,
  buildPath: '../frontend/dist',
  domainName,
  wwwDomainName,
  hostedZoneId,
  certificate,
});


